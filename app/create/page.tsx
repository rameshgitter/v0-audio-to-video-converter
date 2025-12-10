"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { AudioUploader } from "@/components/audio-uploader"
import { VideoEditor } from "@/components/video-editor"
import { VideoPreview } from "@/components/video-preview"
import { ExportPanel } from "@/components/export-panel"

export type VisualizerStyle =
  | "bars"
  | "wave"
  | "circular"
  | "particles"
  | "spectrum"
  | "blob"
  | "radialBars"
  | "oscilloscope"
export type BackgroundType = "solid" | "gradient" | "image" | "video" | "animated"

export interface TextOverlay {
  id: string
  text: string
  fontFamily: string
  fontSize: number
  color: string
  position: { x: number; y: number }
  animation: "none" | "fade" | "slide" | "bounce" | "typewriter"
  startTime: number
  endTime: number
}

export interface AudioEffect {
  bassBoost: number
  trebleBoost: number
  reverb: number
  speed: number
}

export interface ProjectSettings {
  audioFile: File | null
  audioUrl: string | null
  audioDuration: number
  title: string
  visualizerStyle: VisualizerStyle
  visualizerColor: string
  visualizerSecondaryColor: string
  visualizerSensitivity: number
  visualizerSmoothing: number
  visualizerMirror: boolean
  visualizerGlow: boolean
  backgroundType: BackgroundType
  backgroundColor: string
  backgroundGradient: [string, string]
  backgroundImage: string | null
  backgroundVideo: string | null
  backgroundBlur: number
  backgroundDim: number
  animatedBackground: string
  showLogo: boolean
  logoUrl: string | null
  logoPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
  logoSize: number
  logoOpacity: number
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3" | "21:9"
  quality: "720p" | "1080p" | "1440p" | "4k"
  fps: 30 | 60
  textOverlays: TextOverlay[]
  audioEffects: AudioEffect
  trimStart: number
  trimEnd: number
  fadeInDuration: number
  fadeOutDuration: number
  progress: { enabled: boolean; style: "bar" | "circle" | "dots"; color: string; position: "top" | "bottom" }
  watermark: { enabled: boolean; text: string; opacity: number }
}

const defaultSettings: ProjectSettings = {
  audioFile: null,
  audioUrl: null,
  audioDuration: 0,
  title: "Untitled Project",
  visualizerStyle: "bars",
  visualizerColor: "#a855f7",
  visualizerSecondaryColor: "#ec4899",
  visualizerSensitivity: 1,
  visualizerSmoothing: 0.8,
  visualizerMirror: false,
  visualizerGlow: true,
  backgroundType: "gradient",
  backgroundColor: "#1a1625",
  backgroundGradient: ["#1a1625", "#2d1f47"],
  backgroundImage: null,
  backgroundVideo: null,
  backgroundBlur: 0,
  backgroundDim: 0,
  animatedBackground: "particles",
  showLogo: false,
  logoUrl: null,
  logoPosition: "bottom-right",
  logoSize: 80,
  logoOpacity: 100,
  aspectRatio: "16:9",
  quality: "1080p",
  fps: 30,
  textOverlays: [],
  audioEffects: {
    bassBoost: 0,
    trebleBoost: 0,
    reverb: 0,
    speed: 1,
  },
  trimStart: 0,
  trimEnd: 0,
  fadeInDuration: 0,
  fadeOutDuration: 0,
  progress: { enabled: false, style: "bar", color: "#a855f7", position: "bottom" },
  watermark: { enabled: false, text: "Made with AudioVid Pro", opacity: 50 },
}

export default function CreatePage() {
  const [settings, setSettings] = useState<ProjectSettings>(defaultSettings)
  const [step, setStep] = useState<"upload" | "edit" | "export">("upload")

  const updateSettings = (updates: Partial<ProjectSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[
              { id: "upload", label: "Upload Audio" },
              { id: "edit", label: "Customize" },
              { id: "export", label: "Export" },
            ].map((s, i) => (
              <div key={s.id} className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (s.id === "upload") setStep("upload")
                    else if (s.id === "edit" && settings.audioFile) setStep("edit")
                    else if (s.id === "export" && settings.audioFile) setStep("export")
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    step === s.id
                      ? "bg-primary text-primary-foreground"
                      : settings.audioFile || s.id === "upload"
                        ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                  disabled={s.id !== "upload" && !settings.audioFile}
                >
                  <span className="font-medium text-sm">
                    {i + 1}. {s.label}
                  </span>
                </button>
                {i < 2 && <div className="w-12 h-px bg-border" />}
              </div>
            ))}
          </div>
        </div>

        {step === "upload" && (
          <AudioUploader settings={settings} updateSettings={updateSettings} onNext={() => setStep("edit")} />
        )}

        {step === "edit" && (
          <div className="grid lg:grid-cols-[1fr,1.2fr] gap-6">
            <VideoEditor settings={settings} updateSettings={updateSettings} />
            <VideoPreview settings={settings} updateSettings={updateSettings} onExport={() => setStep("export")} />
          </div>
        )}

        {step === "export" && (
          <ExportPanel settings={settings} updateSettings={updateSettings} onBack={() => setStep("edit")} />
        )}
      </main>
    </div>
  )
}
