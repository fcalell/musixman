import * as fs from 'node:fs'

interface FrameHeaderInfo {
  mpegVersion: number
  layer: number
  bitrate: number
  sampleRate: number
  samplesPerFrame: number
  hasCRC: boolean
}

/**
 * Extracts duration and bitrate from an MP3 file.
 * @param filePath - The path to the MP3 file.
 * @returns A Promise that resolves to an object containing the duration (in seconds) and bitrate (in kbps).
 */
async function getDurationAndBitrate(
  filePath: string
): Promise<{ duration: number; bitrate: number }> {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 }) // 64KB buffer
    let fileSize: number
    let buffer = Buffer.alloc(0)
    const offset = 0

    // Get file size asynchronously
    fs.stat(filePath, (err, stats) => {
      if (err) {
        stream.destroy()
        return reject(err)
      }
      fileSize = stats.size
    })

    stream.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk])
      try {
        const result = parseBuffer(buffer, fileSize)
        if (result) {
          stream.destroy()
          resolve(result)
        }
      } catch (error) {
        stream.destroy()
        reject(error)
      }
    })

    stream.on('error', (err) => {
      reject(err)
    })

    stream.on('end', () => {
      reject(new Error('Could not extract MP3 duration and bitrate'))
    })
  })
}

function parseBuffer(
  buffer: Buffer,
  fileSize: number
): { duration: number; bitrate: number } | null {
  let offset = 0

  // Check if we have enough data to read ID3v2 header
  if (buffer.length < 10) {
    return null
  }

  // Check for ID3v2 tags at the beginning
  if (buffer.toString('utf8', 0, 3) === 'ID3') {
    const tagSize = getID3v2TagSize(buffer)
    if (buffer.length < tagSize + 10) {
      return null // Need more data
    }
    offset += tagSize
  }

  // Find the first MP3 frame header
  const headerOffset = findFrameHeader(buffer, offset)
  if (headerOffset < 0) return null
  offset = headerOffset

  if (buffer.length < offset + 4) {
    return null // Need more data
  }

  const frameHeader = buffer.readUInt32BE(offset)
  const info = parseFrameHeader(frameHeader)

  // Check for Xing/Info header
  const xingOffset = offset + 4 + (info.hasCRC ? 2 : 0)
  if (buffer.length < xingOffset + 8) {
    return null // Need more data
  }
  const xingHeader = buffer.toString('utf8', xingOffset, xingOffset + 4)

  let duration: number
  let bitrate: number

  if (xingHeader === 'Xing' || xingHeader === 'Info') {
    if (buffer.length < xingOffset + 120) {
      return null // Need more data
    }
    const xingData = parseXingHeader(buffer, xingOffset, info.sampleRate, info.samplesPerFrame)
    duration = xingData.duration
    bitrate = xingData.bitrate
  } else {
    // Estimate for CBR files
    bitrate = info.bitrate

    // Exclude any ID3v2 tag size from fileSize
    const audioDataSize = fileSize - offset

    duration = (audioDataSize * 8) / (bitrate * 1000)
  }

  return { duration, bitrate }
}

function getID3v2TagSize(buffer: Buffer): number {
  const flags = buffer[5]

  const z0 = buffer[6]
  const z1 = buffer[7]
  const z2 = buffer[8]
  const z3 = buffer[9]

  const tagSize = ((z0 & 0x7f) << 21) | ((z1 & 0x7f) << 14) | ((z2 & 0x7f) << 7) | (z3 & 0x7f)

  let footerSize = 0
  if (flags & 0x10) {
    footerSize = 10
  }

  return 10 + tagSize + footerSize
}

function findFrameHeader(buffer: Buffer, offset: number): number {
  const len = buffer.length - 4 // Need at least 4 bytes for a header
  for (let i = offset; i < len; i++) {
    if (buffer[i] === 0xff && (buffer[i + 1] & 0xe0) === 0xe0) {
      // Check if it's a valid frame header
      const header = buffer.readUInt32BE(i)
      try {
        parseFrameHeader(header)
        return i
      } catch {
        // Not a valid frame header, continue searching
      }
    }
  }
  return -1
}

function parseFrameHeader(header: number): FrameHeaderInfo {
  const versionIndex = (header >> 19) & 0x3
  const layerIndex = (header >> 17) & 0x3
  const bitrateIndex = (header >> 12) & 0xf
  const sampleRateIndex = (header >> 10) & 0x3
  const hasCRC = ((header >> 16) & 0x1) === 0

  const mpegVersions = [2.5, null, 2, 1]
  const layers = [null, 3, 2, 1]

  const mpegVersion = mpegVersions[versionIndex]
  const layer = layers[layerIndex]

  if (!mpegVersion || !layer) {
    throw new Error('Invalid MPEG version or layer')
  }

  const bitrateTable: { [key: string]: (number | null)[] } = {
    '1-1': [null, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
    '1-2': [null, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
    '1-3': [null, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
    '2-1': [null, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
    '2-2': [null, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
    '2-3': [null, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  }

  const sampleRateTable: { [key: number]: number[] } = {
    1: [44100, 48000, 32000, 0],
    2: [22050, 24000, 16000, 0],
    2.5: [11025, 12000, 8000, 0],
  }

  const samplesPerFrameTable: { [key: number]: { [key: number]: number } } = {
    1: { 1: 384, 2: 1152, 3: 1152 },
    2: { 1: 384, 2: 1152, 3: 576 },
    2.5: { 1: 384, 2: 1152, 3: 576 },
  }

  const bitrateKey = `${mpegVersion}-${layer}`
  const bitrateArray = bitrateTable[bitrateKey]
  if (!bitrateArray) {
    throw new Error('Invalid bitrate key')
  }

  const bitrate = bitrateArray[bitrateIndex]
  if (!bitrate) {
    throw new Error('Invalid bitrate')
  }

  const sampleRates = sampleRateTable[mpegVersion]
  const sampleRate = sampleRates[sampleRateIndex]
  if (!sampleRate) {
    throw new Error('Invalid sample rate')
  }

  const samplesPerFrame = samplesPerFrameTable[mpegVersion][layer]

  return { mpegVersion, layer, bitrate, sampleRate, samplesPerFrame, hasCRC }
}

function parseXingHeader(
  buffer: Buffer,
  offset: number,
  sampleRate: number,
  samplesPerFrame: number
): { duration: number; bitrate: number } {
  const flags = buffer.readUInt32BE(offset + 4)
  let frames = 0
  let bytes = 0
  let xingDataOffset = offset + 8

  if (flags & 0x1) {
    frames = buffer.readUInt32BE(xingDataOffset)
    xingDataOffset += 4
  }
  if (flags & 0x2) {
    bytes = buffer.readUInt32BE(xingDataOffset)
    xingDataOffset += 4
  }

  if (frames === 0 || bytes === 0) {
    throw new Error('Invalid Xing header data')
  }

  const duration = (frames * samplesPerFrame) / sampleRate
  const bitrate = (bytes * 8) / duration / 1000

  return { duration, bitrate }
}

export default getDurationAndBitrate
