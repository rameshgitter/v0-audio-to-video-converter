"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Download, Youtube, ArrowLeft, CheckCircle2, Loader2, AlertCircle, ExternalLink } from "lucide-react"
import type { ProjectSettings } from "@/app/create/page"

interface ExportPanelProps {
  settings: ProjectSettings
  updateSettings: (updates: Partial<ProjectSettings>) => void
  onBack: () => void
}

type ExportStatus = "idle" | "generating" | "complete" | "error"
type YouTubeStatus = "disconnected" | "connected" | "uploading" | "complete"

export function ExportPanel({ settings, onBack }: ExportPanelProps) {
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [youtubeStatus, setYoutubeStatus] = useState<YouTubeStatus>("disconnected")
  const [youtubeTitle, setYoutubeTitle] = useState(settings.title)
  const [youtubeDescription, setYoutubeDescription] = useState("")

  const simulateExport = () => {
    setExportStatus("generating")
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setExportStatus("complete")
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 500)
  }

  const connectYouTube = () => {
    // Simulate OAuth flow
    setYoutubeStatus("connected")
  }

  const uploadToYouTube = () => {
    setYoutubeStatus("uploading")
    setTimeout(() => {
      setYoutubeStatus("complete")
    }, 3000)
  }

  const getQualityLabel = () => {
    switch (settings.aspectRatio) {
      case "9:16":
        return "1080x1920 (Full HD Vertical)"
      case "1:1":
        return "1080x1080 (HD Square)"
      default:
        return "1920x1080 (Full HD)"
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" className="mb-6 gap-2" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to Editor
      </Button>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Download Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Video
            </CardTitle>
            <CardDescription>Export your video as an MP4 file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Quality</span>
              <span>{getQualityLabel()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span>
                {Math.floor(settings.audioDuration / 60)}:
                {Math.floor(settings.audioDuration % 60)
                  .toString()
                  .padStart(2, "0")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Format</span>
              <span>MP4 (H.264)</span>
            </div>

            {exportStatus === "idle" && (
              <Button className="w-full gap-2" onClick={simulateExport}>
                <Download className="h-4 w-4" />
                Generate Video
              </Button>
            )}

            {exportStatus === "generating" && (
              <div className="space-y-3">
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating video... {Math.round(progress)}%
                </div>
              </div>
            )}

            {exportStatus === "complete" && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  Video generated successfully!
                </div>
                <Button className="w-full gap-2" variant="secondary">
                  <Download className="h-4 w-4" />
                  Download MP4
                </Button>
              </div>
            )}

            {exportStatus === "error" && (
              <div className="flex items-center justify-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                Error generating video. Please try again.
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

            {(youtubeStatus === "connected" || youtubeStatus === "uploading") && (
              <>
                <div className="flex items-center gap-2 text-sm text-green-500 mb-4">
                  <CheckCircle2 className="h-4 w-4" />
                  YouTube connected
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="yt-title">Video Title</Label>
                    <Input
                      id="yt-title"
                      value={youtubeTitle}
                      onChange={(e) => setYoutubeTitle(e.target.value)}
                      placeholder="Enter video title"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="yt-desc">Description</Label>
                    <Textarea
                      id="yt-desc"
                      value={youtubeDescription}
                      onChange={(e) => setYoutubeDescription(e.target.value)}
                      placeholder="Enter video description"
                      className="mt-1.5 min-h-24"
                    />
                  </div>

                  <Button
                    className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white"
                    onClick={uploadToYouTube}
                    disabled={youtubeStatus === "uploading" || exportStatus !== "complete"}
                  >
                    {youtubeStatus === "uploading" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Youtube className="h-4 w-4" />
                        Upload to YouTube
                      </>
                    )}
                  </Button>

                  {exportStatus !== "complete" && (
                    <p className="text-xs text-muted-foreground text-center">
                      Generate your video first before uploading
                    </p>
                  )}
                </div>
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

      {/* Tips */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Pro Tips for Better YouTube Performance</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Use a descriptive title with relevant keywords for better discoverability</li>
            <li>• Add timestamps in your description if your audio has multiple sections</li>
            <li>• Include links to your other social media and streaming platforms</li>
            <li>• Add relevant tags after uploading directly on YouTube</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
