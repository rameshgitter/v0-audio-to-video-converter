"use client"

import type React from "react"

import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Upload, Music, LinkIcon, ArrowRight, X } from "lucide-react"
import type { ProjectSettings } from "@/app/create/page"

interface AudioUploaderProps {
  settings: ProjectSettings
  updateSettings: (updates: Partial<ProjectSettings>) => void
  onNext: () => void
}

export function AudioUploader({ settings, updateSettings, onNext }: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (file.type.startsWith("audio/")) {
        const url = URL.createObjectURL(file)
        const audio = new Audio(url)
        audio.addEventListener("loadedmetadata", () => {
          updateSettings({
            audioFile: file,
            audioUrl: url,
            audioDuration: audio.duration,
            title: file.name.replace(/\.[^/.]+$/, ""),
          })
        })
      }
    },
    [updateSettings],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const clearAudio = () => {
    if (settings.audioUrl) {
      URL.revokeObjectURL(settings.audioUrl)
    }
    updateSettings({
      audioFile: null,
      audioUrl: null,
      audioDuration: 0,
      title: "Untitled Project",
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Your Audio</h1>
        <p className="text-muted-foreground">Drag and drop your audio file or paste a link to get started</p>
      </div>

      {!settings.audioFile ? (
        <>
          {/* Drop zone */}
          <Card
            className={`border-2 border-dashed transition-colors cursor-pointer ${
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Drop your audio file here</h3>
              <p className="text-sm text-muted-foreground mb-4">MP3, WAV, FLAC, OGG up to 500MB</p>
              <Button variant="secondary" size="sm">
                Browse Files
              </Button>
            </CardContent>
          </Card>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />

          {/* URL input */}
          <div className="mt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">or paste a link</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://example.com/audio.mp3"
                  className="pl-10"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </div>
              <Button variant="secondary" disabled={!urlInput}>
                Load
              </Button>
            </div>
          </div>
        </>
      ) : (
        /* Audio loaded state */
        <Card className="border-primary/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Music className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{settings.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDuration(settings.audioDuration)} • {(settings.audioFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={clearAudio}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Audio player */}
            <div className="mt-4">
              <audio
                src={settings.audioUrl || undefined}
                controls
                className="w-full h-10 [&::-webkit-media-controls-panel]:bg-secondary [&::-webkit-media-controls-panel]:rounded-lg"
              />
            </div>

            <Button className="w-full mt-6 gap-2" size="lg" onClick={onNext}>
              Continue to Customize
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
