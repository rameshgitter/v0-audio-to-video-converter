"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  BarChart3,
  Activity,
  Circle,
  Sparkles,
  ImageIcon,
  Video,
  Palette,
  Upload,
  Type,
  Music2,
  Wand2,
  ChevronDown,
  Plus,
  Trash2,
  Waves,
  Radio,
  Disc3,
  AudioLines,
  Zap,
  Settings2,
} from "lucide-react"
import type { ProjectSettings, VisualizerStyle, BackgroundType, TextOverlay } from "@/app/create/page"

interface VideoEditorProps {
  settings: ProjectSettings
  updateSettings: (updates: Partial<ProjectSettings>) => void
}

const visualizerStyles: { id: VisualizerStyle; icon: typeof BarChart3; label: string }[] = [
  { id: "bars", icon: BarChart3, label: "Bars" },
  { id: "wave", icon: Activity, label: "Wave" },
  { id: "circular", icon: Circle, label: "Circular" },
  { id: "particles", icon: Sparkles, label: "Particles" },
  { id: "spectrum", icon: Waves, label: "Spectrum" },
  { id: "blob", icon: Radio, label: "Blob" },
  { id: "radialBars", icon: Disc3, label: "Radial" },
  { id: "oscilloscope", icon: AudioLines, label: "Scope" },
]

const presetBackgrounds = [
  { type: "gradient" as BackgroundType, colors: ["#1a1625", "#2d1f47"], label: "Purple Night" },
  { type: "gradient" as BackgroundType, colors: ["#0f172a", "#1e3a5f"], label: "Ocean Deep" },
  { type: "gradient" as BackgroundType, colors: ["#1a1a2e", "#16213e"], label: "Midnight" },
  { type: "gradient" as BackgroundType, colors: ["#2d1b30", "#1a1625"], label: "Berry" },
  { type: "gradient" as BackgroundType, colors: ["#0d1117", "#161b22"], label: "GitHub Dark" },
  { type: "gradient" as BackgroundType, colors: ["#1e1e2e", "#313244"], label: "Catppuccin" },
  { type: "gradient" as BackgroundType, colors: ["#0a0a0a", "#171717"], label: "Carbon" },
  { type: "gradient" as BackgroundType, colors: ["#18181b", "#27272a"], label: "Zinc" },
  { type: "solid" as BackgroundType, colors: ["#000000", "#000000"], label: "Pure Black" },
]

const animatedBackgrounds = [
  { id: "particles", label: "Floating Particles", icon: Sparkles },
  { id: "matrix", label: "Matrix Rain", icon: Type },
  { id: "stars", label: "Starfield", icon: Zap },
  { id: "gradient", label: "Gradient Flow", icon: Palette },
  { id: "smoke", label: "Smoke Effect", icon: Waves },
]

const aspectRatios = [
  { id: "16:9" as const, label: "YouTube (16:9)", icon: "📺" },
  { id: "9:16" as const, label: "TikTok/Reels (9:16)", icon: "📱" },
  { id: "1:1" as const, label: "Instagram (1:1)", icon: "📷" },
  { id: "4:3" as const, label: "Classic (4:3)", icon: "🖥️" },
  { id: "21:9" as const, label: "Ultrawide (21:9)", icon: "🎬" },
]

const fontFamilies = [
  "Inter",
  "Roboto",
  "Montserrat",
  "Open Sans",
  "Playfair Display",
  "Bebas Neue",
  "Oswald",
  "Poppins",
]

const textAnimations = [
  { id: "none", label: "None" },
  { id: "fade", label: "Fade In/Out" },
  { id: "slide", label: "Slide In" },
  { id: "bounce", label: "Bounce" },
  { id: "typewriter", label: "Typewriter" },
]

