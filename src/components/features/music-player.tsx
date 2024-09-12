import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import React, { useEffect, useRef } from 'react'

import { create } from 'zustand'

type Track = {
  title: string
  artist: string
  audioSrc: string
}

type MusicStore = {
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
  progress: number
  setCurrentTrack: (track: Track | null) => void
  setIsPlaying: (isPlaying: boolean) => void
  setVolume: (volume: number) => void
  setProgress: (progress: number) => void
}

export const useMusicPlayerStore = create<MusicStore>((set) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 1,
  progress: 0,
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
}))

export default function MusicPlayer() {
  const { currentTrack, isPlaying, volume, progress, setIsPlaying, setVolume, setProgress } =
    useMusicPlayerStore()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const prevTrackRef = useRef<string | undefined>()

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play()
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying])

  useEffect(() => {
    if (audioRef.current && prevTrackRef.current !== currentTrack?.audioSrc) {
      prevTrackRef.current = currentTrack?.audioSrc
      setProgress(0)
      if (!isPlaying) setIsPlaying(true)
      else audioRef.current.play()
    }
  }, [currentTrack, isPlaying, setProgress, setIsPlaying])

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleProgress = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100
      setProgress(progress)
    }
  }

  const handleProgressChange = (newProgress: number[]) => {
    if (audioRef.current) {
      const newTime = (newProgress[0] / 100) * audioRef.current.duration
      audioRef.current.currentTime = newTime
      setProgress(newProgress[0])
    }
  }

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume[0])
  }

  if (!currentTrack) {
    return null // Don't render the player if there's no track
  }

  return (
    <div className='bg-background border-t border-border p-4'>
      <div className='mx-auto flex gap-6 items-center justify-between space-x-4'>
        <div className='flex-shrink-0 w-48'>
          <h3 className='text-lg font-semibold truncate'>{currentTrack.title}</h3>
          <p className='text-sm text-muted-foreground truncate'>{currentTrack.artist}</p>
        </div>
        <div className='flex gap-4 max-w-3xl flex-grow items-center'>
          <Button variant='ghost' size='icon' onClick={togglePlayPause}>
            {isPlaying ? <Pause className='h-6 w-6' /> : <Play className='h-6 w-6' />}
          </Button>
          <Slider
            value={[progress]}
            max={100}
            step={1}
            onValueChange={handleProgressChange}
            className='w-full cursor-pointer'
          />
        </div>
        <div className='flex items-center space-x-2 flex-shrink-0'>
          <Button variant='ghost' size='icon' onClick={() => setVolume(volume > 0 ? 0 : 1)}>
            {volume > 0 ? <Volume2 className='h-6 w-6' /> : <VolumeX className='h-6 w-6' />}
          </Button>
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className='w-24 cursor-pointer'
          />
        </div>
      </div>
      <audio
        ref={audioRef}
        src={`local-file://${currentTrack.audioSrc}`}
        onTimeUpdate={handleProgress}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  )
}
