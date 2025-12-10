// Canvas-based frame renderer for video generation
import type { ProjectSettings } from "@/app/create/page"

interface RenderContext {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  settings: ProjectSettings
  audioData: Float32Array
  frequencyData: Uint8Array
}

export function createRenderContext(width: number, height: number, settings: ProjectSettings): RenderContext {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d", { willReadFrequently: false })!

  return {
    canvas,
    ctx,
    width,
    height,
    settings,
    audioData: new Float32Array(2048),
    frequencyData: new Uint8Array(256),
  }
}

export function renderFrame(context: RenderContext, time: number, frequencyData: Uint8Array): void {
  const { ctx, width, height, settings } = context

  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  // Draw background
  renderBackground(context)

  // Draw animated background if enabled
  if (settings.backgroundType === "animated") {
    renderAnimatedBackground(context, time)
  }

  // Apply background blur if needed
  if (settings.backgroundBlur > 0 && (settings.backgroundType === "image" || settings.backgroundType === "video")) {
    ctx.filter = `blur(${settings.backgroundBlur}px)`
  }

  // Draw visualizer
  renderVisualizer(context, frequencyData)

  // Reset filter
  ctx.filter = "none"

  // Draw text overlays
  renderTextOverlays(context, time)

  // Draw logo
  if (settings.showLogo && settings.logoUrl) {
    renderLogo(context)
  }

  // Draw progress bar
  if (settings.progress.enabled) {
    const duration = (settings.trimEnd || settings.audioDuration) - settings.trimStart
    const progressValue = (time - settings.trimStart) / duration
    renderProgressBar(context, progressValue)
  }

  // Draw watermark
  if (settings.watermark.enabled) {
    renderWatermark(context)
  }

  // Apply fade effects
  const duration = (settings.trimEnd || settings.audioDuration) - settings.trimStart
  const relativeTime = time - settings.trimStart

  if (settings.fadeInDuration > 0 && relativeTime < settings.fadeInDuration) {
    const opacity = 1 - relativeTime / settings.fadeInDuration
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`
    ctx.fillRect(0, 0, width, height)
  }

  if (settings.fadeOutDuration > 0 && relativeTime > duration - settings.fadeOutDuration) {
    const fadeStart = duration - settings.fadeOutDuration
    const opacity = (relativeTime - fadeStart) / settings.fadeOutDuration
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`
    ctx.fillRect(0, 0, width, height)
  }
}

function renderBackground(context: RenderContext) {
  const { ctx, width, height, settings } = context

  if (settings.backgroundType === "gradient") {
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, settings.backgroundGradient[0])
    gradient.addColorStop(1, settings.backgroundGradient[1])
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  } else if (settings.backgroundType === "solid") {
    ctx.fillStyle = settings.backgroundColor
    ctx.fillRect(0, 0, width, height)
  }
}

