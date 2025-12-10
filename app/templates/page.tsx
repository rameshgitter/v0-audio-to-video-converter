"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Play, ArrowRight, Sparkles, Music2, Mic2, Radio, Zap } from "lucide-react"
import Link from "next/link"

const templates = [
  {
    id: "lofi-beats",
    name: "Lo-Fi Beats",
    description: "Chill vibes with soft wave visualizer",
    category: "Music",
    visualizer: "wave",
    colors: ["#1a1625", "#2d1f47"],
    accent: "#a855f7",
    icon: Music2,
    popular: true,
  },
  {
    id: "podcast-pro",
    name: "Podcast Pro",
    description: "Clean bars visualizer for spoken content",
    category: "Podcast",
    visualizer: "bars",
    colors: ["#0f172a", "#1e3a5f"],
    accent: "#3b82f6",
    icon: Mic2,
  },
  {
    id: "edm-energy",
    name: "EDM Energy",
    description: "High energy circular visualizer",
    category: "Music",
    visualizer: "circular",
    colors: ["#0a0a0a", "#1a1a2e"],
    accent: "#f43f5e",
    icon: Zap,
    popular: true,
  },
  {
    id: "ambient-dreams",
    name: "Ambient Dreams",
    description: "Floating particles for ambient tracks",
    category: "Music",
    visualizer: "particles",
    colors: ["#0d1117", "#161b22"],
    accent: "#22c55e",
    icon: Sparkles,
  },
  {
    id: "radio-show",
    name: "Radio Show",
    description: "Retro spectrum analyzer",
    category: "Podcast",
    visualizer: "spectrum",
    colors: ["#18181b", "#27272a"],
    accent: "#eab308",
    icon: Radio,
  },
  {
    id: "minimal-wave",
    name: "Minimal Wave",
    description: "Clean oscilloscope style",
    category: "Music",
    visualizer: "oscilloscope",
    colors: ["#1e1e2e", "#313244"],
    accent: "#06b6d4",
    icon: Music2,
  },
]

const categories = ["All", "Music", "Podcast"]

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Video Templates</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with a professionally designed template and customize it to match your style
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "secondary"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Templates grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="group overflow-hidden hover:border-primary/50 transition-colors">
              {/* Preview */}
              <div
                className="aspect-video relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${template.colors[0]}, ${template.colors[1]})`,
                }}
              >
                {/* Simulated visualizer preview */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {template.visualizer === "bars" && (
                    <div className="flex items-end gap-1 h-16">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-2 rounded-full animate-pulse"
                          style={{
                            backgroundColor: template.accent,
                            height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}%`,
                            animationDelay: `${i * 50}ms`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {template.visualizer === "wave" && (
                    <svg className="w-3/4 h-16" viewBox="0 0 200 50">
                      <path
                        d={`M 0 25 ${Array.from({ length: 50 })
                          .map((_, i) => `L ${i * 4} ${25 + Math.sin(i * 0.3) * 15}`)
                          .join(" ")}`}
                        fill="none"
                        stroke={template.accent}
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                  {template.visualizer === "circular" && (
                    <div
                      className="w-20 h-20 rounded-full border-4 animate-pulse"
                      style={{ borderColor: template.accent }}
                    />
                  )}
                  {template.visualizer === "particles" && (
                    <div className="relative w-32 h-32">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 rounded-full animate-ping"
                          style={{
                            backgroundColor: template.accent,
                            left: `${50 + Math.cos(i * 0.5) * 40}%`,
                            top: `${50 + Math.sin(i * 0.5) * 40}%`,
                            animationDelay: `${i * 100}ms`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {template.visualizer === "spectrum" && (
                    <div className="flex items-end gap-0.5 h-16">
                      {Array.from({ length: 32 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 rounded-t"
                          style={{
                            background: `hsl(${(i / 32) * 120}, 100%, 50%)`,
                            height: `${20 + Math.sin(i * 0.3) * 30 + Math.random() * 30}%`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {template.visualizer === "oscilloscope" && (
                    <svg className="w-3/4 h-16" viewBox="0 0 200 50">
                      <path
                        d={`M 0 25 ${Array.from({ length: 100 })
                          .map((_, i) => `L ${i * 2} ${25 + Math.sin(i * 0.2) * 20}`)
                          .join(" ")}`}
                        fill="none"
                        stroke={template.accent}
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button size="sm" variant="secondary" className="gap-2">
                    <Play className="h-4 w-4" />
                    Preview
                  </Button>
                </div>

                {/* Popular badge */}
                {template.popular && <Badge className="absolute top-2 right-2 bg-primary">Popular</Badge>}
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <template.icon className="h-4 w-4" style={{ color: template.accent }} />
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Badge variant="secondary">{template.category}</Badge>
                  <Link href={`/create?template=${template.id}`}>
                    <Button size="sm" variant="ghost" className="gap-1">
                      Use Template
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No templates found matching your criteria.</div>
        )}
      </main>
    </div>
  )
}
