"use client"

import type React from "react"

import { useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { BarChart3, Activity, Circle, Sparkles, ImageIcon, Video, Palette, Upload } from "lucide-react"
import type { ProjectSettings, VisualizerStyle, BackgroundType } from "@/app/create/page"

interface VideoEditorProps {
  settings: ProjectSettings
  updateSettings: (updates: Partial<ProjectSettings>) => void
}

const visualizerStyles: { id: VisualizerStyle; icon: typeof BarChart3; label: string }[] = [
  { id: "bars", icon: BarChart3, label: "Bars" },
  { id: "wave", icon: Activity, label: "Wave" },
  { id: "circular", icon: Circle, label: "Circular" },
  { id: "particles", icon: Sparkles, label: "Particles" },
]

const presetBackgrounds = [
  { type: "gradient" as BackgroundType, colors: ["#1a1625", "#2d1f47"], label: "Purple Night" },
  { type: "gradient" as BackgroundType, colors: ["#0f172a", "#1e3a5f"], label: "Ocean Deep" },
  { type: "gradient" as BackgroundType, colors: ["#1a1a2e", "#16213e"], label: "Midnight" },
  { type: "gradient" as BackgroundType, colors: ["#2d1b30", "#1a1625"], label: "Berry" },
  { type: "solid" as BackgroundType, colors: ["#000000", "#000000"], label: "Pure Black" },
  { type: "solid" as BackgroundType, colors: ["#1a1625", "#1a1625"], label: "Dark Plum" },
]

const aspectRatios = [
  { id: "16:9" as const, label: "YouTube (16:9)" },
  { id: "9:16" as const, label: "TikTok/Reels (9:16)" },
  { id: "1:1" as const, label: "Instagram (1:1)" },
]

export function VideoEditor({ settings, updateSettings }: VideoEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      updateSettings({ backgroundType: "image", backgroundImage: url })
    }
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file)
      updateSettings({ backgroundType: "video", backgroundVideo: url })
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      updateSettings({ logoUrl: url, showLogo: true })
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Project Title</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={settings.title}
            onChange={(e) => updateSettings({ title: e.target.value })}
            placeholder="Enter video title"
          />
        </CardContent>
      </Card>

      {/* Visualizer Style */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Visualizer Style</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {visualizerStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => updateSettings({ visualizerStyle: style.id })}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                  settings.visualizerStyle === style.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <style.icon className="h-5 w-5" />
                <span className="text-xs">{style.label}</span>
              </button>
            ))}
          </div>

          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Visualizer Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={settings.visualizerColor}
                onChange={(e) => updateSettings({ visualizerColor: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={settings.visualizerColor}
                onChange={(e) => updateSettings({ visualizerColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Background */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Background</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="presets" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="presets" className="gap-2">
                <Palette className="h-4 w-4" />
                Presets
              </TabsTrigger>
              <TabsTrigger value="image" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                Image
              </TabsTrigger>
              <TabsTrigger value="video" className="gap-2">
                <Video className="h-4 w-4" />
                Video
              </TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="mt-4">
              <div className="grid grid-cols-3 gap-2">
                {presetBackgrounds.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      updateSettings({
                        backgroundType: preset.type,
                        backgroundColor: preset.colors[0],
                        backgroundGradient: [preset.colors[0], preset.colors[1]],
                      })
                    }
                    className={`aspect-video rounded-lg border-2 transition-colors ${
                      settings.backgroundColor === preset.colors[0]
                        ? "border-primary"
                        : "border-transparent hover:border-primary/50"
                    }`}
                    style={{
                      background:
                        preset.type === "gradient"
                          ? `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})`
                          : preset.colors[0],
                    }}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="image" className="mt-4">
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <Button
                variant="outline"
                className="w-full gap-2 bg-transparent"
                onClick={() => imageInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload Background Image
              </Button>
              {settings.backgroundImage && (
                <div className="mt-3 aspect-video rounded-lg overflow-hidden border">
                  <img
                    src={settings.backgroundImage || "/placeholder.svg"}
                    alt="Background"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="video" className="mt-4">
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
              <Button
                variant="outline"
                className="w-full gap-2 bg-transparent"
                onClick={() => videoInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload Background Video
              </Button>
              {settings.backgroundVideo && (
                <div className="mt-3 aspect-video rounded-lg overflow-hidden border">
                  <video src={settings.backgroundVideo} className="w-full h-full object-cover" muted loop autoPlay />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Aspect Ratio */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Aspect Ratio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {aspectRatios.map((ratio) => (
              <button
                key={ratio.id}
                onClick={() => updateSettings({ aspectRatio: ratio.id })}
                className={`p-3 rounded-lg border transition-colors text-sm ${
                  settings.aspectRatio === ratio.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            Logo Overlay
            <Switch checked={settings.showLogo} onCheckedChange={(checked) => updateSettings({ showLogo: checked })} />
          </CardTitle>
        </CardHeader>
        {settings.showLogo && (
          <CardContent>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <Button
              variant="outline"
              className="w-full gap-2 bg-transparent"
              onClick={() => logoInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Upload Logo
            </Button>
            {settings.logoUrl && (
              <div className="mt-3 flex justify-center">
                <img src={settings.logoUrl || "/placeholder.svg"} alt="Logo" className="h-12 object-contain" />
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
