import { Upload, Palette, Download } from "lucide-react"

const steps = [
  {
    step: "01",
    icon: Upload,
    title: "Upload Your Audio",
    description:
      "Drag and drop your audio file or paste a link. We support all major formats including MP3, WAV, and FLAC.",
  },
  {
    step: "02",
    icon: Palette,
    title: "Customize Your Video",
    description: "Choose a visualizer style, add background images or videos, customize colors, and add your branding.",
  },
  {
    step: "03",
    icon: Download,
    title: "Export & Publish",
    description:
      "Download your video in any format or upload directly to YouTube with auto-generated titles and descriptions.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl text-balance">Create videos in minutes</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            No video editing experience required. Our intuitive workflow makes it easy to turn any audio into engaging
            video content.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((item, index) => (
            <div key={index} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-full h-px bg-gradient-to-r from-primary/50 to-transparent" />
              )}

              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-card border border-border">
                    <item.icon className="h-10 w-10 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {item.step}
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground max-w-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
