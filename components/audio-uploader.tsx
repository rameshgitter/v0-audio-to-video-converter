"use client"

import type React from "react"
import { useCallback, useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  Music,
  LinkIcon,
  ArrowRight,
  X,
  FileAudio,
  Clock,
  HardDrive,
  AudioWaveform as Waveform,
  Loader2,
  CheckCircle2,
  Cloud,
} from "lucide-react"
import type { ProjectSettings } from "@/app/create/page"

interface AudioUploaderProps {
  settings: ProjectSettings
  updateSettings: (updates: Partial<ProjectSettings>) => void
  onNext: () => void
}

export function AudioUploader({ settings, updateSettings, onNext }: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "complete" | "error">("idle")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [cloudUrl, setCloudUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate waveform data from audio file
  const generateWaveform = async (audioUrl: string) => {
    setIsAnalyzing(true)
    try {
      const audioContext = new AudioContext()
      const response = await fetch(audioUrl)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      const channelData = audioBuffer.getChannelData(0)
      const samples = 100
      const blockSize = Math.floor(channelData.length / samples)
      const waveform: number[] = []

      for (let i = 0; i < samples; i++) {
        let sum = 0
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[i * blockSize + j])
        }
        waveform.push(sum / blockSize)
      }

      // Normalize
      const max = Math.max(...waveform)
      const normalized = waveform.map((v) => v / max)
      setWaveformData(normalized)

      audioContext.close()
    } catch (error) {
      console.error("Error generating waveform:", error)
    }
    setIsAnalyzing(false)
  }

  // Draw waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")!
    const dpr = window.devicePixelRatio || 1

    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    const barWidth = width / waveformData.length
    const centerY = height / 2

    ctx.clearRect(0, 0, width, height)

    waveformData.forEach((value, i) => {
      const barHeight = value * height * 0.8
      const x = i * barWidth
      const y = centerY - barHeight / 2

      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight)
      gradient.addColorStop(0, "#a855f7")
      gradient.addColorStop(1, "#ec4899")

      ctx.fillStyle = gradient
      ctx.fillRect(x, y, barWidth - 1, barHeight)
    })
  }, [waveformData])

  const uploadToCloud = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error("Cloud upload error:", error)
      return null
    }
  }

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type.startsWith("audio/") || file.name.match(/\.(mp3|wav|flac|ogg|m4a|aac|wma)$/i)) {
        setUploadStatus("uploading")
        setUploadProgress(0)

        // Create local URL for preview
        const localUrl = URL.createObjectURL(file)
        const audio = new Audio(localUrl)

        // Start upload to cloud in parallel
        const uploadPromise = uploadToCloud(file)

        // Simulate initial progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + Math.random() * 15, 70))
        }, 200)

        audio.addEventListener("loadedmetadata", async () => {
          // Wait for cloud upload to complete
          const cloudUploadUrl = await uploadPromise
          clearInterval(progressInterval)

          if (cloudUploadUrl) {
            setCloudUrl(cloudUploadUrl)
            setUploadProgress(90)
            setUploadStatus("processing")

            updateSettings({
              audioFile: file,
              audioUrl: cloudUploadUrl, // Use cloud URL for actual processing
              audioDuration: audio.duration,
              trimEnd: audio.duration,
              title: file.name.replace(/\.[^/.]+$/, ""),
            })

            // Generate waveform using local URL (faster)
            await generateWaveform(localUrl)

            setUploadProgress(100)
            setUploadStatus("complete")
          } else {
            // Fallback to local URL if cloud upload fails
            updateSettings({
              audioFile: file,
              audioUrl: localUrl,
              audioDuration: audio.duration,
              trimEnd: audio.duration,
              title: file.name.replace(/\.[^/.]+$/, ""),
            })

            await generateWaveform(localUrl)
            setUploadProgress(100)
            setUploadStatus("complete")
          }
        })

        audio.addEventListener("error", () => {
          clearInterval(progressInterval)
          setUploadStatus("error")
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

  const loadFromUrl = async () => {
    if (!urlInput) return

    setIsLoadingUrl(true)
    try {
      const response = await fetch(urlInput)
      const blob = await response.blob()
      const file = new File([blob], "audio-from-url.mp3", { type: blob.type || "audio/mpeg" })
      await handleFile(file)
      setUrlInput("")
    } catch (error) {
      console.error("Error loading audio from URL:", error)
      alert("Failed to load audio from URL. Please check the URL and try again.")
    }
    setIsLoadingUrl(false)
  }

  const clearAudio = async () => {
    // Delete from cloud if uploaded
    if (cloudUrl) {
      try {
        await fetch("/api/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: cloudUrl }),
        })
      } catch (error) {
        console.error("Error deleting cloud file:", error)
      }
    }

    if (settings.audioUrl && settings.audioUrl.startsWith("blob:")) {
      URL.revokeObjectURL(settings.audioUrl)
    }
    updateSettings({
      audioFile: null,
      audioUrl: null,
      audioDuration: 0,
      trimStart: 0,
      trimEnd: 0,
      title: "Untitled Project",
    })
    setWaveformData([])
    setUploadProgress(0)
    setUploadStatus("idle")
    setCloudUrl(null)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
            className={`border-2 border-dashed transition-all cursor-pointer ${
              isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center">
                <Upload className={`h-10 w-10 text-primary transition-transform ${isDragging ? "scale-110" : ""}`} />
              </div>
              <h3 className="text-lg font-semibold mb-1">Drop your audio file here</h3>
              <p className="text-sm text-muted-foreground mb-4">MP3, WAV, FLAC, OGG, M4A up to 500MB</p>
              <Button variant="secondary" size="sm">
                Browse Files
              </Button>
            </CardContent>
          </Card>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac,.wma"
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
                  onKeyDown={(e) => e.key === "Enter" && loadFromUrl()}
                />
              </div>
              <Button variant="secondary" disabled={!urlInput || isLoadingUrl} onClick={loadFromUrl}>
                {isLoadingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load"}
              </Button>
            </div>
          </div>

          {/* Supported formats */}
          <div className="mt-8 p-4 rounded-lg bg-secondary/30">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <FileAudio className="h-4 w-4" />
              Supported Formats
            </h4>
            <div className="flex flex-wrap gap-2">
              {["MP3", "WAV", "FLAC", "OGG", "M4A", "AAC", "WMA"].map((format) => (
                <span key={format} className="px-2 py-1 rounded bg-secondary text-xs font-medium">
                  {format}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Audio loaded state */
        <Card className="border-primary/50 overflow-hidden">
          {uploadStatus !== "complete" && <Progress value={uploadProgress} className="h-1 rounded-none" />}
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                <Music className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate text-lg">{settings.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(settings.audioDuration)}
                  </span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3.5 w-3.5" />
                    {formatFileSize(settings.audioFile.size)}
                  </span>
                  {cloudUrl && (
                    <span className="flex items-center gap-1 text-green-500">
                      <Cloud className="h-3.5 w-3.5" />
                      Uploaded
                    </span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearAudio}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Upload status indicator */}
            {uploadStatus !== "complete" && uploadStatus !== "idle" && (
              <div className="mb-4 p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 text-sm">
                  {uploadStatus === "uploading" && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Uploading to cloud...</span>
                    </>
                  )}
                  {uploadStatus === "processing" && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Processing audio...</span>
                    </>
                  )}
                  {uploadStatus === "error" && (
                    <>
                      <X className="h-4 w-4 text-red-500" />
                      <span className="text-red-500">Upload failed. Using local file.</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {uploadStatus === "complete" && cloudUrl && (
              <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Audio uploaded to cloud and ready for processing</span>
                </div>
              </div>
            )}

            {/* Waveform visualization */}
            <div className="relative h-24 bg-secondary/50 rounded-lg overflow-hidden mb-4">
              {isAnalyzing ? (
                <div className="absolute inset-0 flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing audio...
                </div>
              ) : waveformData.length > 0 ? (
                <canvas ref={canvasRef} className="w-full h-full" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <Waveform className="h-8 w-8" />
                </div>
              )}
            </div>

            {/* Audio player */}
            <div className="mb-4">
              <audio
                src={settings.audioUrl || undefined}
                controls
                crossOrigin="anonymous"
                className="w-full h-10 [&::-webkit-media-controls-panel]:bg-secondary [&::-webkit-media-controls-panel]:rounded-lg"
              />
            </div>

            <Button className="w-full gap-2" size="lg" onClick={onNext} disabled={uploadStatus === "uploading"}>
              {uploadStatus === "uploading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  Continue to Customize
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
