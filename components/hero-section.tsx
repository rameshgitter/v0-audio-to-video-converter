"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Sparkles, Upload } from "lucide-react"
import { AudioVisualizer } from "./audio-visualizer"

export function HeroSection() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">New: AI-powered video generation</span>
            <ArrowRight className="h-3 w-3 text-primary" />
          </div>

          {/* Headline */}
          <h1 className="max-w-4xl text-balance text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Transform your audio into{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              stunning videos
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
            Upload any audio file, add beautiful visuals, waveforms, or video backgrounds, and publish directly to
            YouTube. The fastest way to turn your music into content.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link href="/create">
              <Button
                size="lg"
                className="h-12 px-8 text-base bg-primary hover:bg-primary/90 gap-2"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <Upload className={`h-5 w-5 transition-transform ${isHovered ? "scale-110" : ""}`} />
                Start Creating — Free
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base gap-2 bg-transparent">
              <Play className="h-4 w-4" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-center">
            <div>
              <div className="text-3xl font-bold">50K+</div>
              <div className="text-sm text-muted-foreground">Videos Created</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <div className="text-3xl font-bold">10M+</div>
              <div className="text-sm text-muted-foreground">YouTube Views</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <div className="text-3xl font-bold">4.9/5</div>
              <div className="text-sm text-muted-foreground">Creator Rating</div>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-20 w-full max-w-4xl">
            <div className="relative rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-primary/10">
              <div className="aspect-video rounded-lg bg-secondary overflow-hidden">
                <AudioVisualizer />
              </div>
              <div className="mt-4 flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20" />
                  <div>
                    <div className="text-sm font-medium">Summer Vibes Mix</div>
                    <div className="text-xs text-muted-foreground">3:45 duration</div>
                  </div>
                </div>
                <Button size="sm" variant="secondary">
                  Export to YouTube
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
