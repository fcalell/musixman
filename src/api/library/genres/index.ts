import server from '@/api/server'
import { db } from '@/db'
import { library } from '@/db/schema/library'
import NodeID3 from 'node-id3'

export default server.router({
  fixFormatting: server.procedure.query(async () => {
    const dbFiles = await db.select().from(library)
    for (const dbFile of dbFiles) {
      let genres: string[] = []
      if (typeof dbFile.genre === 'string') {
        genres = dbFile.genre.split(/,\//)
      } else if (Array.isArray(dbFile.genre)) {
        for (const genre in dbFile.genre) {
          genres = genres.concat(genre.split(/,\//))
          if (dbFile.filepath) NodeID3.write({ genre: genres.join('\\') }, dbFile.filepath)
        }
      }
    }
  }),
})
