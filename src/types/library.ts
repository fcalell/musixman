import type { AppRouter } from '@/api'
import type { inferProcedureOutput } from '@trpc/server'

export type MusicFile = inferProcedureOutput<AppRouter['library']['getLocal']>['fileList'][number]
