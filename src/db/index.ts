import path from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { app } from 'electron'
import { config } from './schema/config'
import { library } from './schema/library'

const dbPath = import.meta.env.DEV ? 'sqlite.db' : path.join(app.getPath('userData'), 'data.db')

const sqlite = new Database(dbPath)

export const db = drizzle(sqlite, { schema: { config, library } })

export const dbMigrate = async () => {
  migrate(db, {
    migrationsFolder: path.join(import.meta.dirname, '../../drizzle'),
  })
}