function renderAnimatedBackground(context: RenderContext, time: number) {
  const { ctx, width, height, settings } = context
  const bgType = settings.animatedBackground

  if (bgType === "particles") {
    // Floating particles
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)"
    for (let i = 0; i < 50; i++) {
      const x = (Math.sin(time * 0.5 + i * 1.3) * 0.5 + 0.5) * width
      const y = (Math.cos(time * 0.3 + i * 1.7) * 0.5 + 0.5) * height
      const size = 2 + Math.sin(time + i) * 2
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (bgType === "matrix") {
    // Matrix rain effect
    ctx.fillStyle = "rgba(0, 255, 0, 0.05)"
    ctx.font = "14px monospace"
    for (let i = 0; i < 30; i++) {
      const x = (i / 30) * width
      const y = ((time * 100 + i * 50) % (height + 200)) - 100
      ctx.fillText(String.fromCharCode(0x30a0 + Math.random() * 96), x, y)
    }
  } else if (bgType === "stars") {
    // Starfield
    ctx.fillStyle = "white"
    for (let i = 0; i < 100; i++) {
      const seed = i * 1234.5678
      const x = (seed * 9.8) % width
      const y = (seed * 7.3) % height
      const twinkle = Math.sin(time * 3 + i) * 0.5 + 0.5
      ctx.globalAlpha = twinkle * 0.8
      ctx.beginPath()
      ctx.arc(x, y, 1 + twinkle, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}

function renderVisualizer(context: RenderContext, frequencyData: Uint8Array) {
  const { ctx, width, height, settings } = context
  const style = settings.visualizerStyle

  // Apply glow effect
  if (settings.visualizerGlow) {
    ctx.shadowColor = settings.visualizerColor
    ctx.shadowBlur = 20
  }

  const sensitivity = settings.visualizerSensitivity

  switch (style) {
    case "bars":
      renderBarsVisualizer(context, frequencyData, sensitivity)
      break
    case "wave":
      renderWaveVisualizer(context, frequencyData, sensitivity)
      break
    case "circular":
      renderCircularVisualizer(context, frequencyData, sensitivity)
      break
    case "particles":
      renderParticlesVisualizer(context, frequencyData, sensitivity)
      break
    case "spectrum":
      renderSpectrumVisualizer(context, frequencyData, sensitivity)
      break
    case "blob":
      renderBlobVisualizer(context, frequencyData, sensitivity)
      break
    case "radialBars":
      renderRadialBarsVisualizer(context, frequencyData, sensitivity)
      break
    case "oscilloscope":
      renderOscilloscopeVisualizer(context, frequencyData, sensitivity)
      break
  }

  // Reset shadow
  ctx.shadowBlur = 0
}

function renderBarsVisualizer(context: RenderContext, frequencyData: Uint8Array, sensitivity: number) {
  const { ctx, width, height, settings } = context
  const barCount = 64
  const barWidth = (width / barCount) * 0.8
  const gap = (width / barCount) * 0.2

  for (let i = 0; i < barCount; i++) {
    const dataIndex = Math.floor((i / barCount) * frequencyData.length)
    const amplitude = (frequencyData[dataIndex] / 255) * sensitivity
    const barHeight = amplitude * height * 0.6

    const x = i * (barWidth + gap) + gap / 2
    const y = (height - barHeight) / 2

    const gradient = ctx.createLinearGradient(x, y, x, y + barHeight)
    gradient.addColorStop(0, settings.visualizerColor)
    gradient.addColorStop(1, settings.visualizerSecondaryColor)

    ctx.fillStyle = gradient
    ctx.fillRect(x, y, barWidth, barHeight)

    // Mirror if enabled
    if (settings.visualizerMirror) {
      ctx.fillRect(x, height - y - barHeight, barWidth, barHeight)
    }
  }
}

function renderWaveVisualizer(context: RenderContext, frequencyData: Uint8Array, sensitivity: number) {
  const { ctx, width, height, settings } = context

  ctx.strokeStyle = settings.visualizerColor
  ctx.lineWidth = 3
  ctx.beginPath()

  const sliceWidth = width / frequencyData.length
  let x = 0

  for (let i = 0; i < frequencyData.length; i++) {
    const v = (frequencyData[i] / 255) * sensitivity
    const y = v * height * 0.5 + height / 2

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
    x += sliceWidth
  }

  ctx.stroke()

  // Draw secondary wave
  ctx.strokeStyle = settings.visualizerSecondaryColor
  ctx.beginPath()
  x = 0

  for (let i = 0; i < frequencyData.length; i++) {
    const v = (frequencyData[i] / 255) * sensitivity
    const y = height - (v * height * 0.5 + height / 2)

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
    x += sliceWidth
  }

  ctx.stroke()
}

function renderCircularVisualizer(context: RenderContext, frequencyData: Uint8Array, sensitivity: number) {
  const { ctx, width, height, settings } = context
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) * 0.25
  const barCount = 128

  for (let i = 0; i < barCount; i++) {
    const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2
    const dataIndex = Math.floor((i / barCount) * frequencyData.length)
    const amplitude = (frequencyData[dataIndex] / 255) * sensitivity
    const barLength = amplitude * radius * 0.8

    const x1 = centerX + Math.cos(angle) * radius
    const y1 = centerY + Math.sin(angle) * radius
    const x2 = centerX + Math.cos(angle) * (radius + barLength)
    const y2 = centerY + Math.sin(angle) * (radius + barLength)

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
    gradient.addColorStop(0, settings.visualizerColor)
    gradient.addColorStop(1, settings.visualizerSecondaryColor)

    ctx.strokeStyle = gradient
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    // Mirror inward
    if (settings.visualizerMirror) {
      const x3 = centerX + Math.cos(angle) * (radius - barLength * 0.5)
      const y3 = centerY + Math.sin(angle) * (radius - barLength * 0.5)
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x3, y3)
      ctx.stroke()
    }
  }
}

function renderParticlesVisualizer(context: RenderContext, frequencyData: Uint8Array, sensitivity: number) {
  const { ctx, width, height, settings } = context
  const centerX = width / 2
  const centerY = height / 2

  // Get average frequency
  let avg = 0
  for (let i = 0; i < frequencyData.length; i++) {
    avg += frequencyData[i]
  }
  avg = (avg / frequencyData.length / 255) * sensitivity

  const particleCount = 100

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2
    const baseRadius = Math.min(width, height) * 0.15
    const radius = baseRadius + avg * Math.min(width, height) * 0.3 * Math.sin(i * 0.5)

    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    const size = 2 + avg * 8

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
    gradient.addColorStop(0, settings.visualizerColor)
    gradient.addColorStop(1, "transparent")

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
}

function renderSpectrumVisualizer(context: RenderContext, frequencyData: Uint8Array, sensitivity: number) {
  const { ctx, width, height, settings } = context

  // Create filled spectrum area
  ctx.beginPath()
  ctx.moveTo(0, height)

  for (let i = 0; i < frequencyData.length; i++) {
    const x = (i / frequencyData.length) * width
    const amplitude = (frequencyData[i] / 255) * sensitivity
    const y = height - amplitude * height * 0.7
    ctx.lineTo(x, y)
  }

  ctx.lineTo(width, height)
  ctx.closePath()

  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, settings.visualizerColor)
  gradient.addColorStop(1, settings.visualizerSecondaryColor + "40")

  ctx.fillStyle = gradient
  ctx.fill()
}

function renderBlobVisualizer(context: RenderContext, frequencyData: Uint8Array, sensitivity: number) {
  const { ctx, width, height, settings } = context
  const centerX = width / 2
  const centerY = height / 2
  const baseRadius = Math.min(width, height) * 0.2

  ctx.beginPath()

  const points = 64
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2
    const dataIndex = Math.floor((i / points) * frequencyData.length)
    const amplitude = (frequencyData[dataIndex] / 255) * sensitivity
    const radius = baseRadius + amplitude * baseRadius * 0.8

    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }

  ctx.closePath()

  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 2)
  gradient.addColorStop(0, settings.visualizerColor)
  gradient.addColorStop(1, settings.visualizerSecondaryColor)

  ctx.fillStyle = gradient
  ctx.fill()
}

