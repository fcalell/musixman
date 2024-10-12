import server from '@/api/server'
import { db } from '@/db'
import { library } from '@/db/schema/library'
import NodeID3 from 'node-id3'

export default server.router({
  fixFormatting: server.procedure.query(async () => {
    const dbFiles = await db.select().from(library)
    for (const dbFile of dbFiles) {
      const genres = dbFile.genre.split(/,\/\\/)
    }
  }),
})
