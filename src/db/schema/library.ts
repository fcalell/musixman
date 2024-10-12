import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-zod'

export const library = sqliteTable('library', {
  id: text('id').primaryKey().unique(),
  title: text('title'),
  artist: text('artist'),
  album: text('album'),
  genre: text('genre'),
  year: integer('year'),
  comment: text('comment'),
  bitrate: integer('bitrate'),
  duration: real('duration'),
  filepath: text('filepath'),
  filename: text('filename'),
})

export const insertLibrarySchema = createInsertSchema(library)
