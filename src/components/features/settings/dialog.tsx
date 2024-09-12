import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { trpc } from '@/lib/utils'
import { Settings } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog'
import SettingsForm from './form'

const SettingsDialog = () => {
  const { data, error } = trpc.config.read.useQuery()
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open || !!error} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='ghost' size='icon' aria-label='Settings'>
          <Settings className='h-5 w-5' />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Make changes to your settings here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        {(data || error) && (
          <SettingsForm
            initialValues={data}
            onSuccess={() => {
              setOpen(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default SettingsDialog
