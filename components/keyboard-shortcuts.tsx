"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface KeyboardShortcutsProps {
  onTogglePlay?: () => void
  onSkipForward?: () => void
  onSkipBackward?: () => void
  onToggleMute?: () => void
}

const shortcuts = [
  { keys: ["Space"], description: "Play/Pause" },
  { keys: ["←"], description: "Skip back 10s" },
  { keys: ["→"], description: "Skip forward 10s" },
  { keys: ["M"], description: "Toggle mute" },
  { keys: ["F"], description: "Toggle fullscreen" },
  { keys: ["?"], description: "Show shortcuts" },
  { keys: ["Ctrl", "S"], description: "Export video" },
  { keys: ["Ctrl", "Z"], description: "Undo" },
]

export function KeyboardShortcuts({
  onTogglePlay,
  onSkipForward,
  onSkipBackward,
  onToggleMute,
}: KeyboardShortcutsProps) {
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault()
          onTogglePlay?.()
          break
        case "arrowleft":
          e.preventDefault()
          onSkipBackward?.()
          break
        case "arrowright":
          e.preventDefault()
          onSkipForward?.()
          break
        case "m":
          onToggleMute?.()
          break
        case "?":
          setShowDialog(true)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onTogglePlay, onSkipForward, onSkipBackward, onToggleMute])

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Use these shortcuts to control the video editor</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 mt-4">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, j) => (
                  <Badge key={j} variant="secondary" className="font-mono text-xs">
                    {key}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
