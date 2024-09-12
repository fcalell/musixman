import MusicFileTable from '@/components/features/music-file-table'
import type { MusicFile } from '@/types/library'
import React from 'react'

interface DuplicateGroupProps {
  files: MusicFile[]
}

export function DuplicateGroup({ files }: DuplicateGroupProps) {
  return <MusicFileTable musicFiles={files} />
}
