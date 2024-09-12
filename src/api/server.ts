import { initTRPC } from '@trpc/server'
import superjson from 'superjson'

export default initTRPC.create({
  isServer: true,
  transformer: superjson,
})
