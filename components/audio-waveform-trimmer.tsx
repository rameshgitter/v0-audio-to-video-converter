"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Scissors, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

interface AudioWaveformTrimmerProps {
  audioUrl: string
  duration: number
  trimStart: number
  trimEnd: number
  onTrimChange: (start: number, end: number) => void
}

export function AudioWaveformTrimmer({
  audioUrl,
  duration,
  trimStart,
  trimEnd,
  onTrimChange,
}: AudioWaveformTrimmerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [isDragging, setIsDragging] = useState<"start" | "end" | null>(null)
  const [zoom, setZoom] = useState(1)
  const [scrollPosition, setScrollPosition] = useState(0)

  // Generate waveform data
  useEffect(() => {
    const generateWaveform = async () => {
      try {
        const audioContext = new AudioContext()
        const response = await fetch(audioUrl)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        const channelData = audioBuffer.getChannelData(0)
        const samples = Math.floor(duration * 50) // 50 samples per second
        const blockSize = Math.floor(channelData.length / samples)
        const waveform: number[] = []

        for (let i = 0; i < samples; i++) {
          let sum = 0
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[i * blockSize + j])
          }
          waveform.push(sum / blockSize)
        }

        const max = Math.max(...waveform)
        setWaveformData(waveform.map((v) => v / max))
        audioContext.close()
      } catch (error) {
        console.error("Error generating waveform:", error)
      }
    }

    if (audioUrl) {
      generateWaveform()
    }
  }, [audioUrl, duration])

  // Draw waveform with trim handles
  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")!
    const dpr = window.devicePixelRatio || 1

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight

    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const totalWidth = width * zoom
    const visibleWidth = width
    const startX = scrollPosition * (totalWidth - visibleWidth)

    ctx.clearRect(0, 0, width, height)

    // Draw background
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)"
    ctx.fillRect(0, 0, width, height)

    // Draw trimmed out regions
    const trimStartX = (trimStart / duration) * totalWidth - startX
    const trimEndX = (trimEnd / duration) * totalWidth - startX

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
    if (trimStartX > 0) {
      ctx.fillRect(0, 0, Math.max(0, trimStartX), height)
    }
    if (trimEndX < width) {
      ctx.fillRect(trimEndX, 0, width - trimEndX, height)
    }

    // Draw waveform
    const barWidth = totalWidth / waveformData.length
    const centerY = height / 2

    waveformData.forEach((value, i) => {
      const x = i * barWidth - startX
      if (x < -barWidth || x > width) return

      const barHeight = value * height * 0.8
      const y = centerY - barHeight / 2

      const time = (i / waveformData.length) * duration
      const isInTrim = time >= trimStart && time <= trimEnd

      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight)
      if (isInTrim) {
        gradient.addColorStop(0, "#a855f7")
        gradient.addColorStop(1, "#ec4899")
      } else {
        gradient.addColorStop(0, "rgba(168, 85, 247, 0.3)")
        gradient.addColorStop(1, "rgba(236, 72, 153, 0.3)")
      }

      ctx.fillStyle = gradient
      ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight)
    })

    // Draw trim handles
    const handleWidth = 8

    // Start handle
    ctx.fillStyle = "#22c55e"
    ctx.fillRect(trimStartX - handleWidth / 2, 0, handleWidth, height)
    ctx.beginPath()
    ctx.moveTo(trimStartX, height / 2 - 10)
    ctx.lineTo(trimStartX + 8, height / 2)
    ctx.lineTo(trimStartX, height / 2 + 10)
    ctx.fillStyle = "#22c55e"
    ctx.fill()

    // End handle
    ctx.fillStyle = "#ef4444"
    ctx.fillRect(trimEndX - handleWidth / 2, 0, handleWidth, height)
    ctx.beginPath()
    ctx.moveTo(trimEndX, height / 2 - 10)
    ctx.lineTo(trimEndX - 8, height / 2)
    ctx.lineTo(trimEndX, height / 2 + 10)
    ctx.fillStyle = "#ef4444"
    ctx.fill()
  }, [waveformData, trimStart, trimEnd, duration, zoom, scrollPosition])

  // Handle mouse events for trimming
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const width = rect.width
      const totalWidth = width * zoom
      const startX = scrollPosition * (totalWidth - width)

      const trimStartX = (trimStart / duration) * totalWidth - startX
      const trimEndX = (trimEnd / duration) * totalWidth - startX

      if (Math.abs(x - trimStartX) < 15) {
        setIsDragging("start")
      } else if (Math.abs(x - trimEndX) < 15) {
        setIsDragging("end")
      }
    },
    [trimStart, trimEnd, duration, zoom, scrollPosition],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const width = rect.width
      const totalWidth = width * zoom
      const startX = scrollPosition * (totalWidth - width)

      const time = ((x + startX) / totalWidth) * duration

      if (isDragging === "start") {
        onTrimChange(Math.max(0, Math.min(time, trimEnd - 1)), trimEnd)
      } else {
        onTrimChange(trimStart, Math.min(duration, Math.max(time, trimStart + 1)))
      }
    },
    [isDragging, trimStart, trimEnd, duration, zoom, scrollPosition, onTrimChange],
  )

  const handleMouseUp = () => {
    setIsDragging(null)
  }

  const resetTrim = () => {
    onTrimChange(0, duration)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scissors className="h-4 w-4" />
          <span className="text-sm font-medium">Trim Audio</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
            disabled={zoom <= 1}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">{zoom}x</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
            disabled={zoom >= 4}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={resetTrim}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative h-24 rounded-lg overflow-hidden cursor-col-resize"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {zoom > 1 && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={scrollPosition}
          onChange={(e) => setScrollPosition(Number(e.target.value))}
          className="w-full mt-2"
        />
      )}

      <div className="flex items-center justify-between mt-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-green-500">Start:</span>
          <span className="font-mono">{formatTime(trimStart)}</span>
        </div>
        <div className="text-muted-foreground">Duration: {formatTime(trimEnd - trimStart)}</div>
        <div className="flex items-center gap-2">
          <span className="text-red-500">End:</span>
          <span className="font-mono">{formatTime(trimEnd)}</span>
        </div>
      </div>
    </Card>
  )
}
