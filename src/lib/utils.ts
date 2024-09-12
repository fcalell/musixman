import type { AppRouter } from '@/api'
import { createTRPCReact } from '@trpc/react-query'
import { type ClassValue, clsx } from 'clsx'
import { ipcLink } from 'electron-trpc/renderer'
import superjson from 'superjson'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const trpc = createTRPCReact<AppRouter>()
export const createTrpcClient = () =>
  trpc.createClient({
    transformer: superjson,
    links: [ipcLink()],
  })
