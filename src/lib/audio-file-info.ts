import * as fs from 'node:fs'

interface FrameHeaderInfo {
  mpegVersion: number
  layer: number
  bitrate: number
  sampleRate: number
  samplesPerFrame: number
  hasCRC: boolean
  hasPadding: boolean
  channelMode: number
}

interface DurationBitrate {
  duration: number
  bitrate: number
}

/**
 * Extracts duration and bitrate from an MP3 file, supporting both CBR and VBR files.
 * @param filePath - The path to the MP3 file.
 * @returns A Promise that resolves to an object containing the duration (in seconds) and bitrate (in kbps).
 */
async function getDurationAndBitrate(filePath: string): Promise<DurationBitrate> {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { highWaterMark: 256 * 1024 }) // 256KB buffer
    let fileSize: number
    let buffer = Buffer.alloc(0)

    // Get file size asynchronously
    fs.stat(filePath, (err, stats) => {
      if (err) {
        stream.destroy()
        return reject(err)
      }
      fileSize = stats.size
    })

    stream.on('data', (c) => {
      const chunk = typeof c === 'string' ? Buffer.from(c) : c
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

function parseBuffer(buffer: Buffer, fileSize: number): DurationBitrate | null {
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

  let frameOffset = findFrameHeader(buffer, offset)
  if (frameOffset < 0) return null
  offset = frameOffset

  if (buffer.length < offset + 4) {
    return null // Need more data
  }

  const frameHeader = buffer.readUInt32BE(offset)
  const firstFrameInfo = parseFrameHeader(frameHeader)

  let info = firstFrameInfo

  // We'll attempt to scan the first few frames (e.g., 3 frames) for Xing/VBRI headers
  const maxFramesToScan = 3
  for (let i = 0; i < maxFramesToScan; i++) {
    if (buffer.length < offset + 4) {
      return null // Need more data
    }

    const frameHeader = buffer.readUInt32BE(offset)
    info = parseFrameHeader(frameHeader)

    // Calculate the offset to possible Xing/VBRI headers
    const sideInfoLength = getSideInfoLength(info.mpegVersion, info.channelMode)
    const dataOffset = offset + 4 + (info.hasCRC ? 2 : 0) + sideInfoLength

    // Ensure we have enough data
    if (buffer.length < dataOffset + 128) {
      return null // Need more data
    }

    // Check for Xing/Info header
    const xingResult = parseXingHeader(buffer, offset, info)
    if (xingResult) {
      return xingResult
    }

    // Check for VBRI header
    const vbriResult = parseVBRIHeader(buffer, offset, info)
    if (vbriResult) {
      return vbriResult
    }

    // Move to next frame
    const frameSize = calculateFrameSize(info)
    if (frameSize <= 0) {
      // Invalid frame size, cannot proceed
      break
    }
    offset += frameSize

    // Find next frame header
    frameOffset = findFrameHeader(buffer, offset)
    if (frameOffset < 0) {
      // No more frames found
      break
    }
    offset = frameOffset
  }

  // If we reach here, we didn't find a Xing or VBRI header
  // Proceed to estimate duration for CBR files

  // Use the info from the first frame
  const bitrate = firstFrameInfo.bitrate
  const audioDataSize = fileSize - offset
  const duration = (audioDataSize * 8) / (bitrate * 1000)

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
  const hasPadding = ((header >> 9) & 0x1) === 1
  const hasCRC = ((header >> 16) & 0x1) === 0
  const channelMode = (header >> 6) & 0x3

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
    1: [44100, 48000, 32000],
    2: [22050, 24000, 16000],
    2.5: [11025, 12000, 8000],
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

  return {
    mpegVersion,
    layer,
    bitrate,
    sampleRate,
    samplesPerFrame,
    hasCRC,
    hasPadding,
    channelMode,
  }
}

function getSideInfoLength(mpegVersion: number, channelMode: number): number {
  if (mpegVersion === 1) {
    // MPEG 1
    return channelMode === 3 ? 17 : 32
  }
  // MPEG 2 or 2.5
  return channelMode === 3 ? 9 : 17
}

function calculateFrameSize(info: FrameHeaderInfo): number {
  const padding = info.hasPadding ? 1 : 0
  let frameSize = 0
  const bitrate = info.bitrate * 1000 // Convert kbps to bps
  const sampleRate = info.sampleRate

  if (info.layer === 1) {
    frameSize = Math.floor(((12 * bitrate) / sampleRate + padding) * 4)
  } else {
    frameSize = Math.floor((144 * bitrate) / sampleRate + padding)
  }
  return frameSize
}

function parseXingHeader(
  buffer: Buffer,
  frameOffset: number,
  info: FrameHeaderInfo
): DurationBitrate | null {
  const sideInfoLength = getSideInfoLength(info.mpegVersion, info.channelMode)
  const xingOffset = frameOffset + 4 + (info.hasCRC ? 2 : 0) + sideInfoLength

  const xingHeaderTag = buffer.toString('utf8', xingOffset, xingOffset + 4)
  if (xingHeaderTag !== 'Xing' && xingHeaderTag !== 'Info') {
    return null
  }

  const flags = buffer.readUInt32BE(xingOffset + 4)
  let frames = 0
  let bytes = 0

  let xingDataOffset = xingOffset + 8

  if (flags & 0x1) {
    frames = buffer.readUInt32BE(xingDataOffset)
    xingDataOffset += 4
  }
  if (flags & 0x2) {
    bytes = buffer.readUInt32BE(xingDataOffset)
    xingDataOffset += 4
  }
  if (flags & 0x4) {
    // Skip TOC data
    xingDataOffset += 100
  }
  // Skipping Quality indicator (flags & 0x8)

  if (frames === 0 || bytes === 0) {
    return null // Invalid Xing header data
  }

  const duration = (frames * info.samplesPerFrame) / info.sampleRate
  const bitrate = (bytes * 8) / duration / 1000

  return { duration, bitrate }
}

function parseVBRIHeader(
  buffer: Buffer,
  frameOffset: number,
  info: FrameHeaderInfo
): DurationBitrate | null {
  const vbriOffset = frameOffset + 4 + (info.hasCRC ? 2 : 0) + 32 // VBRI header is always at this offset

  if (buffer.length < vbriOffset + 26) {
    return null // Not enough data
  }

  const vbriHeaderTag = buffer.toString('utf8', vbriOffset, vbriOffset + 4)
  if (vbriHeaderTag !== 'VBRI') {
    return null
  }

  const bytes = buffer.readUInt32BE(vbriOffset + 10)
  const frames = buffer.readUInt32BE(vbriOffset + 14)

  if (frames === 0 || bytes === 0) {
    return null // Invalid VBRI header data
  }

  const duration = (frames * info.samplesPerFrame) / info.sampleRate
  const bitrate = (bytes * 8) / duration / 1000

  return { duration, bitrate }
}

export default getDurationAndBitrate
