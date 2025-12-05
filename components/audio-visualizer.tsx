"use client"

import { useEffect, useState } from "react"

export function AudioVisualizer() {
  const [bars, setBars] = useState<number[]>([])

  useEffect(() => {
    // Generate random bars for visualization demo
    const generateBars = () => {
      const newBars = Array.from({ length: 64 }, () => Math.random() * 100)
      setBars(newBars)
    }

    generateBars()
    const interval = setInterval(generateBars, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative h-full w-full flex items-center justify-center bg-gradient-to-br from-secondary to-background">
      {/* Glowing orb background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-48 w-48 rounded-full bg-primary/30 blur-3xl animate-pulse-glow" />
      </div>

      {/* Visualizer bars */}
      <div className="relative z-10 flex items-end justify-center gap-0.5 h-32">
        {bars.map((height, i) => (
          <div
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-primary/60 to-accent transition-all duration-100"
            style={{
              height: `${Math.max(4, height)}%`,
              opacity: 0.6 + height / 200,
            }}
          />
        ))}
      </div>

      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
        <div className="h-16 w-16 rounded-full bg-foreground/90 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
          <svg className="h-6 w-6 text-background ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  )
}
