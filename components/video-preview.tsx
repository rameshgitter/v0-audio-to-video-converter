"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Pause, RotateCcw, ArrowRight } from "lucide-react"
import type { ProjectSettings } from "@/app/create/page"
import Link from "next/link"

interface VideoPreviewProps {
  settings: ProjectSettings
}

export function VideoPreview({ settings }: VideoPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationRef = useRef<number>(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  // Get aspect ratio dimensions
  const getAspectDimensions = () => {
    switch (settings.aspectRatio) {
      case "9:16":
        return { width: 270, height: 480 }
      case "1:1":
        return { width: 400, height: 400 }
      default:
        return { width: 640, height: 360 }
    }
  }

  const dimensions = getAspectDimensions()

  useEffect(() => {
    if (!settings.audioUrl || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    const audio = audioRef.current
    if (!audio) return

    // Setup audio analyser
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      sourceRef.current = audioContextRef.current.createMediaElementSource(audio)
      sourceRef.current.connect(analyserRef.current)
      analyserRef.current.connect(audioContextRef.current.destination)
    }

    const analyser = analyserRef.current
    if (!analyser) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      // Draw background
      if (settings.backgroundType === "gradient") {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        gradient.addColorStop(0, settings.backgroundGradient[0])
        gradient.addColorStop(1, settings.backgroundGradient[1])
        ctx.fillStyle = gradient
      } else if (settings.backgroundType === "solid") {
        ctx.fillStyle = settings.backgroundColor
      } else {
        ctx.fillStyle = "#1a1625"
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw visualizer based on style
      const color = settings.visualizerColor
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      switch (settings.visualizerStyle) {
        case "bars": {
          const barWidth = (canvas.width / bufferLength) * 2
          const barSpacing = 2
          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height * 0.6
            const x = i * (barWidth + barSpacing) + (canvas.width - bufferLength * (barWidth + barSpacing)) / 2
            const y = centerY - barHeight / 2

            const gradient = ctx.createLinearGradient(x, y, x, y + barHeight)
            gradient.addColorStop(0, color + "ff")
            gradient.addColorStop(1, color + "66")
            ctx.fillStyle = gradient
            ctx.fillRect(x, y, barWidth, barHeight)
          }
          break
        }
        case "wave": {
          ctx.beginPath()
          ctx.moveTo(0, centerY)
          for (let i = 0; i < bufferLength; i++) {
            const x = (i / bufferLength) * canvas.width
            const y = centerY + ((dataArray[i] - 128) / 128) * canvas.height * 0.3
            ctx.lineTo(x, y)
          }
          ctx.strokeStyle = color
          ctx.lineWidth = 3
          ctx.stroke()
          break
        }
        case "circular": {
          const radius = Math.min(canvas.width, canvas.height) * 0.25
          for (let i = 0; i < bufferLength; i++) {
            const angle = (i / bufferLength) * Math.PI * 2
            const amplitude = (dataArray[i] / 255) * radius * 0.5
            const x1 = centerX + Math.cos(angle) * radius
            const y1 = centerY + Math.sin(angle) * radius
            const x2 = centerX + Math.cos(angle) * (radius + amplitude)
            const y2 = centerY + Math.sin(angle) * (radius + amplitude)

            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.strokeStyle =
              color +
              Math.floor((dataArray[i] / 255) * 255)
                .toString(16)
                .padStart(2, "0")
            ctx.lineWidth = 2
            ctx.stroke()
          }
          break
        }
        case "particles": {
          for (let i = 0; i < bufferLength; i += 2) {
            const size = (dataArray[i] / 255) * 20 + 2
            const angle = (i / bufferLength) * Math.PI * 2 + currentTime * 0.001
            const distance = 50 + (dataArray[i] / 255) * 100
            const x = centerX + Math.cos(angle) * distance
            const y = centerY + Math.sin(angle) * distance

            ctx.beginPath()
            ctx.arc(x, y, size, 0, Math.PI * 2)
            ctx.fillStyle =
              color +
              Math.floor((dataArray[i] / 255) * 200 + 55)
                .toString(16)
                .padStart(2, "0")
            ctx.fill()
          }
          break
        }
      }

      // Draw logo if enabled
      if (settings.showLogo && settings.logoUrl) {
        // Logo would be drawn here with an Image object
      }
    }

    draw()

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [settings, isPlaying, currentTime, dimensions])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume()
    }

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const restart = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    setCurrentTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div
          className="relative flex items-center justify-center bg-black"
          style={{
            aspectRatio: settings.aspectRatio.replace(":", "/"),
            maxHeight: "60vh",
          }}
        >
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain"
            style={{
              width: "100%",
              height: "100%",
            }}
          />

          {settings.audioUrl && (
            <audio
              ref={audioRef}
              src={settings.audioUrl}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onEnded={() => setIsPlaying(false)}
            />
          )}
        </div>
      </Card>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="secondary" onClick={togglePlay} disabled={!settings.audioUrl}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={restart} disabled={!settings.audioUrl}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {formatTime(currentTime)} / {formatTime(settings.audioDuration)}
          </span>
        </div>

        <Link href="/create">
          <Button
            className="gap-2"
            onClick={() => {
              // Navigate to export step
              const urlParams = new URLSearchParams(window.location.search)
              urlParams.set("step", "export")
            }}
          >
            Continue to Export
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