export function VideoEditor({ settings, updateSettings }: VideoEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [openSections, setOpenSections] = useState<string[]>(["visualizer", "background"])

  const toggleSection = (section: string) => {
    setOpenSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

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

  const addTextOverlay = () => {
    const newOverlay: TextOverlay = {
      id: crypto.randomUUID(),
      text: "Your Text Here",
      fontFamily: "Inter",
      fontSize: 48,
      color: "#ffffff",
      position: { x: 50, y: 50 },
      animation: "none",
      startTime: 0,
      endTime: settings.audioDuration || 60,
    }
    updateSettings({ textOverlays: [...settings.textOverlays, newOverlay] })
  }

  const updateTextOverlay = (id: string, updates: Partial<TextOverlay>) => {
    updateSettings({
      textOverlays: settings.textOverlays.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })
  }

  const removeTextOverlay = (id: string) => {
    updateSettings({ textOverlays: settings.textOverlays.filter((t) => t.id !== id) })
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-4 pr-4">
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

        {/* Visualizer Settings */}
        <Collapsible open={openSections.includes("visualizer")} onOpenChange={() => toggleSection("visualizer")}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-secondary/50 transition-colors rounded-t-lg">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Visualizer
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${openSections.includes("visualizer") ? "rotate-180" : ""}`}
                  />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {/* Style selection */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Style</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {visualizerStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => updateSettings({ visualizerStyle: style.id })}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                          settings.visualizerStyle === style.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <style.icon className="h-4 w-4" />
                        <span className="text-[10px]">{style.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.visualizerColor}
                        onChange={(e) => updateSettings({ visualizerColor: e.target.value })}
                        className="w-10 h-9 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.visualizerColor}
                        onChange={(e) => updateSettings({ visualizerColor: e.target.value })}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.visualizerSecondaryColor}
                        onChange={(e) => updateSettings({ visualizerSecondaryColor: e.target.value })}
                        className="w-10 h-9 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.visualizerSecondaryColor}
                        onChange={(e) => updateSettings({ visualizerSecondaryColor: e.target.value })}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Sensitivity */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Sensitivity: {settings.visualizerSensitivity.toFixed(1)}x
                  </Label>
                  <Slider
                    value={[settings.visualizerSensitivity]}
                    onValueChange={([v]) => updateSettings({ visualizerSensitivity: v })}
                    min={0.5}
                    max={2}
                    step={0.1}
                  />
                </div>

                {/* Smoothing */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Smoothing: {Math.round(settings.visualizerSmoothing * 100)}%
                  </Label>
                  <Slider
                    value={[settings.visualizerSmoothing]}
                    onValueChange={([v]) => updateSettings({ visualizerSmoothing: v })}
                    min={0}
                    max={0.99}
                    step={0.01}
                  />
                </div>

                {/* Toggles */}
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.visualizerMirror}
                      onCheckedChange={(checked) => updateSettings({ visualizerMirror: checked })}
                    />
                    <Label className="text-sm">Mirror</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.visualizerGlow}
                      onCheckedChange={(checked) => updateSettings({ visualizerGlow: checked })}
                    />
                    <Label className="text-sm">Glow Effect</Label>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Background */}
        <Collapsible open={openSections.includes("background")} onOpenChange={() => toggleSection("background")}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-secondary/50 transition-colors rounded-t-lg">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Background
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${openSections.includes("background") ? "rotate-180" : ""}`}
                  />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <Tabs defaultValue="presets" className="w-full">
                  <TabsList className="w-full grid grid-cols-4">
                    <TabsTrigger value="presets" className="text-xs gap-1">
                      <Palette className="h-3 w-3" />
                      Presets
                    </TabsTrigger>
                    <TabsTrigger value="animated" className="text-xs gap-1">
                      <Sparkles className="h-3 w-3" />
                      Animated
                    </TabsTrigger>
                    <TabsTrigger value="image" className="text-xs gap-1">
                      <ImageIcon className="h-3 w-3" />
                      Image
                    </TabsTrigger>
                    <TabsTrigger value="video" className="text-xs gap-1">
                      <Video className="h-3 w-3" />
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
                            settings.backgroundColor === preset.colors[0] && settings.backgroundType !== "animated"
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

                  <TabsContent value="animated" className="mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      {animatedBackgrounds.map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => updateSettings({ backgroundType: "animated", animatedBackground: bg.id })}
                          className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                            settings.backgroundType === "animated" && settings.animatedBackground === bg.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <bg.icon className="h-4 w-4" />
                          <span className="text-sm">{bg.label}</span>
                        </button>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="image" className="mt-4">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Button
                      variant="outline"
                      className="w-full gap-2 bg-transparent"
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Upload Background Image
                    </Button>
                    {settings.backgroundImage && (
                      <div className="mt-3 aspect-video rounded-lg overflow-hidden border relative">
                        <img
                          src={settings.backgroundImage || "/placeholder.svg"}
                          alt="Background"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => updateSettings({ backgroundImage: null, backgroundType: "gradient" })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="video" className="mt-4">
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />
                    <Button
                      variant="outline"
                      className="w-full gap-2 bg-transparent"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Upload Background Video
                    </Button>
                    {settings.backgroundVideo && (
                      <div className="mt-3 aspect-video rounded-lg overflow-hidden border relative">
                        <video
                          src={settings.backgroundVideo}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          autoPlay
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => updateSettings({ backgroundVideo: null, backgroundType: "gradient" })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Background adjustments */}
                {(settings.backgroundType === "image" || settings.backgroundType === "video") && (
                  <div className="space-y-3 pt-2 border-t">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">
                        Blur: {settings.backgroundBlur}px
                      </Label>
                      <Slider
                        value={[settings.backgroundBlur]}
                        onValueChange={([v]) => updateSettings({ backgroundBlur: v })}
                        min={0}
                        max={20}
                        step={1}
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Dim: {settings.backgroundDim}%</Label>
                      <Slider
                        value={[settings.backgroundDim]}
                        onValueChange={([v]) => updateSettings({ backgroundDim: v })}
                        min={0}
                        max={80}
                        step={5}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Text Overlays */}
        <Collapsible open={openSections.includes("text")} onOpenChange={() => toggleSection("text")}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-secondary/50 transition-colors rounded-t-lg">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    Text Overlays
                    {settings.textOverlays.length > 0 && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {settings.textOverlays.length}
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${openSections.includes("text") ? "rotate-180" : ""}`}
                  />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={addTextOverlay}>
                  <Plus className="h-4 w-4" />
                  Add Text Layer
                </Button>

                {settings.textOverlays.map((overlay, idx) => (
                  <div key={overlay.id} className="space-y-3 p-3 border rounded-lg bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Text Layer {idx + 1}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => removeTextOverlay(overlay.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      value={overlay.text}
                      onChange={(e) => updateTextOverlay(overlay.id, { text: e.target.value })}
                      placeholder="Enter text"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Font</Label>
                        <select
                          className="w-full h-9 px-2 rounded-md border bg-background text-sm"
                          value={overlay.fontFamily}
                          onChange={(e) => updateTextOverlay(overlay.id, { fontFamily: e.target.value })}
                        >
                          {fontFamilies.map((font) => (
                            <option key={font} value={font}>
                              {font}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Size</Label>
                        <Input
                          type="number"
                          value={overlay.fontSize}
                          onChange={(e) => updateTextOverlay(overlay.id, { fontSize: Number(e.target.value) })}
                          min={12}
                          max={200}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Color</Label>
                        <div className="flex gap-1">
                          <Input
                            type="color"
                            value={overlay.color}
                            onChange={(e) => updateTextOverlay(overlay.id, { color: e.target.value })}
                            className="w-10 h-9 p-1 cursor-pointer"
                          />
                          <Input
                            value={overlay.color}
                            onChange={(e) => updateTextOverlay(overlay.id, { color: e.target.value })}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Animation</Label>
                        <select
                          className="w-full h-9 px-2 rounded-md border bg-background text-sm"
                          value={overlay.animation}
                          onChange={(e) =>
                            updateTextOverlay(overlay.id, { animation: e.target.value as TextOverlay["animation"] })
                          }
                        >
                          {textAnimations.map((anim) => (
                            <option key={anim.id} value={anim.id}>
                              {anim.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Audio Effects */}
        <Collapsible open={openSections.includes("audio")} onOpenChange={() => toggleSection("audio")}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-secondary/50 transition-colors rounded-t-lg">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Music2 className="h-5 w-5" />
                    Audio & Trim
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${openSections.includes("audio") ? "rotate-180" : ""}`}
                  />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {/* Trim */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Trim Start (sec)</Label>
                    <Input
                      type="number"
                      value={settings.trimStart}
                      onChange={(e) => updateSettings({ trimStart: Number(e.target.value) })}
                      min={0}
                      max={settings.audioDuration - 1}
                      step={0.1}
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Trim End (sec)</Label>
                    <Input
                      type="number"
                      value={settings.trimEnd || settings.audioDuration}
                      onChange={(e) => updateSettings({ trimEnd: Number(e.target.value) })}
                      min={settings.trimStart + 1}
                      max={settings.audioDuration}
                      step={0.1}
                    />
                  </div>
                </div>

                {/* Fade */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      Fade In: {settings.fadeInDuration}s
                    </Label>
                    <Slider
                      value={[settings.fadeInDuration]}
                      onValueChange={([v]) => updateSettings({ fadeInDuration: v })}
                      min={0}
                      max={5}
                      step={0.5}
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      Fade Out: {settings.fadeOutDuration}s
                    </Label>
                    <Slider
                      value={[settings.fadeOutDuration]}
                      onValueChange={([v]) => updateSettings({ fadeOutDuration: v })}
                      min={0}
                      max={5}
                      step={0.5}
                    />
                  </div>
                </div>

                {/* Audio Effects */}
                <div className="space-y-3 pt-2 border-t">
                  <Label className="text-sm font-medium">Audio Effects</Label>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Bass Boost: {settings.audioEffects.bassBoost > 0 ? "+" : ""}
                      {settings.audioEffects.bassBoost}dB
                    </Label>
                    <Slider
                      value={[settings.audioEffects.bassBoost]}
                      onValueChange={([v]) =>
                        updateSettings({ audioEffects: { ...settings.audioEffects, bassBoost: v } })
                      }
                      min={-12}
                      max={12}
                      step={1}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Treble: {settings.audioEffects.trebleBoost > 0 ? "+" : ""}
                      {settings.audioEffects.trebleBoost}dB
                    </Label>
                    <Slider
                      value={[settings.audioEffects.trebleBoost]}
                      onValueChange={([v]) =>
                        updateSettings({ audioEffects: { ...settings.audioEffects, trebleBoost: v } })
                      }
                      min={-12}
                      max={12}
                      step={1}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Playback Speed: {settings.audioEffects.speed}x
                    </Label>
                    <Slider
                      value={[settings.audioEffects.speed]}
                      onValueChange={([v]) => updateSettings({ audioEffects: { ...settings.audioEffects, speed: v } })}
                      min={0.5}
                      max={2}
                      step={0.1}
                    />
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Output Settings */}
        <Collapsible open={openSections.includes("output")} onOpenChange={() => toggleSection("output")}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-secondary/50 transition-colors rounded-t-lg">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    Output Settings
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${openSections.includes("output") ? "rotate-180" : ""}`}
                  />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {/* Aspect Ratio */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Aspect Ratio</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {aspectRatios.slice(0, 3).map((ratio) => (
                      <button
                        key={ratio.id}
                        onClick={() => updateSettings({ aspectRatio: ratio.id })}
                        className={`p-2 rounded-lg border transition-colors text-xs ${
                          settings.aspectRatio === ratio.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="mr-1">{ratio.icon}</span>
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {aspectRatios.slice(3).map((ratio) => (
                      <button
                        key={ratio.id}
                        onClick={() => updateSettings({ aspectRatio: ratio.id })}
                        className={`p-2 rounded-lg border transition-colors text-xs ${
                          settings.aspectRatio === ratio.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="mr-1">{ratio.icon}</span>
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Quality</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["720p", "1080p", "1440p", "4k"] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => updateSettings({ quality: q })}
                        className={`p-2 rounded-lg border transition-colors text-xs ${
                          settings.quality === q
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FPS */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Frame Rate</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {([30, 60] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => updateSettings({ fps: f })}
                        className={`p-2 rounded-lg border transition-colors text-sm ${
                          settings.fps === f ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                        }`}
                      >
                        {f} FPS
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Progress Bar</Label>
                    <Switch
                      checked={settings.progress.enabled}
                      onCheckedChange={(checked) =>
                        updateSettings({ progress: { ...settings.progress, enabled: checked } })
                      }
                    />
                  </div>
                  {settings.progress.enabled && (
                    <div className="grid grid-cols-3 gap-2">
                      {(["bar", "circle", "dots"] as const).map((style) => (
                        <button
                          key={style}
                          onClick={() => updateSettings({ progress: { ...settings.progress, style } })}
                          className={`p-2 rounded-lg border transition-colors text-xs capitalize ${
                            settings.progress.style === style
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Watermark */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Watermark</Label>
                    <Switch
                      checked={settings.watermark.enabled}
                      onCheckedChange={(checked) =>
                        updateSettings({ watermark: { ...settings.watermark, enabled: checked } })
                      }
                    />
                  </div>
                  {settings.watermark.enabled && (
                    <>
                      <Input
                        value={settings.watermark.text}
                        onChange={(e) => updateSettings({ watermark: { ...settings.watermark, text: e.target.value } })}
                        placeholder="Watermark text"
                      />
                      <div>
                        <Label className="text-xs text-muted-foreground">Opacity: {settings.watermark.opacity}%</Label>
                        <Slider
                          value={[settings.watermark.opacity]}
                          onValueChange={([v]) => updateSettings({ watermark: { ...settings.watermark, opacity: v } })}
                          min={10}
                          max={100}
                          step={5}
                        />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Logo */}
        <Collapsible open={openSections.includes("logo")} onOpenChange={() => toggleSection("logo")}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-secondary/50 transition-colors rounded-t-lg">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Logo Overlay
                  </span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.showLogo}
                      onCheckedChange={(checked) => updateSettings({ showLogo: checked })}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${openSections.includes("logo") ? "rotate-180" : ""}`}
                    />
                  </div>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {settings.showLogo && (
                <CardContent className="space-y-4">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    variant="outline"
                    className="w-full gap-2 bg-transparent"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Logo
                  </Button>
                  {settings.logoUrl && (
                    <>
                      <div className="flex justify-center">
                        <img src={settings.logoUrl || "/placeholder.svg"} alt="Logo" className="h-12 object-contain" />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">Position</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["top-left", "top-right", "center", "bottom-left", "bottom-right"] as const).map((pos) => (
                            <button
                              key={pos}
                              onClick={() => updateSettings({ logoPosition: pos })}
                              className={`p-2 rounded-lg border transition-colors text-xs capitalize ${
                                settings.logoPosition === pos
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              {pos.replace("-", " ")}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">Size: {settings.logoSize}px</Label>
                        <Slider
                          value={[settings.logoSize]}
                          onValueChange={([v]) => updateSettings({ logoSize: v })}
                          min={30}
                          max={200}
                          step={5}
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">
                          Opacity: {settings.logoOpacity}%
                        </Label>
                        <Slider
                          value={[settings.logoOpacity]}
                          onValueChange={([v]) => updateSettings({ logoOpacity: v })}
                          min={10}
                          max={100}
                          step={5}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              )}
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </ScrollArea>
  )
}
