import { Card, CardContent } from "@/components/ui/card"
import { Music, ImageIcon, Video, Wand2, Youtube, Palette, Zap, Layers } from "lucide-react"

const features = [
  {
    icon: Music,
    title: "Any Audio Format",
    description: "Upload MP3, WAV, FLAC, OGG, and more. We handle the conversion automatically.",
  },
  {
    icon: Wand2,
    title: "AI Visualizers",
    description: "Generate dynamic audio-reactive visualizations that sync perfectly with your music.",
  },
  {
    icon: ImageIcon,
    title: "Custom Backgrounds",
    description: "Use your own images, album art, or choose from our library of premium backgrounds.",
  },
  {
    icon: Video,
    title: "Video Backgrounds",
    description: "Add looping video clips for cinematic music videos. Perfect for lo-fi and ambient tracks.",
  },
  {
    icon: Palette,
    title: "Brand Customization",
    description: "Add your logo, custom colors, and text overlays to match your brand identity.",
  },
  {
    icon: Layers,
    title: "Multiple Formats",
    description: "Export in 1080p, 4K, vertical for TikTok/Reels, or square for Instagram posts.",
  },
  {
    icon: Youtube,
    title: "Direct Upload",
    description: "Connect your YouTube channel and upload videos with one click. Title and description included.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Cloud rendering means your video is ready in minutes, not hours. No waiting around.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl text-balance">Everything you need to create</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional video creation tools designed specifically for musicians, podcasters, and content creators.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors group"
            >
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
