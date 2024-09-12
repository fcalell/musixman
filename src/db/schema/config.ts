import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-zod'

export const config = sqliteTable('config', {
  id: text('id').primaryKey().default('Default').unique(),
  localLibraryPath: text('localLibraryPath').notNull(),
})

export const insertConfigSchema = createInsertSchema(config)
