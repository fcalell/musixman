import config from './config'
import electron from './electron'
import library from './library'
import server from './server'

export const router = server.router({
  library,
  config,
  electron,
})

export type AppRouter = typeof router
