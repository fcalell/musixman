import MusicFileTable from '@/components/features/music-file-table'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/')({
  component: Index,
})
const LoadingSpinner = () => (
  <div className='flex flex-col items-center justify-center h-64'>
    <div className='w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin' />
    <p className='mt-4 text-lg font-semibold text-primary'>Loading your tracks...</p>
    <p className='mt-2 text-sm text-muted-foreground'>
      This may take a moment depending on your library size.
    </p>
  </div>
)

function Index() {
  const { data: config } = trpc.config.read.useQuery()
  const { data, isLoading, error, refetch } = trpc.library.getLocal.useQuery(undefined, {
    enabled: Boolean(config?.localLibraryPath),
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className='flex flex-col items-center gap-4 justify-center h-64'>
        <p className='text-lg font-semibold text-warning'>Error loading tracks</p>
        <p className='text-sm text-muted-foreground'>{error.message}</p>
        <Button
          onClick={() => {
            refetch()
          }}
        >
          Retry
        </Button>
      </div>
    )
  }

  return <MusicFileTable searchable musicFiles={data?.fileList || []} />
}
