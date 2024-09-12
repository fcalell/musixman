import { db } from '@/db'
import { config, insertConfigSchema } from '@/db/schema/config'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import server from '../server'

export const getConfig = async (id = 'Default') => {
  const dbConfig = await db.query.config.findFirst({
    where: eq(config.id, id),
  })
  if (!dbConfig) {
    throw new TRPCError({ code: 'NOT_FOUND' })
  }
  return dbConfig
}

export default server.router({
  read: server.procedure.query(async () => {
    return getConfig()
  }),
  update: server.procedure.input(insertConfigSchema).mutation(async (req) => {
    try {
      const dbConfig = await getConfig()
      await db.update(config).set(req.input).where(eq(config.id, dbConfig.id))
    } catch (e) {
      if (e instanceof TRPCError && e.code === 'NOT_FOUND')
        await db.insert(config).values(req.input)
      else throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
    }
    return
  }),
})
