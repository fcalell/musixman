import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { MusicFile } from '@/types/library'
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import debounce from 'lodash/debounce'
import { ArrowUpDown, MoreHorizontal, Play } from 'lucide-react'
import React, { useState, useCallback, useMemo } from 'react'
import DeleteFileButton from './library/delete-file-button'
import { useMusicPlayerStore } from './music-player'

const TruncatedCell = React.memo(({ content }: { content: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className='truncate max-w-[200px]'>{content}</div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
))

TruncatedCell.displayName = 'TruncatedCell'

const GenreBadges = React.memo(({ genres }: { genres: string[] }) => (
  <div className='flex flex-wrap gap-1'>
    {genres.map((genre) => (
      <Badge key={genre} variant='secondary'>
        {genre}
      </Badge>
    ))}
  </div>
))

GenreBadges.displayName = 'GenreBadges'

const columns: ColumnDef<MusicFile>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost-link'
          size='text'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Title
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => <TruncatedCell content={row.getValue('title') || ''} />,
  },
  {
    accessorKey: 'artist',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost-link'
          size='text'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Artist
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => <TruncatedCell content={row.getValue('artist') || ''} />,
  },
  {
    accessorKey: 'album',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost-link'
          size='text'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Album
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => <TruncatedCell content={row.getValue('album') || ''} />,
  },
  {
    accessorKey: 'genre',
    header: 'Genre',
    cell: ({ row }) => {
      const genres = row.getValue('genre') as string[] | undefined
      return genres ? <GenreBadges genres={genres} /> : null
    },
  },
  {
    accessorKey: 'year',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost-link'
          size='text'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Year
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
  },
  {
    accessorKey: 'duration',
    header: 'Duration',
    cell: ({ row }) => {
      const duration = row.getValue('duration') as number | undefined
      if (!duration) return null
      const minutes = Math.floor(duration / 60)
      const seconds = Math.floor(duration - minutes * 60)
      return (
        <span>
          {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </span>
      )
    },
  },
  {
    accessorKey: 'bitrate',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost-link'
          size='text'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Bitrate
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const bitrate = row.getValue('bitrate') as number | undefined
      return bitrate ? (
        <span className={bitrate < 320 ? 'text-warning' : ''}>{bitrate} kbps</span>
      ) : null
    },
  },
  {
    accessorKey: 'filename',
    header: 'Filename',
    cell: ({ row }) => <TruncatedCell content={row.getValue('filename')} />,
  },
  {
    accessorKey: 'comment',
    header: 'Comment',
    cell: ({ row }) => <TruncatedCell content={row.getValue('comment') || ''} />,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const music = row.original
      const { setCurrentTrack } = useMusicPlayerStore()

      const playTrack = () => {
        setCurrentTrack({
          title: music.title || '',
          artist: music.artist || '',
          audioSrc: music.filepath || '',
        })
      }

      return (
        <div className='flex gap-1'>
          <Button
            variant='ghost'
            size='icon'
            onClick={playTrack}
            aria-label={`Play ${music.title || music.filename}`}
          >
            <Play className='h-4 w-4' />
          </Button>
          <DeleteFileButton musicFile={music} />
        </div>
      )
    },
  },
]
interface Props {
  musicFiles?: MusicFile[]
  searchable?: boolean
}

export default function MusicFileTable({ musicFiles = [], searchable = false }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    year: false,
    filename: false,
  })

  const table = useReactTable({
    data: musicFiles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
  })

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setGlobalFilter(value)
      }, 300),
    []
  )

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSearch(event.target.value)
    },
    [debouncedSearch]
  )

  return (
    <div className='flex gap-6 flex-col h-full'>
      <div className='flex justify-between items-center'>
        {searchable ? (
          <Input
            placeholder='Search all columns...'
            onChange={handleSearchChange}
            className='max-w-sm'
          />
        ) : (
          <div />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' className='ml-auto'>
              Columns <MoreHorizontal className='ml-2 h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className='capitalize'
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
