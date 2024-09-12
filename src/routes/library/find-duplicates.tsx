import { DuplicateGroup } from '@/components/features/library/find-duplicates/duplicate-group'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { trpc } from '@/lib/utils'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

const FindDuplicates = () => {
  const [probability, setProbability] = useState([0.8])
  const [matchTags, setMatchTags] = useState(true)
  const [matchFilename, setMatchFilename] = useState(false)

  const { data, isLoading, mutate } = trpc.library.findDuplicates.useMutation()

  const handleFindDuplicates = () => {
    mutate({ probability: probability[0], matchTags, matchFilename })
  }

  return (
    <div className='container mx-auto py-8'>
      <h1 className='text-3xl font-bold mb-6'>Find Duplicates</h1>
      <Card className='mb-8'>
        <CardHeader>
          <CardTitle>Duplicate Detection Settings</CardTitle>
          <CardDescription>
            Adjust the sensitivity and matching criteria for finding duplicate tracks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            <div>
              <Label htmlFor='probability-slider' className='block text-sm font-medium mb-1'>
                Duplicate Probability Threshold: {probability[0].toFixed(2)}
              </Label>
              <Slider
                id='probability-slider'
                className='max-w-xl'
                min={0}
                max={1}
                step={0.01}
                value={probability}
                onValueChange={setProbability}
              />
            </div>
            <div className='space-y-2'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='match-tags'
                  checked={matchTags}
                  onCheckedChange={(checked) => setMatchTags(checked as boolean)}
                />
                <Label htmlFor='match-tags'>Match Tags (Title, Artist)</Label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='match-filename'
                  checked={matchFilename}
                  onCheckedChange={(checked) => setMatchFilename(checked as boolean)}
                />
                <Label htmlFor='match-filename'>Match Filename</Label>
              </div>
            </div>
            <Button
              onClick={handleFindDuplicates}
              disabled={isLoading || (!matchTags && !matchFilename)}
            >
              {isLoading ? 'Searching...' : 'Find Duplicates'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data?.duplicateGroups && (
        <div className='space-y-4'>
          <h2 className='text-2xl font-semibold'>Duplicate Groups</h2>
          <p>Found {data.duplicateGroups.length} files with possible duplicates</p>
          {data.duplicateGroups.map((group) => (
            <DuplicateGroup key={group[0].filename} files={group} />
          ))}
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/library/find-duplicates')({
  component: FindDuplicates,
})
