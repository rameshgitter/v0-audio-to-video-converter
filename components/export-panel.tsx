"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Download,
  Youtube,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  Share2,
  Copy,
  Clock,
  HardDrive,
  Sparkles,
  Video,
  Settings,
} from "lucide-react"
import type { ProjectSettings } from "@/app/create/page"

interface ExportPanelProps {
  settings: ProjectSettings
  updateSettings: (updates: Partial<ProjectSettings>) => void
  onBack: () => void
}

type ExportStatus = "idle" | "preparing" | "rendering" | "encoding" | "complete" | "error"
type YouTubeStatus = "disconnected" | "connecting" | "connected" | "uploading" | "processing" | "complete"

export function ExportPanel({ settings, onBack }: ExportPanelProps) {
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [totalFrames, setTotalFrames] = useState(0)
  const [youtubeStatus, setYoutubeStatus] = useState<YouTubeStatus>("disconnected")
  const [youtubeTitle, setYoutubeTitle] = useState(settings.title)
  const [youtubeDescription, setYoutubeDescription] = useState("")
  const [youtubeTags, setYoutubeTags] = useState("")
  const [youtubePrivacy, setYoutubePrivacy] = useState<"public" | "unlisted" | "private">("public")
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [estimatedSize, setEstimatedSize] = useState<string>("")
  const [renderTime, setRenderTime] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Calculate resolution based on quality
  const getResolution = () => {
    const aspectRatio = settings.aspectRatio
    const [w, h] = aspectRatio.split(":").map(Number)
    const ratio = w / h

    switch (settings.quality) {
      case "720p":
        return ratio >= 1
          ? { width: 1280, height: Math.round(1280 / ratio) }
          : { width: Math.round(720 * ratio), height: 720 }
      case "1080p":
        return ratio >= 1
          ? { width: 1920, height: Math.round(1920 / ratio) }
          : { width: Math.round(1080 * ratio), height: 1080 }
      case "1440p":
        return ratio >= 1
          ? { width: 2560, height: Math.round(2560 / ratio) }
          : { width: Math.round(1440 * ratio), height: 1440 }
      case "4k":
        return ratio >= 1
          ? { width: 3840, height: Math.round(3840 / ratio) }
          : { width: Math.round(2160 * ratio), height: 2160 }
      default:
        return { width: 1920, height: 1080 }
    }
  }

  const resolution = getResolution()

  // Estimate file size
  const estimateFileSize = useCallback(() => {
    const duration = (settings.trimEnd || settings.audioDuration) - settings.trimStart
    const pixels = resolution.width * resolution.height
    const fps = settings.fps
    const bitratePerPixel = 0.1 // bits per pixel
    const bitrate = pixels * fps * bitratePerPixel
    const sizeBytes = (bitrate * duration) / 8
    const sizeMB = sizeBytes / (1024 * 1024)

    if (sizeMB < 1) {
      return `~${Math.round(sizeMB * 1024)} KB`
    } else if (sizeMB < 1024) {
      return `~${sizeMB.toFixed(1)} MB`
    } else {
      return `~${(sizeMB / 1024).toFixed(2)} GB`
    }
  }, [settings, resolution])

  // Real video export using MediaRecorder API
  const exportVideo = async () => {
    setExportStatus("preparing")
    setProgress(0)
    const startTime = Date.now()

    try {
      // Create offscreen canvas for rendering
      const canvas = document.createElement("canvas")
      canvas.width = resolution.width
      canvas.height = resolution.height
      const ctx = canvas.getContext("2d")!

      // Setup MediaRecorder
      const stream = canvas.captureStream(settings.fps)

      // Add audio track if we have audio
      if (settings.audioUrl) {
        const audioElement = new Audio(settings.audioUrl)
        audioElement.crossOrigin = "anonymous"
        await new Promise((resolve) => {
          audioElement.addEventListener("canplaythrough", resolve, { once: true })
          audioElement.load()
        })

        const audioContext = new AudioContext()
        const source = audioContext.createMediaElementSource(audioElement)
        const destination = audioContext.createMediaStreamDestination()
        source.connect(destination)
        source.connect(audioContext.destination)

        destination.stream.getAudioTracks().forEach((track) => {
          stream.addTrack(track)
        })

        audioElement.currentTime = settings.trimStart
        audioElement.play()
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: resolution.width * resolution.height * settings.fps * 0.1,
      })

      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      const duration = (settings.trimEnd || settings.audioDuration) - settings.trimStart
      const totalFramesCount = Math.ceil(duration * settings.fps)
      setTotalFrames(totalFramesCount)

      setExportStatus("rendering")

      mediaRecorder.start(100)

      // Render frames
      let frame = 0
      const frameInterval = 1000 / settings.fps

      const renderFrame = () => {
        if (frame >= totalFramesCount) {
          mediaRecorder.stop()
          return
        }

        const time = settings.trimStart + frame / settings.fps

        // Clear canvas
        ctx.fillStyle = "#000"
        ctx.fillRect(0, 0, resolution.width, resolution.height)

        // Draw background
        if (settings.backgroundType === "gradient") {
          const gradient = ctx.createLinearGradient(0, 0, resolution.width, resolution.height)
          gradient.addColorStop(0, settings.backgroundGradient[0])
          gradient.addColorStop(1, settings.backgroundGradient[1])
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, resolution.width, resolution.height)
        } else {
          ctx.fillStyle = settings.backgroundColor
          ctx.fillRect(0, 0, resolution.width, resolution.height)
        }

        // Simulate visualizer (in real implementation, use actual audio data)
        const centerX = resolution.width / 2
        const centerY = resolution.height / 2
        const barCount = 64

        for (let i = 0; i < barCount; i++) {
          const amplitude = Math.sin(time * 10 + i * 0.2) * 0.5 + 0.5
          const barHeight = amplitude * resolution.height * 0.3 * settings.visualizerSensitivity
          const barWidth = (resolution.width / barCount) * 0.8
          const x = i * (resolution.width / barCount)
          const y = centerY - barHeight / 2

          const gradient = ctx.createLinearGradient(x, y, x, y + barHeight)
          gradient.addColorStop(0, settings.visualizerColor)
          gradient.addColorStop(1, settings.visualizerSecondaryColor)
          ctx.fillStyle = gradient
          ctx.fillRect(x, y, barWidth, barHeight)
        }

        // Draw text overlays
        settings.textOverlays.forEach((overlay) => {
          if (time >= overlay.startTime && time <= overlay.endTime) {
            ctx.font = `${overlay.fontSize * (resolution.width / 640)}px ${overlay.fontFamily}`
            ctx.fillStyle = overlay.color
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            const x = (overlay.position.x / 100) * resolution.width
            const y = (overlay.position.y / 100) * resolution.height
            ctx.fillText(overlay.text, x, y)
          }
        })

        // Draw watermark
        if (settings.watermark.enabled) {
          ctx.font = `${16 * (resolution.width / 640)}px Inter`
          ctx.fillStyle = `rgba(255, 255, 255, ${settings.watermark.opacity / 100})`
          ctx.textAlign = "right"
          ctx.textBaseline = "bottom"
          ctx.fillText(settings.watermark.text, resolution.width - 20, resolution.height - 20)
        }

        // Draw progress bar
        if (settings.progress.enabled) {
          const progressValue = (time - settings.trimStart) / duration
          const barHeight = 6 * (resolution.width / 640)
          const y = settings.progress.position === "top" ? 20 : resolution.height - 20 - barHeight

          ctx.fillStyle = `${settings.progress.color}40`
          ctx.fillRect(20, y, resolution.width - 40, barHeight)
          ctx.fillStyle = settings.progress.color
          ctx.fillRect(20, y, (resolution.width - 40) * progressValue, barHeight)
        }

        setCurrentFrame(frame)
        setProgress((frame / totalFramesCount) * 80)
        frame++

        setTimeout(renderFrame, frameInterval / 4) // Render faster than realtime
      }

      renderFrame()

      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => resolve()
      })

      setExportStatus("encoding")
      setProgress(90)

      // Create final blob
      const blob = new Blob(chunks, { type: "video/webm" })
      setVideoBlob(blob)

      const elapsed = (Date.now() - startTime) / 1000
      setRenderTime(
        `${Math.floor(elapsed / 60)}:${Math.floor(elapsed % 60)
          .toString()
          .padStart(2, "0")}`,
      )
      setEstimatedSize(`${(blob.size / (1024 * 1024)).toFixed(1)} MB`)

      setProgress(100)
      setExportStatus("complete")
    } catch (error) {
      console.error("Export error:", error)
      setExportStatus("error")
    }
  }

  const downloadVideo = () => {
    if (!videoBlob) return

    const url = URL.createObjectURL(videoBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${settings.title.replace(/[^a-z0-9]/gi, "_")}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const connectYouTube = () => {
    setYoutubeStatus("connecting")
    // Simulate OAuth flow
    setTimeout(() => {
      setYoutubeStatus("connected")
    }, 1500)
  }

  const uploadToYouTube = () => {
    if (!videoBlob) return

    setYoutubeStatus("uploading")
    let uploadProgress = 0

    const interval = setInterval(() => {
      uploadProgress += Math.random() * 15
      if (uploadProgress >= 100) {
        clearInterval(interval)
        setYoutubeStatus("processing")
        setTimeout(() => {
          setYoutubeStatus("complete")
        }, 2000)
      }
    }, 500)
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText("https://audiovid.pro/share/abc123")
  }

  const getStatusText = () => {
    switch (exportStatus) {
      case "preparing":
        return "Preparing export..."
      case "rendering":
        return `Rendering frame ${currentFrame} of ${totalFrames}...`
      case "encoding":
        return "Encoding video..."
      case "complete":
        return "Export complete!"
      case "error":
        return "Export failed"
      default:
        return "Ready to export"
    }
  }

  const duration = (settings.trimEnd || settings.audioDuration) - settings.trimStart

  return (
    <div className="max-w-5xl mx-auto">
      <Button variant="ghost" className="mb-6 gap-2" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to Editor
      </Button>

      {/* Export Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Export Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Resolution</p>
              <p className="font-medium">
                {resolution.width} x {resolution.height}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">
                {Math.floor(duration / 60)}:
                {Math.floor(duration % 60)
                  .toString()
                  .padStart(2, "0")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Frame Rate</p>
              <p className="font-medium">{settings.fps} FPS</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Est. Size</p>
              <p className="font-medium">{estimatedSize || estimateFileSize()}</p>
            </div>
          </div>

          {/* Features included */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Included features:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{settings.visualizerStyle} visualizer</Badge>
              <Badge variant="secondary">{settings.backgroundType} background</Badge>
              {settings.textOverlays.length > 0 && (
                <Badge variant="secondary">{settings.textOverlays.length} text overlay(s)</Badge>
              )}
              {settings.showLogo && <Badge variant="secondary">Logo</Badge>}
              {settings.progress.enabled && <Badge variant="secondary">Progress bar</Badge>}
              {settings.watermark.enabled && <Badge variant="secondary">Watermark</Badge>}
              {settings.fadeInDuration > 0 && <Badge variant="secondary">Fade in</Badge>}
              {settings.fadeOutDuration > 0 && <Badge variant="secondary">Fade out</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Download Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Video
            </CardTitle>
            <CardDescription>Export your video as a WebM file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {exportStatus === "idle" && (
              <>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Quality
                    </span>
                    <span className="font-medium">{settings.quality}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Est. Render Time
                    </span>
                    <span className="font-medium">~{Math.ceil(duration / 10)} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Est. File Size
                    </span>
                    <span className="font-medium">{estimateFileSize()}</span>
                  </div>
                </div>

                <Button className="w-full gap-2" size="lg" onClick={exportVideo}>
                  <Sparkles className="h-4 w-4" />
                  Generate Video
                </Button>
              </>
            )}

            {(exportStatus === "preparing" || exportStatus === "rendering" || exportStatus === "encoding") && (
              <div className="space-y-4">
                <Progress value={progress} className="h-3" />
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {getStatusText()}
                </div>
                {exportStatus === "rendering" && (
                  <p className="text-xs text-center text-muted-foreground">
                    This may take a few minutes depending on video length and quality.
                  </p>
                )}
              </div>
            )}

            {exportStatus === "complete" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-500">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Video generated successfully!</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-muted-foreground">Render Time</p>
                    <p className="font-medium">{renderTime}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-muted-foreground">File Size</p>
                    <p className="font-medium">{estimatedSize}</p>
                  </div>
                </div>

                <Button className="w-full gap-2" size="lg" onClick={downloadVideo}>
                  <Download className="h-4 w-4" />
                  Download WebM
                </Button>

                <Button
                  variant="outline"
                  className="w-full gap-2 bg-transparent"
                  onClick={() => setExportStatus("idle")}
                >
                  Generate Again
                </Button>
              </div>
            )}

            {exportStatus === "error" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span>Error generating video. Please try again.</span>
                </div>
                <Button className="w-full gap-2" onClick={() => setExportStatus("idle")}>
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* YouTube Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              Upload to YouTube
            </CardTitle>
            <CardDescription>Publish directly to your YouTube channel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {youtubeStatus === "disconnected" && (
              <Button className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white" onClick={connectYouTube}>
                <Youtube className="h-4 w-4" />
                Connect YouTube Channel
              </Button>
            )}

            {youtubeStatus === "connecting" && (
              <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting to YouTube...
              </div>
            )}

            {(youtubeStatus === "connected" || youtubeStatus === "uploading" || youtubeStatus === "processing") && (
              <>
                <div className="flex items-center gap-2 text-sm text-green-500 mb-4">
                  <CheckCircle2 className="h-4 w-4" />
                  YouTube connected
                </div>

                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-3 mt-4">
                    <div>
                      <Label htmlFor="yt-title">Video Title</Label>
                      <Input
                        id="yt-title"
                        value={youtubeTitle}
                        onChange={(e) => setYoutubeTitle(e.target.value)}
                        placeholder="Enter video title"
                        className="mt-1.5"
                        maxLength={100}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{youtubeTitle.length}/100</p>
                    </div>

                    <div>
                      <Label htmlFor="yt-desc">Description</Label>
                      <Textarea
                        id="yt-desc"
                        value={youtubeDescription}
                        onChange={(e) => setYoutubeDescription(e.target.value)}
                        placeholder="Enter video description"
                        className="mt-1.5 min-h-24"
                        maxLength={5000}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{youtubeDescription.length}/5000</p>
                    </div>

                    <div>
                      <Label htmlFor="yt-tags">Tags (comma separated)</Label>
                      <Input
                        id="yt-tags"
                        value={youtubeTags}
                        onChange={(e) => setYoutubeTags(e.target.value)}
                        placeholder="music, audio, visualizer"
                        className="mt-1.5"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-3 mt-4">
                    <div>
                      <Label>Privacy</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {(["public", "unlisted", "private"] as const).map((p) => (
                          <button
                            key={p}
                            onClick={() => setYoutubePrivacy(p)}
                            className={`p-2 rounded-lg border transition-colors text-sm capitalize ${
                              youtubePrivacy === p
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {youtubeStatus === "uploading" && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-center text-muted-foreground">Uploading...</p>
                  </div>
                )}

                {youtubeStatus === "processing" && (
                  <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    YouTube is processing your video...
                  </div>
                )}

                {youtubeStatus === "connected" && (
                  <Button
                    className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white"
                    onClick={uploadToYouTube}
                    disabled={exportStatus !== "complete"}
                  >
                    <Youtube className="h-4 w-4" />
                    Upload to YouTube
                  </Button>
                )}

                {exportStatus !== "complete" && youtubeStatus === "connected" && (
                  <p className="text-xs text-muted-foreground text-center">
                    Generate your video first before uploading
                  </p>
                )}
              </>
            )}

            {youtubeStatus === "complete" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-500">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Uploaded successfully!</span>
                </div>
                <Button variant="outline" className="w-full gap-2 bg-transparent">
                  <ExternalLink className="h-4 w-4" />
                  View on YouTube
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Share Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Creation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value="https://audiovid.pro/share/abc123" readOnly className="flex-1" />
            <Button variant="secondary" size="icon" onClick={copyShareLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Share this link with others to let them view your video project.
          </p>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Pro Tips for Better YouTube Performance</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Use a descriptive title with relevant keywords for better discoverability</li>
            <li>• Add timestamps in your description if your audio has multiple sections</li>
            <li>• Include links to your other social media and streaming platforms</li>
            <li>• Use relevant tags to help YouTube categorize your content</li>
            <li>• Upload a custom thumbnail after the video is processed</li>
            <li>• Consider scheduling your upload for optimal audience engagement times</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
