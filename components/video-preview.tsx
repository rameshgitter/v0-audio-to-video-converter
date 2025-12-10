"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, RotateCcw, ArrowRight, Volume2, VolumeX, Maximize2, SkipBack, SkipForward } from "lucide-react"
import type { ProjectSettings } from "@/app/create/page"

interface VideoPreviewProps {
  settings: ProjectSettings
  updateSettings: (updates: Partial<ProjectSettings>) => void
  onExport: () => void
}

export function VideoPreview({ settings, updateSettings, onExport }: VideoPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const bassFilterRef = useRef<BiquadFilterNode | null>(null)
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null)
  const animationRef = useRef<number>(0)
  const bgVideoRef = useRef<HTMLVideoElement>(null)
  const logoImgRef = useRef<HTMLImageElement | null>(null)
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number }>>([])
  const frameCountRef = useRef(0)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Get aspect ratio dimensions
  const getAspectDimensions = () => {
    const baseWidth = 640
    switch (settings.aspectRatio) {
      case "9:16":
        return { width: baseWidth * 0.5625, height: baseWidth }
      case "1:1":
        return { width: baseWidth * 0.75, height: baseWidth * 0.75 }
      case "4:3":
        return { width: baseWidth, height: baseWidth * 0.75 }
      case "21:9":
        return { width: baseWidth, height: baseWidth * (9 / 21) }
      default:
        return { width: baseWidth, height: baseWidth * 0.5625 }
    }
  }

  const dimensions = getAspectDimensions()

  // Load logo image
  useEffect(() => {
    if (settings.logoUrl) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        logoImgRef.current = img
      }
      img.src = settings.logoUrl
    } else {
      logoImgRef.current = null
    }
  }, [settings.logoUrl])

  // Initialize particles for animated backgrounds
  useEffect(() => {
    if (settings.backgroundType === "animated") {
      particlesRef.current = Array.from({ length: 100 }, () => ({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.5 + 0.2,
      }))
    }
  }, [settings.backgroundType, settings.animatedBackground, dimensions])

  // Update audio effects
  useEffect(() => {
    if (bassFilterRef.current) {
      bassFilterRef.current.gain.value = settings.audioEffects.bassBoost
    }
    if (trebleFilterRef.current) {
      trebleFilterRef.current.gain.value = settings.audioEffects.trebleBoost
    }
    if (audioRef.current) {
      audioRef.current.playbackRate = settings.audioEffects.speed
    }
  }, [settings.audioEffects])

  // Main animation loop
  useEffect(() => {
    if (!settings.audioUrl || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = dimensions.width * 2 // Higher resolution
    canvas.height = dimensions.height * 2
    ctx.scale(2, 2)

    const audio = audioRef.current
    if (!audio) return

    // Setup audio analyser with effects chain
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 512
      analyserRef.current.smoothingTimeConstant = settings.visualizerSmoothing

      sourceRef.current = audioContextRef.current.createMediaElementSource(audio)
      gainNodeRef.current = audioContextRef.current.createGain()

      // Bass filter
      bassFilterRef.current = audioContextRef.current.createBiquadFilter()
      bassFilterRef.current.type = "lowshelf"
      bassFilterRef.current.frequency.value = 200
      bassFilterRef.current.gain.value = settings.audioEffects.bassBoost

      // Treble filter
      trebleFilterRef.current = audioContextRef.current.createBiquadFilter()
      trebleFilterRef.current.type = "highshelf"
      trebleFilterRef.current.frequency.value = 3000
      trebleFilterRef.current.gain.value = settings.audioEffects.trebleBoost

      // Connect the chain
      sourceRef.current.connect(bassFilterRef.current)
      bassFilterRef.current.connect(trebleFilterRef.current)
      trebleFilterRef.current.connect(gainNodeRef.current)
      gainNodeRef.current.connect(analyserRef.current)
      analyserRef.current.connect(audioContextRef.current.destination)
    }

    if (analyserRef.current) {
      analyserRef.current.smoothingTimeConstant = settings.visualizerSmoothing
    }

    const analyser = analyserRef.current
    if (!analyser) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const timeDataArray = new Uint8Array(bufferLength)

    // Draw animated background
    const drawAnimatedBackground = (time: number) => {
      switch (settings.animatedBackground) {
        case "particles": {
          ctx.fillStyle = settings.backgroundGradient[0]
          ctx.fillRect(0, 0, dimensions.width, dimensions.height)

          particlesRef.current.forEach((p) => {
            p.x += p.vx
            p.y += p.vy
            if (p.x < 0 || p.x > dimensions.width) p.vx *= -1
            if (p.y < 0 || p.y > dimensions.height) p.vy *= -1

            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fillStyle = `${settings.visualizerColor}${Math.floor(p.alpha * 255)
              .toString(16)
              .padStart(2, "0")}`
            ctx.fill()
          })
          break
        }
        case "matrix": {
          ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
          ctx.fillRect(0, 0, dimensions.width, dimensions.height)

          ctx.fillStyle = settings.visualizerColor
          ctx.font = "12px monospace"
          for (let i = 0; i < 20; i++) {
            const x = (time * 0.05 + i * 30) % dimensions.width
            const y = (time * (0.5 + i * 0.1)) % dimensions.height
            ctx.fillText(String.fromCharCode(0x30a0 + Math.random() * 96), x, y)
          }
          break
        }
        case "stars": {
          const gradient = ctx.createLinearGradient(0, 0, 0, dimensions.height)
          gradient.addColorStop(0, "#0a0a1a")
          gradient.addColorStop(1, "#1a1a2e")
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, dimensions.width, dimensions.height)

          for (let i = 0; i < 50; i++) {
            const x = (i * 97) % dimensions.width
            const y = (i * 53) % dimensions.height
            const twinkle = Math.sin(time * 0.005 + i) * 0.5 + 0.5
            ctx.beginPath()
            ctx.arc(x, y, 1 + twinkle, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + twinkle * 0.7})`
            ctx.fill()
          }
          break
        }
        case "gradient": {
          const hue = (time * 0.02) % 360
          const gradient = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height)
          gradient.addColorStop(0, `hsl(${hue}, 50%, 15%)`)
          gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 50%, 20%)`)
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, dimensions.width, dimensions.height)
          break
        }
        case "smoke": {
          ctx.fillStyle = settings.backgroundGradient[0]
          ctx.fillRect(0, 0, dimensions.width, dimensions.height)

          for (let i = 0; i < 5; i++) {
            const x = dimensions.width / 2 + Math.sin(time * 0.001 + i) * 100
            const y = dimensions.height / 2 + Math.cos(time * 0.0015 + i) * 50
            const radius = 80 + Math.sin(time * 0.002 + i) * 30

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
            gradient.addColorStop(0, `${settings.visualizerColor}20`)
            gradient.addColorStop(1, "transparent")
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, dimensions.width, dimensions.height)
          }
          break
        }
      }
    }

    // Draw visualizer based on style
    const drawVisualizer = (dataArray: Uint8Array, timeData: Uint8Array) => {
      const color = settings.visualizerColor
      const secondaryColor = settings.visualizerSecondaryColor
      const sensitivity = settings.visualizerSensitivity
      const centerX = dimensions.width / 2
      const centerY = dimensions.height / 2

      // Apply glow effect
      if (settings.visualizerGlow) {
        ctx.shadowColor = color
        ctx.shadowBlur = 20
      } else {
        ctx.shadowBlur = 0
      }

      switch (settings.visualizerStyle) {
        case "bars": {
          const barCount = 64
          const barWidth = (dimensions.width / barCount) * 0.8
          const barSpacing = (dimensions.width / barCount) * 0.2

          for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor((i / barCount) * bufferLength)
            const barHeight = (dataArray[dataIndex] / 255) * dimensions.height * 0.5 * sensitivity
            const x = i * (barWidth + barSpacing)
            const y = centerY - barHeight / 2

            const gradient = ctx.createLinearGradient(x, y, x, y + barHeight)
            gradient.addColorStop(0, color)
            gradient.addColorStop(1, secondaryColor)
            ctx.fillStyle = gradient
            ctx.fillRect(x, y, barWidth, barHeight)

            // Mirror effect
            if (settings.visualizerMirror) {
              ctx.fillRect(x, centerY, barWidth, barHeight / 2)
            }
          }
          break
        }

        case "wave": {
          ctx.beginPath()
          ctx.moveTo(0, centerY)

          for (let i = 0; i < bufferLength; i++) {
            const x = (i / bufferLength) * dimensions.width
            const y = centerY + ((timeData[i] - 128) / 128) * dimensions.height * 0.3 * sensitivity
            ctx.lineTo(x, y)
          }

          const gradient = ctx.createLinearGradient(0, 0, dimensions.width, 0)
          gradient.addColorStop(0, color)
          gradient.addColorStop(0.5, secondaryColor)
          gradient.addColorStop(1, color)
          ctx.strokeStyle = gradient
          ctx.lineWidth = 3
          ctx.stroke()

          // Fill below the wave
          ctx.lineTo(dimensions.width, dimensions.height)
          ctx.lineTo(0, dimensions.height)
          ctx.closePath()
          ctx.fillStyle = `${color}20`
          ctx.fill()
          break
        }

        case "circular": {
          const radius = Math.min(dimensions.width, dimensions.height) * 0.25
          const bars = 128

          for (let i = 0; i < bars; i++) {
            const angle = (i / bars) * Math.PI * 2 - Math.PI / 2
            const dataIndex = Math.floor((i / bars) * bufferLength)
            const amplitude = (dataArray[dataIndex] / 255) * radius * 0.5 * sensitivity

            const x1 = centerX + Math.cos(angle) * radius
            const y1 = centerY + Math.sin(angle) * radius
            const x2 = centerX + Math.cos(angle) * (radius + amplitude)
            const y2 = centerY + Math.sin(angle) * (radius + amplitude)

            const progress = i / bars
            const barColor = progress < 0.5 ? color : secondaryColor
            ctx.strokeStyle = barColor
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
          }

          // Inner circle
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2)
          ctx.strokeStyle = `${color}40`
          ctx.lineWidth = 2
          ctx.stroke()
          break
        }

        case "particles": {
          const particleCount = 100
          for (let i = 0; i < particleCount; i++) {
            const dataIndex = Math.floor((i / particleCount) * bufferLength)
            const size = (dataArray[dataIndex] / 255) * 15 * sensitivity + 2
            const angle = (i / particleCount) * Math.PI * 2 + frameCountRef.current * 0.01
            const distance = 50 + (dataArray[dataIndex] / 255) * 120 * sensitivity

            const x = centerX + Math.cos(angle) * distance
            const y = centerY + Math.sin(angle) * distance

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
            gradient.addColorStop(0, i % 2 === 0 ? color : secondaryColor)
            gradient.addColorStop(1, "transparent")
            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(x, y, size, 0, Math.PI * 2)
            ctx.fill()
          }
          break
        }

        case "spectrum": {
          const barWidth = dimensions.width / bufferLength

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * dimensions.height * 0.7 * sensitivity
            const hue = (i / bufferLength) * 120 // Green to red spectrum
            ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`
            ctx.fillRect(i * barWidth, dimensions.height - barHeight, barWidth - 1, barHeight)
          }
          break
        }

        case "blob": {
          const points = 64
          const baseRadius = Math.min(dimensions.width, dimensions.height) * 0.2

          ctx.beginPath()
          for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2
            const dataIndex = Math.floor((i / points) * bufferLength)
            const amplitude = (dataArray[dataIndex] / 255) * baseRadius * 0.5 * sensitivity
            const radius = baseRadius + amplitude

            const x = centerX + Math.cos(angle) * radius
            const y = centerY + Math.sin(angle) * radius

            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.closePath()

          const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 1.5)
          gradient.addColorStop(0, color)
          gradient.addColorStop(0.5, secondaryColor)
          gradient.addColorStop(1, `${color}00`)
          ctx.fillStyle = gradient
          ctx.fill()
          break
        }

        case "radialBars": {
          const bars = 48
          const innerRadius = Math.min(dimensions.width, dimensions.height) * 0.15
          const maxBarHeight = Math.min(dimensions.width, dimensions.height) * 0.25

          for (let i = 0; i < bars; i++) {
            const angle = (i / bars) * Math.PI * 2 - Math.PI / 2
            const dataIndex = Math.floor((i / bars) * bufferLength)
            const barHeight = (dataArray[dataIndex] / 255) * maxBarHeight * sensitivity

            const x1 = centerX + Math.cos(angle) * innerRadius
            const y1 = centerY + Math.sin(angle) * innerRadius
            const x2 = centerX + Math.cos(angle) * (innerRadius + barHeight)
            const y2 = centerY + Math.sin(angle) * (innerRadius + barHeight)

            const barWidth = ((Math.PI * 2 * innerRadius) / bars) * 0.6
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
            gradient.addColorStop(0, color)
            gradient.addColorStop(1, secondaryColor)

            ctx.save()
            ctx.translate(centerX, centerY)
            ctx.rotate(angle + Math.PI / 2)
            ctx.fillStyle = gradient
            ctx.fillRect(-barWidth / 2, innerRadius, barWidth, barHeight)
            ctx.restore()
          }
          break
        }

        case "oscilloscope": {
          ctx.beginPath()
          ctx.moveTo(0, centerY)

          for (let i = 0; i < bufferLength; i++) {
            const x = (i / bufferLength) * dimensions.width
            const y = centerY + ((timeData[i] - 128) / 128) * dimensions.height * 0.4 * sensitivity
            ctx.lineTo(x, y)
          }

          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.stroke()

          // Add glow line
          ctx.strokeStyle = `${color}40`
          ctx.lineWidth = 8
          ctx.stroke()
          break
        }
      }

      ctx.shadowBlur = 0
    }

    // Draw text overlays
    const drawTextOverlays = (time: number) => {
      settings.textOverlays.forEach((overlay) => {
        if (time >= overlay.startTime && time <= overlay.endTime) {
          ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`
          ctx.fillStyle = overlay.color
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"

          let alpha = 1
          let offsetX = 0
          let offsetY = 0
          let displayText = overlay.text

          // Animation effects
          switch (overlay.animation) {
            case "fade": {
              const fadeIn = Math.min(1, (time - overlay.startTime) / 0.5)
              const fadeOut = Math.min(1, (overlay.endTime - time) / 0.5)
              alpha = Math.min(fadeIn, fadeOut)
              break
            }
            case "slide":
              offsetX = Math.max(0, (0.5 - (time - overlay.startTime)) * dimensions.width)
              break
            case "bounce":
              offsetY = Math.sin(time * 5) * 10
              break
            case "typewriter": {
              const progress = (time - overlay.startTime) / (overlay.endTime - overlay.startTime)
              const chars = Math.floor(progress * overlay.text.length)
              displayText = overlay.text.substring(0, chars)
              break
            }
          }

          ctx.globalAlpha = alpha
          const x = (overlay.position.x / 100) * dimensions.width + offsetX
          const y = (overlay.position.y / 100) * dimensions.height + offsetY
          ctx.fillText(displayText, x, y)
          ctx.globalAlpha = 1
        }
      })
    }

    // Draw logo
    const drawLogo = () => {
      if (!settings.showLogo || !logoImgRef.current) return

      const logo = logoImgRef.current
      const size = settings.logoSize
      const aspectRatio = logo.width / logo.height
      const width = size
      const height = size / aspectRatio
      const padding = 20

      let x = padding
      let y = padding

      switch (settings.logoPosition) {
        case "top-right":
          x = dimensions.width - width - padding
          break
        case "bottom-left":
          y = dimensions.height - height - padding
          break
        case "bottom-right":
          x = dimensions.width - width - padding
          y = dimensions.height - height - padding
          break
        case "center":
          x = (dimensions.width - width) / 2
          y = (dimensions.height - height) / 2
          break
      }

      ctx.globalAlpha = settings.logoOpacity / 100
      ctx.drawImage(logo, x, y, width, height)
      ctx.globalAlpha = 1
    }

    // Draw progress bar
    const drawProgressBar = () => {
      if (!settings.progress.enabled) return

      const progress = currentTime / (settings.audioDuration || 1)
      const barHeight = 4
      const y = settings.progress.position === "top" ? 10 : dimensions.height - 10 - barHeight

      switch (settings.progress.style) {
        case "bar":
          ctx.fillStyle = `${settings.progress.color}40`
          ctx.fillRect(10, y, dimensions.width - 20, barHeight)
          ctx.fillStyle = settings.progress.color
          ctx.fillRect(10, y, (dimensions.width - 20) * progress, barHeight)
          break
        case "circle": {
          const circleX = 10 + (dimensions.width - 20) * progress
          ctx.fillStyle = `${settings.progress.color}40`
          ctx.fillRect(10, y + barHeight / 2 - 1, dimensions.width - 20, 2)
          ctx.fillStyle = settings.progress.color
          ctx.beginPath()
          ctx.arc(circleX, y + barHeight / 2, 6, 0, Math.PI * 2)
          ctx.fill()
          break
        }
        case "dots": {
          const dotCount = 20
          for (let i = 0; i < dotCount; i++) {
            const x = 10 + ((dimensions.width - 20) / dotCount) * i
            const isActive = i / dotCount <= progress
            ctx.fillStyle = isActive ? settings.progress.color : `${settings.progress.color}40`
            ctx.beginPath()
            ctx.arc(x, y + barHeight / 2, 3, 0, Math.PI * 2)
            ctx.fill()
          }
          break
        }
      }
    }

    // Draw watermark
    const drawWatermark = () => {
      if (!settings.watermark.enabled) return

      ctx.font = "12px Inter"
      ctx.fillStyle = `rgba(255, 255, 255, ${settings.watermark.opacity / 100})`
      ctx.textAlign = "right"
      ctx.textBaseline = "bottom"
      ctx.fillText(settings.watermark.text, dimensions.width - 10, dimensions.height - 10)
    }

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)
      frameCountRef.current++

      analyser.getByteFrequencyData(dataArray)
      analyser.getByteTimeDomainData(timeDataArray)

      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)

      // Draw background
      if (settings.backgroundType === "animated") {
        drawAnimatedBackground(frameCountRef.current)
      } else if (settings.backgroundType === "image" && settings.backgroundImage) {
        // Background image is drawn via CSS
        ctx.fillStyle = `rgba(0, 0, 0, ${settings.backgroundDim / 100})`
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
      } else if (settings.backgroundType === "gradient") {
        const gradient = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height)
        gradient.addColorStop(0, settings.backgroundGradient[0])
        gradient.addColorStop(1, settings.backgroundGradient[1])
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
      } else {
        ctx.fillStyle = settings.backgroundColor
        ctx.fillRect(0, 0, dimensions.width, dimensions.height)
      }

      drawVisualizer(dataArray, timeDataArray)
      drawTextOverlays(currentTime)
      drawLogo()
      drawProgressBar()
      drawWatermark()
    }

    draw()

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [settings, currentTime, dimensions])

  const togglePlay = useCallback(async () => {
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
  }, [isPlaying])

  const restart = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = settings.trimStart
    setCurrentTime(settings.trimStart)
  }

  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(
      settings.trimStart,
      Math.min(audio.currentTime + seconds, settings.trimEnd || settings.audioDuration),
    )
  }

  const handleVolumeChange = (value: number[]) => {
    const vol = value[0]
    setVolume(vol)
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = vol
    }
    setIsMuted(vol === 0)
  }

  const toggleMute = () => {
    if (isMuted) {
      handleVolumeChange([volume || 1])
    } else {
      if (audioRef.current) audioRef.current.volume = 0
      if (gainNodeRef.current) gainNodeRef.current.gain.value = 0
    }
    setIsMuted(!isMuted)
  }

  const handleSeek = (value: number[]) => {
    const time = value[0]
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
    setCurrentTime(time)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const toggleFullscreen = () => {
    const container = canvasRef.current?.parentElement
    if (!container) return

    if (!isFullscreen) {
      container.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setIsFullscreen(!isFullscreen)
  }

  // Handle trim boundaries
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      const time = audio.currentTime
      setCurrentTime(time)

      // Handle trim end
      if (settings.trimEnd && time >= settings.trimEnd) {
        audio.pause()
        setIsPlaying(false)
      }

      // Handle fade in/out
      if (gainNodeRef.current) {
        let fadeMultiplier = 1

        if (settings.fadeInDuration > 0 && time < settings.trimStart + settings.fadeInDuration) {
          fadeMultiplier = (time - settings.trimStart) / settings.fadeInDuration
        }

        if (settings.fadeOutDuration > 0) {
          const endTime = settings.trimEnd || settings.audioDuration
          if (time > endTime - settings.fadeOutDuration) {
            fadeMultiplier = Math.min(fadeMultiplier, (endTime - time) / settings.fadeOutDuration)
          }
        }

        gainNodeRef.current.gain.value = volume * Math.max(0, fadeMultiplier)
      }
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate)
  }, [
    settings.trimStart,
    settings.trimEnd,
    settings.fadeInDuration,
    settings.fadeOutDuration,
    settings.audioDuration,
    volume,
  ])

  return (
    <div className="space-y-4 sticky top-4">
      <Card className="overflow-hidden">
        <div
          className="relative flex items-center justify-center bg-black"
          style={{
            aspectRatio: settings.aspectRatio.replace(":", "/"),
            maxHeight: "60vh",
          }}
        >
          {/* Background video layer */}
          {settings.backgroundType === "video" && settings.backgroundVideo && (
            <video
              ref={bgVideoRef}
              src={settings.backgroundVideo}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: `blur(${settings.backgroundBlur}px)` }}
              muted
              loop
              autoPlay
              playsInline
            />
          )}

          {/* Background image layer */}
          {settings.backgroundType === "image" && settings.backgroundImage && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${settings.backgroundImage})`,
                filter: `blur(${settings.backgroundBlur}px)`,
              }}
            />
          )}

          {/* Dim overlay */}
          {(settings.backgroundType === "image" || settings.backgroundType === "video") &&
            settings.backgroundDim > 0 && (
              <div
                className="absolute inset-0"
                style={{ backgroundColor: `rgba(0, 0, 0, ${settings.backgroundDim / 100})` }}
              />
            )}

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className="relative z-10 max-w-full max-h-full object-contain"
            style={{ width: "100%", height: "100%" }}
          />

          {/* Fullscreen button */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 z-20 bg-black/50 hover:bg-black/70"
            onClick={toggleFullscreen}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          {settings.audioUrl && <audio ref={audioRef} src={settings.audioUrl} onEnded={() => setIsPlaying(false)} />}
        </div>
      </Card>

      {/* Timeline */}
      {settings.audioUrl && (
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            onValueChange={handleSeek}
            min={settings.trimStart}
            max={settings.trimEnd || settings.audioDuration}
            step={0.1}
            className="w-full"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(settings.trimEnd || settings.audioDuration)}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => skip(-10)} disabled={!settings.audioUrl}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={togglePlay} disabled={!settings.audioUrl}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => skip(10)} disabled={!settings.audioUrl}>
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={restart} disabled={!settings.audioUrl}>
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* Volume control */}
          <div className="flex items-center gap-2 ml-2">
            <Button size="icon" variant="ghost" onClick={toggleMute}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              onValueChange={handleVolumeChange}
              min={0}
              max={1}
              step={0.01}
              className="w-20"
            />
          </div>
        </div>

        <Button className="gap-2" onClick={onExport}>
          Continue to Export
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