function renderRadialBarsVisualizer(context: RenderContext, frequencyData: Uint8Array, sensitivity: number) {
  const { ctx, width, height, settings } = context
  const centerX = width / 2
  const centerY = height / 2
  const innerRadius = Math.min(width, height) * 0.1
  const barCount = 32

  for (let i = 0; i < barCount; i++) {
    const startAngle = (i / barCount) * Math.PI * 2 - Math.PI / 2
    const endAngle = ((i + 0.8) / barCount) * Math.PI * 2 - Math.PI / 2
    const dataIndex = Math.floor((i / barCount) * frequencyData.length)
    const amplitude = (frequencyData[dataIndex] / 255) * sensitivity
    const outerRadius = innerRadius + amplitude * Math.min(width, height) * 0.35

    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, startAngle, endAngle)
    ctx.arc(centerX, centerY, outerRadius, endAngle, startAngle, true)
    ctx.closePath()

    const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius)
    gradient.addColorStop(0, settings.visualizerColor)
    gradient.addColorStop(1, settings.visualizerSecondaryColor)

    ctx.fillStyle = gradient
    ctx.fill()
  }
}

function renderOscilloscopeVisualizer(context: RenderContext, frequencyData: Uint8Array, sensitivity: number) {
  const { ctx, width, height, settings } = context

  ctx.strokeStyle = settings.visualizerColor
  ctx.lineWidth = 2
  ctx.beginPath()

  const centerY = height / 2
  const amplitude = height * 0.3 * sensitivity

  for (let i = 0; i < frequencyData.length; i++) {
    const x = (i / frequencyData.length) * width
    const v = frequencyData[i] / 128 - 1
    const y = centerY + v * amplitude

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }

  ctx.stroke()
}

function renderTextOverlays(context: RenderContext, time: number) {
  const { ctx, width, height, settings } = context

  settings.textOverlays.forEach((overlay) => {
    if (time >= overlay.startTime && time <= overlay.endTime) {
      const scale = width / 640 // Scale based on video width
      ctx.font = `${overlay.fontSize * scale}px ${overlay.fontFamily}`
      ctx.fillStyle = overlay.color
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const x = (overlay.position.x / 100) * width
      const y = (overlay.position.y / 100) * height

      // Apply animation
      let alpha = 1
      const relativeTime = time - overlay.startTime
      const duration = overlay.endTime - overlay.startTime

      if (overlay.animation === "fade") {
        const fadeTime = 0.5
        if (relativeTime < fadeTime) {
          alpha = relativeTime / fadeTime
        } else if (relativeTime > duration - fadeTime) {
          alpha = (duration - relativeTime) / fadeTime
        }
      }

      ctx.globalAlpha = alpha
      ctx.fillText(overlay.text, x, y)
      ctx.globalAlpha = 1
    }
  })
}

function renderLogo(context: RenderContext) {
  // Logo rendering would require loading the image first
  // This is handled separately in the video generation pipeline
}

function renderProgressBar(context: RenderContext, progress: number) {
  const { ctx, width, height, settings } = context
  const scale = width / 640
  const barHeight = 6 * scale
  const padding = 20 * scale
  const y = settings.progress.position === "top" ? padding : height - padding - barHeight

  // Background
  ctx.fillStyle = `${settings.progress.color}40`
  ctx.fillRect(padding, y, width - padding * 2, barHeight)

  // Progress
  ctx.fillStyle = settings.progress.color
  ctx.fillRect(padding, y, (width - padding * 2) * Math.min(progress, 1), barHeight)
}

function renderWatermark(context: RenderContext) {
  const { ctx, width, height, settings } = context
  const scale = width / 640

  ctx.font = `${16 * scale}px Inter, sans-serif`
  ctx.fillStyle = `rgba(255, 255, 255, ${settings.watermark.opacity / 100})`
  ctx.textAlign = "right"
  ctx.textBaseline = "bottom"
  ctx.fillText(settings.watermark.text, width - 20 * scale, height - 20 * scale)
}

export async function captureFrame(context: RenderContext): Promise<Blob> {
  return new Promise((resolve, reject) => {
    context.canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error("Failed to capture frame"))
        }
      },
      "image/png",
      1.0,
    )
  })
}
