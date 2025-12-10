// Video rendering utilities using Canvas API and MediaRecorder

export interface RenderSettings {
  width: number
  height: number
  fps: number
  audioDuration: number
  trimStart: number
  trimEnd: number
  visualizerStyle: string
  visualizerColor: string
  visualizerSecondaryColor: string
  visualizerSensitivity: number
  backgroundType: string
  backgroundColor: string
  backgroundGradient: [string, string]
  textOverlays: Array<{
    text: string
    fontSize: number
    fontFamily: string
    color: string
    position: { x: number; y: number }
    startTime: number
    endTime: number
  }>
  watermark?: { text: string; opacity: number }
  progress?: { enabled: boolean; style: string; color: string; position: string }
}

export interface RenderProgress {
  frame: number
  totalFrames: number
  percentage: number
  phase: "preparing" | "rendering" | "encoding" | "complete"
}

export type RenderCallback = (progress: RenderProgress) => void

export async function renderVideo(
  audioUrl: string,
  settings: RenderSettings,
  onProgress: RenderCallback,
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      onProgress({ frame: 0, totalFrames: 0, percentage: 0, phase: "preparing" })

      // Create canvas
      const canvas = document.createElement("canvas")
      canvas.width = settings.width
      canvas.height = settings.height
      const ctx = canvas.getContext("2d")!

      // Setup audio context for analysis
      const audioContext = new AudioContext()
      const response = await fetch(audioUrl)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // Pre-compute frequency data for all frames
      const duration = settings.trimEnd - settings.trimStart
      const totalFrames = Math.ceil(duration * settings.fps)
      const frequencyDataPerFrame: Uint8Array[] = []

      // Analyze audio to get frequency data
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate,
      )
      const source = offlineContext.createBufferSource()
      source.buffer = audioBuffer
      const analyser = offlineContext.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      analyser.connect(offlineContext.destination)
      source.start(0)

      // Generate synthetic frequency data based on audio amplitude
      const channelData = audioBuffer.getChannelData(0)
      const samplesPerFrame = Math.floor(audioBuffer.sampleRate / settings.fps)

      for (let frame = 0; frame < totalFrames; frame++) {
        const startSample = Math.floor((settings.trimStart + frame / settings.fps) * audioBuffer.sampleRate)
        const frequencyData = new Uint8Array(256)

        // Calculate RMS amplitude for this frame
        let sum = 0
        for (let i = 0; i < samplesPerFrame && startSample + i < channelData.length; i++) {
          sum += channelData[startSample + i] ** 2
        }
        const rms = Math.sqrt(sum / samplesPerFrame)
        const amplitude = Math.min(1, rms * 10)

        // Generate synthetic frequency bins
        for (let i = 0; i < 256; i++) {
          const freq = i / 256
          const value = amplitude * (1 - freq * 0.5) * (0.5 + Math.sin(frame * 0.1 + i * 0.1) * 0.5)
          frequencyData[i] = Math.floor(value * 255)
        }

        frequencyDataPerFrame.push(frequencyData)
      }

      // Setup MediaRecorder
      const stream = canvas.captureStream(settings.fps)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: settings.width * settings.height * settings.fps * 0.1,
      })

      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      mediaRecorder.onstop = () => {
        onProgress({ frame: totalFrames, totalFrames, percentage: 100, phase: "complete" })
        resolve(new Blob(chunks, { type: "video/webm" }))
      }

      mediaRecorder.onerror = (e) => reject(e)

      // Start recording
      mediaRecorder.start(100)
      onProgress({ frame: 0, totalFrames, percentage: 0, phase: "rendering" })

      // Render each frame
      let currentFrame = 0

      const renderNextFrame = () => {
        if (currentFrame >= totalFrames) {
          onProgress({ frame: totalFrames, totalFrames, percentage: 95, phase: "encoding" })
          mediaRecorder.stop()
          return
        }

        const time = settings.trimStart + currentFrame / settings.fps
        const frequencyData = frequencyDataPerFrame[currentFrame]

        // Clear canvas
        ctx.clearRect(0, 0, settings.width, settings.height)

        // Draw background
        if (settings.backgroundType === "gradient") {
          const gradient = ctx.createLinearGradient(0, 0, settings.width, settings.height)
          gradient.addColorStop(0, settings.backgroundGradient[0])
          gradient.addColorStop(1, settings.backgroundGradient[1])
          ctx.fillStyle = gradient
        } else {
          ctx.fillStyle = settings.backgroundColor
        }
        ctx.fillRect(0, 0, settings.width, settings.height)

        // Draw visualizer
        drawVisualizer(ctx, frequencyData, settings)

        // Draw text overlays
        settings.textOverlays.forEach((overlay) => {
          if (time >= overlay.startTime && time <= overlay.endTime) {
            ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`
            ctx.fillStyle = overlay.color
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            const x = (overlay.position.x / 100) * settings.width
            const y = (overlay.position.y / 100) * settings.height
            ctx.fillText(overlay.text, x, y)
          }
        })

        // Draw progress bar
        if (settings.progress?.enabled) {
          const progressValue = (time - settings.trimStart) / duration
          const barHeight = 6
          const y = settings.progress.position === "top" ? 20 : settings.height - 26

          ctx.fillStyle = `${settings.progress.color}40`
          ctx.fillRect(20, y, settings.width - 40, barHeight)
          ctx.fillStyle = settings.progress.color
          ctx.fillRect(20, y, (settings.width - 40) * progressValue, barHeight)
        }

        // Draw watermark
        if (settings.watermark) {
          ctx.font = "16px Inter, sans-serif"
          ctx.fillStyle = `rgba(255, 255, 255, ${settings.watermark.opacity / 100})`
          ctx.textAlign = "right"
          ctx.textBaseline = "bottom"
          ctx.fillText(settings.watermark.text, settings.width - 20, settings.height - 20)
        }

        currentFrame++
        onProgress({
          frame: currentFrame,
          totalFrames,
          percentage: Math.floor((currentFrame / totalFrames) * 90),
          phase: "rendering",
        })

        // Use setTimeout for controlled frame rate
        setTimeout(renderNextFrame, 1000 / (settings.fps * 2))
      }

      renderNextFrame()

      audioContext.close()
    } catch (error) {
      reject(error)
    }
  })
}

function drawVisualizer(ctx: CanvasRenderingContext2D, frequencyData: Uint8Array, settings: RenderSettings) {
  const { width, height, visualizerStyle, visualizerColor, visualizerSecondaryColor, visualizerSensitivity } = settings
  const centerX = width / 2
  const centerY = height / 2
  const bufferLength = frequencyData.length

  switch (visualizerStyle) {
    case "bars": {
      const barCount = 64
      const barWidth = (width / barCount) * 0.8

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength)
        const barHeight = (frequencyData[dataIndex] / 255) * height * 0.5 * visualizerSensitivity
        const x = i * (width / barCount)
        const y = centerY - barHeight / 2

        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight)
        gradient.addColorStop(0, visualizerColor)
        gradient.addColorStop(1, visualizerSecondaryColor)
        ctx.fillStyle = gradient
        ctx.fillRect(x, y, barWidth, barHeight)
      }
      break
    }

    case "circular": {
      const radius = Math.min(width, height) * 0.25
      const bars = 128

      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2
        const dataIndex = Math.floor((i / bars) * bufferLength)
        const amplitude = (frequencyData[dataIndex] / 255) * radius * 0.5 * visualizerSensitivity

        const x1 = centerX + Math.cos(angle) * radius
        const y1 = centerY + Math.sin(angle) * radius
        const x2 = centerX + Math.cos(angle) * (radius + amplitude)
        const y2 = centerY + Math.sin(angle) * (radius + amplitude)

        ctx.strokeStyle = i % 2 === 0 ? visualizerColor : visualizerSecondaryColor
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
      break
    }

    case "wave": {
      ctx.beginPath()
      ctx.moveTo(0, centerY)

      for (let i = 0; i < bufferLength; i++) {
        const x = (i / bufferLength) * width
        const y = centerY + ((frequencyData[i] - 128) / 128) * height * 0.3 * visualizerSensitivity
        ctx.lineTo(x, y)
      }

      const gradient = ctx.createLinearGradient(0, 0, width, 0)
      gradient.addColorStop(0, visualizerColor)
      gradient.addColorStop(0.5, visualizerSecondaryColor)
      gradient.addColorStop(1, visualizerColor)
      ctx.strokeStyle = gradient
      ctx.lineWidth = 3
      ctx.stroke()
      break
    }

    default:
      // Default bars visualization
      const defaultBarCount = 32
      const defaultBarWidth = (width / defaultBarCount) * 0.7

      for (let i = 0; i < defaultBarCount; i++) {
        const dataIndex = Math.floor((i / defaultBarCount) * bufferLength)
        const barHeight = (frequencyData[dataIndex] / 255) * height * 0.4 * visualizerSensitivity
        const x = i * (width / defaultBarCount) + (width / defaultBarCount) * 0.15
        const y = centerY - barHeight / 2

        ctx.fillStyle = visualizerColor
        ctx.fillRect(x, y, defaultBarWidth, barHeight)
      }
  }
}

export function estimateRenderTime(settings: RenderSettings): number {
  const duration = settings.trimEnd - settings.trimStart
  const totalFrames = duration * settings.fps
  const pixelsPerFrame = settings.width * settings.height

  // Rough estimate: ~0.05ms per 1000 pixels
  const msPerFrame = (pixelsPerFrame / 1000) * 0.05

  return (totalFrames * msPerFrame) / 1000 // Convert to seconds
}

export function estimateFileSize(settings: RenderSettings): number {
  const duration = settings.trimEnd - settings.trimStart
  const pixels = settings.width * settings.height
  const fps = settings.fps
  const bitratePerPixel = 0.1 // bits per pixel
  const bitrate = pixels * fps * bitratePerPixel
  return (bitrate * duration) / 8 // bytes
}
