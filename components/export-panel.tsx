"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Download,
  Youtube,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  Video,
  Settings,
  Clock,
  HardDrive,
  Sparkles,
  Info,
  Upload,
  RefreshCw,
} from "lucide-react"
import type { ProjectSettings } from "@/app/create/page"
import { createRenderContext, renderFrame } from "@/lib/frame-renderer"
import { isFFmpegSupported, loadFFmpeg } from "@/lib/ffmpeg-worker"

interface ExportPanelProps {
  settings: ProjectSettings
  updateSettings: (updates: Partial<ProjectSettings>) => void
  onBack: () => void
}

type ExportStatus = "idle" | "preparing" | "rendering" | "encoding" | "uploading" | "complete" | "error"
type ExportMethod = "browser" | "ffmpeg"

interface YouTubeUser {
  email: string
  name: string
  picture: string
  channelId: string
  channelTitle: string
}

export function ExportPanel({ settings, onBack }: ExportPanelProps) {
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle")
  const [exportMethod, setExportMethod] = useState<ExportMethod>("browser")
  const [progress, setProgress] = useState(0)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [totalFrames, setTotalFrames] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [cloudVideoUrl, setCloudVideoUrl] = useState<string | null>(null)
  const [estimatedSize, setEstimatedSize] = useState<string>("")
  const [renderTime, setRenderTime] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // YouTube state
  const [youtubeConnected, setYoutubeConnected] = useState(false)
  const [youtubeUser, setYoutubeUser] = useState<YouTubeUser | null>(null)
  const [youtubeLoading, setYoutubeLoading] = useState(true)
  const [youtubeTitle, setYoutubeTitle] = useState(settings.title)
  const [youtubeDescription, setYoutubeDescription] = useState("")
  const [youtubeTags, setYoutubeTags] = useState("")
  const [youtubePrivacy, setYoutubePrivacy] = useState<"public" | "unlisted" | "private">("private")
  const [youtubeUploading, setYoutubeUploading] = useState(false)
  const [youtubeUploadProgress, setYoutubeUploadProgress] = useState(0)
  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState<string | null>(null)

  const [ffmpegSupported, setFfmpegSupported] = useState(false)
  const [ffmpegLoading, setFfmpegLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Check FFmpeg support and YouTube status on mount
  useEffect(() => {
    setFfmpegSupported(isFFmpegSupported())
    checkYouTubeStatus()
  }, [])

  // Check YouTube connection status
  const checkYouTubeStatus = async () => {
    setYoutubeLoading(true)
    try {
      const response = await fetch("/api/youtube/status")
      const data = await response.json()
      setYoutubeConnected(data.connected)
      setYoutubeUser(data.user)
    } catch (error) {
      console.error("Error checking YouTube status:", error)
    }
    setYoutubeLoading(false)
  }

  // Calculate resolution based on quality
  const getResolution = useCallback(() => {
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
  }, [settings.aspectRatio, settings.quality])

  const resolution = getResolution()

  // Estimate file size
  const estimateFileSize = useCallback(() => {
    const duration = (settings.trimEnd || settings.audioDuration) - settings.trimStart
    const pixels = resolution.width * resolution.height
    const fps = settings.fps
    const bitratePerPixel = 0.1
    const bitrate = pixels * fps * bitratePerPixel
    const sizeBytes = (bitrate * duration) / 8
    const sizeMB = sizeBytes / (1024 * 1024)

    if (sizeMB < 1) return `~${Math.round(sizeMB * 1024)} KB`
    if (sizeMB < 1024) return `~${sizeMB.toFixed(1)} MB`
    return `~${(sizeMB / 1024).toFixed(2)} GB`
  }, [settings, resolution])

  // Load FFmpeg
  const handleLoadFFmpeg = async () => {
    setFfmpegLoading(true)
    try {
      await loadFFmpeg((progress) => {
        setStatusMessage(`Loading FFmpeg: ${progress}%`)
      })
      setExportMethod("ffmpeg")
    } catch (error) {
      console.error("Failed to load FFmpeg:", error)
      setError("Failed to load FFmpeg. Using browser export instead.")
    }
    setFfmpegLoading(false)
  }

  // Real video export using canvas capture
  const exportVideo = async () => {
    setExportStatus("preparing")
    setProgress(0)
    setError(null)
    const startTime = Date.now()
    abortControllerRef.current = new AbortController()

    try {
      const duration = (settings.trimEnd || settings.audioDuration) - settings.trimStart
      const totalFramesCount = Math.ceil(duration * settings.fps)
      setTotalFrames(totalFramesCount)

      // Setup audio for analysis
      const audioElement = new Audio(settings.audioUrl!)
      audioElement.crossOrigin = "anonymous"
      await new Promise<void>((resolve, reject) => {
        audioElement.addEventListener("canplaythrough", () => resolve(), { once: true })
        audioElement.addEventListener("error", reject, { once: true })
        audioElement.load()
      })

      const audioContext = new AudioContext()
      const source = audioContext.createMediaElementSource(audioElement)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = settings.visualizerSmoothing
      source.connect(analyser)
      source.connect(audioContext.destination)

      const frequencyData = new Uint8Array(analyser.frequencyBinCount)

      // Create render context
      const renderContext = createRenderContext(resolution.width, resolution.height, settings)

      // Create canvas stream for recording
      const stream = renderContext.canvas.captureStream(settings.fps)

      // Add audio track
      const audioDestination = audioContext.createMediaStreamDestination()
      source.connect(audioDestination)
      audioDestination.stream.getAudioTracks().forEach((track) => {
        stream.addTrack(track)
      })

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm"

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: resolution.width * resolution.height * settings.fps * 0.15,
      })

      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      setExportStatus("rendering")
      setStatusMessage("Rendering video frames...")

      mediaRecorder.start(100)
      audioElement.currentTime = settings.trimStart
      audioElement.play()

      // Render loop
      let frame = 0
      const frameInterval = 1000 / settings.fps

      const renderLoop = () => {
        if (abortControllerRef.current?.signal.aborted) {
          mediaRecorder.stop()
          audioElement.pause()
          return
        }

        if (frame >= totalFramesCount) {
          mediaRecorder.stop()
          audioElement.pause()
          return
        }

        // Get frequency data
        analyser.getByteFrequencyData(frequencyData)

        // Calculate current time
        const time = settings.trimStart + frame / settings.fps

        // Render frame
        renderFrame(renderContext, time, frequencyData)

        setCurrentFrame(frame)
        setProgress((frame / totalFramesCount) * 80)
        frame++

        setTimeout(renderLoop, frameInterval)
      }

      renderLoop()

      // Wait for recording to complete
      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => resolve()
      })

      await audioContext.close()

      setExportStatus("encoding")
      setStatusMessage("Encoding video...")
      setProgress(85)

      // Create final blob
      const blob = new Blob(chunks, { type: mimeType })
      setVideoBlob(blob)

      // Create preview URL
      const url = URL.createObjectURL(blob)
      setVideoUrl(url)

      // Upload to cloud storage
      setExportStatus("uploading")
      setStatusMessage("Uploading to cloud...")
      setProgress(90)

      const formData = new FormData()
      formData.append("video", blob, `${settings.title}.webm`)
      formData.append("title", settings.title)

      const uploadResponse = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      })

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json()
        setCloudVideoUrl(uploadData.url)
      }

      const elapsed = (Date.now() - startTime) / 1000
      setRenderTime(
        `${Math.floor(elapsed / 60)}:${Math.floor(elapsed % 60)
          .toString()
          .padStart(2, "0")}`,
      )
      setEstimatedSize(`${(blob.size / (1024 * 1024)).toFixed(1)} MB`)

      setProgress(100)
      setExportStatus("complete")
      setStatusMessage("Export complete!")
    } catch (error) {
      console.error("Export error:", error)
      setError(error instanceof Error ? error.message : "Export failed")
      setExportStatus("error")
    }
  }

  // Cancel export
  const cancelExport = () => {
    abortControllerRef.current?.abort()
    setExportStatus("idle")
    setProgress(0)
  }

  // Download video
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

  // Connect YouTube
  const connectYouTube = async () => {
    try {
      const response = await fetch("/api/auth/youtube")
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      // Open OAuth window
      window.location.href = data.authUrl
    } catch (error) {
      console.error("YouTube connect error:", error)
      setError("Failed to connect to YouTube")
    }
  }

  // Disconnect YouTube
  const disconnectYouTube = async () => {
    try {
      await fetch("/api/youtube/disconnect", { method: "POST" })
      setYoutubeConnected(false)
      setYoutubeUser(null)
    } catch (error) {
      console.error("YouTube disconnect error:", error)
    }
  }

  // Upload to YouTube
  const uploadToYouTube = async () => {
    if (!videoBlob) return

    setYoutubeUploading(true)
    setYoutubeUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("video", videoBlob, `${youtubeTitle}.webm`)
      formData.append("title", youtubeTitle)
      formData.append("description", youtubeDescription)
      formData.append("tags", youtubeTags)
      formData.append("privacy", youtubePrivacy)

      // Simulate progress (actual progress would need XMLHttpRequest)
      const progressInterval = setInterval(() => {
        setYoutubeUploadProgress((prev) => Math.min(prev + Math.random() * 10, 90))
      }, 500)

      const response = await fetch("/api/youtube/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const data = await response.json()
      setYoutubeUploadProgress(100)
      setYoutubeVideoUrl(data.videoUrl)
    } catch (error) {
      console.error("YouTube upload error:", error)
      setError(error instanceof Error ? error.message : "YouTube upload failed")
    }

    setYoutubeUploading(false)
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
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Download Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Generate Video
            </CardTitle>
            <CardDescription>Export your video for download or YouTube upload</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {exportStatus === "idle" && (
              <>
                {/* Export method selection */}
                {ffmpegSupported && (
                  <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Export Method</span>
                      <Badge variant={exportMethod === "ffmpeg" ? "default" : "secondary"}>
                        {exportMethod === "ffmpeg" ? "FFmpeg (MP4)" : "Browser (WebM)"}
                      </Badge>
                    </div>
                    {exportMethod !== "ffmpeg" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 bg-transparent"
                        onClick={handleLoadFFmpeg}
                        disabled={ffmpegLoading}
                      >
                        {ffmpegLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        Load FFmpeg for MP4 Export
                      </Button>
                    )}
                  </div>
                )}

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
                    <span className="font-medium">~{Math.ceil(duration / 5)} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Est. File Size
                    </span>
                    <span className="font-medium">{estimateFileSize()}</span>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Video will be rendered in your browser and uploaded to cloud storage.
                  </AlertDescription>
                </Alert>

                <Button className="w-full gap-2" size="lg" onClick={exportVideo}>
                  <Sparkles className="h-4 w-4" />
                  Generate Video
                </Button>
              </>
            )}

            {(exportStatus === "preparing" ||
              exportStatus === "rendering" ||
              exportStatus === "encoding" ||
              exportStatus === "uploading") && (
              <div className="space-y-4">
                <Progress value={progress} className="h-3" />
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {statusMessage}
                  </div>
                  {exportStatus === "rendering" && (
                    <span className="text-muted-foreground">
                      Frame {currentFrame} / {totalFrames}
                    </span>
                  )}
                </div>
                <Button variant="outline" className="w-full bg-transparent" onClick={cancelExport}>
                  Cancel
                </Button>
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

                {videoUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <video src={videoUrl} controls className="w-full h-full" />
                  </div>
                )}

                <Button className="w-full gap-2" size="lg" onClick={downloadVideo}>
                  <Download className="h-4 w-4" />
                  Download Video
                </Button>

                {cloudVideoUrl && (
                  <Button variant="outline" className="w-full gap-2 bg-transparent" asChild>
                    <a href={cloudVideoUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Open Cloud URL
                    </a>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  className="w-full gap-2"
                  onClick={() => {
                    setExportStatus("idle")
                    setVideoBlob(null)
                    setVideoUrl(null)
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Generate Again
                </Button>
              </div>
            )}

            {exportStatus === "error" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span>Export failed. Please try again.</span>
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
            {youtubeLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !youtubeConnected ? (
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>Connect your YouTube account to upload videos directly.</AlertDescription>
                </Alert>
                <Button className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white" onClick={connectYouTube}>
                  <Youtube className="h-4 w-4" />
                  Connect YouTube Channel
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Requires YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET environment variables.
                </p>
              </div>
            ) : (
              <>
                {/* Connected account info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  {youtubeUser?.picture && (
                    <img
                      src={youtubeUser.picture || "/placeholder.svg"}
                      alt={youtubeUser.name}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{youtubeUser?.channelTitle || youtubeUser?.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{youtubeUser?.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={disconnectYouTube}>
                    Disconnect
                  </Button>
                </div>

                {youtubeVideoUrl ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-green-500">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Upload complete!</span>
                    </div>
                    <Button className="w-full gap-2" asChild>
                      <a href={youtubeVideoUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        View on YouTube
                      </a>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="yt-title">Title</Label>
                        <Input
                          id="yt-title"
                          value={youtubeTitle}
                          onChange={(e) => setYoutubeTitle(e.target.value)}
                          placeholder="Video title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="yt-description">Description</Label>
                        <Textarea
                          id="yt-description"
                          value={youtubeDescription}
                          onChange={(e) => setYoutubeDescription(e.target.value)}
                          placeholder="Video description"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="yt-tags">Tags (comma separated)</Label>
                        <Input
                          id="yt-tags"
                          value={youtubeTags}
                          onChange={(e) => setYoutubeTags(e.target.value)}
                          placeholder="music, visualization, audio"
                        />
                      </div>
                      <div>
                        <Label htmlFor="yt-privacy">Privacy</Label>
                        <Select
                          value={youtubePrivacy}
                          onValueChange={(v: typeof youtubePrivacy) => setYoutubePrivacy(v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="unlisted">Unlisted</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {youtubeUploading && (
                      <div className="space-y-2">
                        <Progress value={youtubeUploadProgress} className="h-2" />
                        <p className="text-sm text-muted-foreground text-center">
                          Uploading to YouTube... {Math.round(youtubeUploadProgress)}%
                        </p>
                      </div>
                    )}

                    <Button
                      className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white"
                      onClick={uploadToYouTube}
                      disabled={!videoBlob || youtubeUploading || exportStatus !== "complete"}
                    >
                      {youtubeUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {!videoBlob ? "Generate video first" : youtubeUploading ? "Uploading..." : "Upload to YouTube"}
                    </Button>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
