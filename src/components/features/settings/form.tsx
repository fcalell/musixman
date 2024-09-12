import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import InputFolderElectron from '@/components/ui/input-folder-electron'
import { insertConfigSchema } from '@/db/schema/config'
import { trpc } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import type { FC } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

interface SettingsFormProps {}

const schema = insertConfigSchema.pick({ localLibraryPath: true })
type FormValues = z.infer<typeof schema>

interface SettingsFormProps {
  initialValues?: FormValues
  onSuccess?: () => void
}

const SettingsForm: FC<SettingsFormProps> = ({ onSuccess, initialValues }) => {
  const utils = trpc.useUtils()
  const form = useForm({ defaultValues: initialValues, resolver: zodResolver(schema) })
  const { mutate } = trpc.config.update.useMutation({
    onSuccess: async () => {
      await utils.config.read.invalidate()
      await utils.library.invalidate()
      if (onSuccess) onSuccess()
    },
  })
  const handleSubmit = form.handleSubmit((data) => {
    mutate(data)
  })
  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
        <FormField
          control={form.control}
          name='localLibraryPath'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Local library</FormLabel>
              <FormControl>
                <InputFolderElectron
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormDescription>
                The root folder of your music library, sub-folders are automatically included.
              </FormDescription>
            </FormItem>
          )}
        />
        <Button className='self-end' type='submit'>
          Save
        </Button>
      </form>
    </Form>
  )
}

export default SettingsForm
