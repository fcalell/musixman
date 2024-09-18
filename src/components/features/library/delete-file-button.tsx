import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc'
import type { MusicFile } from '@/types/library'
import { Trash2 } from 'lucide-react'
import { type FC, useState } from 'react'

interface Props {
  musicFile: MusicFile
}

const DeleteFileButton: FC<Props> = ({ musicFile }) => {
  const [open, setOpen] = useState(false)
  const { mutate } = trpc.library.deleteFile.useMutation()
  const handleDelete = () => {
    mutate({ id: musicFile.id })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant='ghost' size='icon' aria-label={`Delete ${musicFile.filename}`}>
          <Trash2 className='h-4 w-4' />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the file "
            {musicFile.filepath}" from your library and filesystem.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteFileButton
