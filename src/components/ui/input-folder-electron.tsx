import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/utils'
import { FolderInputIcon } from 'lucide-react'
import type { FC } from 'react'
import { Label } from './label'

interface InputFolderElectronProps {
  value?: string | null
  onChange: (value: string) => void
  onBlur?: () => void
}

const InputFolderElectron: FC<InputFolderElectronProps> = ({ value, onChange, onBlur }) => {
  const { mutate } = trpc.electron.selectFolder.useMutation({
    onSuccess: onChange,
  })
  const handleClick = () => {
    if (onBlur) onBlur()
    mutate()
  }
  return (
    <div>
      <Button type='button' variant='secondary' onClick={handleClick}>
        <FolderInputIcon className='mr-2 size-6' /> {value ? value : 'Choose a folder'}
      </Button>
    </div>
  )
}

export default InputFolderElectron
