import { TRPCError } from '@trpc/server'
import { dialog } from 'electron'
import server from '../server'

export default server.router({
  selectFolder: server.procedure.mutation(async () => {
    const dir = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (!dir.filePaths || dir.filePaths.length === 0)
      throw new TRPCError({ code: 'CLIENT_CLOSED_REQUEST' })
    return dir.filePaths[0]
  }),
})
