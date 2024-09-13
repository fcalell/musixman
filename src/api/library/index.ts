import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'
import { db } from '@/db'
import { library } from '@/db/schema/library'
import { TRPCError } from '@trpc/server'
import differenceWith from 'lodash/differenceWith'
import mean from 'lodash/mean'
import { parseFile } from 'music-metadata'
import { z } from 'zod'
import { getConfig } from '../config'
import server from '../server'
const readdir = promisify(fs.readdir)

export default server.router({
  getLocal: server.procedure.query(async () => {
    const { localLibraryPath } = await getConfig()
    if (!localLibraryPath) throw new TRPCError({ code: 'PRECONDITION_FAILED' })

    const localFiles = await readdir(localLibraryPath, { recursive: true }).then((files) =>
      files.filter((file): file is string => {
        return typeof file === 'string' && path.extname(file) === '.mp3'
      })
    )
    const dbFiles = await db.select().from(library)

    const filesNotInDb = differenceWith(
      localFiles,
      dbFiles,
      (localFile, dbFile) => `${localLibraryPath}/${localFile}` === dbFile.filepath
    )

    const fileList = dbFiles
    const filesToInsert: typeof dbFiles = []
    for (const file of filesNotInDb) {
      const meta = await parseFile(path.join(localLibraryPath, file))
      const outputMeta = {
        id: randomUUID(),
        title: meta.common.title ?? null,
        artist: meta.common.artist ?? null,
        album: meta.common.album ?? null,
        genre: meta.common.genre ?? null,
        year: meta.common.year ?? null,
        comment: meta.common.comment?.at(0)?.text ?? null,
        bitrate: (meta.format.bitrate && Math.floor(meta.format.bitrate / 1000)) ?? null,
        duration: meta.format.duration ?? null,
        filepath: `${localLibraryPath}/${file}` ?? null,
        filename: file.split('/').pop() ?? null,
      }
      fileList.push(outputMeta)
      filesToInsert.push(outputMeta)
    }
    if (filesToInsert.length > 0) {
      await db.insert(library).values(filesToInsert)
    }
    return { fileList }
  }),
  findDuplicates: server.procedure
    .input(
      z.object({
        probability: z.number().min(0).max(1),
        matchTags: z.boolean(),
        matchFilename: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      function compareTwoStrings(a: string, b: string) {
        const first = a.replace(/[^A-Z0-9]+/gi, '')
        const second = b.replace(/[^A-Z0-9]+/gi, '')

        if (first === second) return 1 // identical or empty
        if (first.length < 2 || second.length < 2) return 0 // if either is a 0-letter or 1-letter string

        const firstBigrams = new Map()
        for (let i = 0; i < first.length - 1; i++) {
          const bigram = first.substring(i, i + 2)
          const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) + 1 : 1

          firstBigrams.set(bigram, count)
        }

        let intersectionSize = 0
        for (let i = 0; i < second.length - 1; i++) {
          const bigram = second.substring(i, i + 2)
          const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) : 0

          if (count > 0) {
            firstBigrams.set(bigram, count - 1)
            intersectionSize++
          }
        }

        return (2.0 * intersectionSize) / (first.length + second.length - 2)
      }
      const files = await db.select().from(library)
      const calculateSimilarity = (
        file1: (typeof files)[number],
        file2: (typeof files)[number]
      ) => {
        const similarities = []

        if (input.matchTags) {
          if (file1.title && file2.title) {
            similarities.push(compareTwoStrings(file1.title, file2.title))
          }
          if (file1.artist && file2.artist) {
            similarities.push(compareTwoStrings(file1.artist, file2.artist))
          }
        }
        if (input.matchFilename && file1.filename && file2.filename) {
          similarities.push(compareTwoStrings(file1.filename, file2.filename))
        }
        return similarities.length > 0 ? mean(similarities) : 0
      }
      const duplicateGroups: (typeof files)[] = []
      const processedIds = new Set<string>()

      for (let i = 0; i < files.length; i++) {
        if (processedIds.has(files[i].id)) continue

        const group = [files[i]]
        processedIds.add(files[i].id)

        for (let j = i + 1; j < files.length; j++) {
          if (processedIds.has(files[j].id)) continue

          const similarity = calculateSimilarity(files[i], files[j])
          if (similarity >= input.probability) {
            group.push(files[j])
            processedIds.add(files[j].id)
          }
        }

        if (group.length > 1) {
          duplicateGroups.push(group)
        }
      }
      return { duplicateGroups }
    }),
})
