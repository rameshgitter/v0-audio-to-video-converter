"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Trash2, Edit2, MoreVertical, Download, Copy } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Project {
  id: string
  title: string
  thumbnail: string
  createdAt: Date
  duration: number
  status: "draft" | "exported" | "processing"
  aspectRatio: string
}

export function RecentProjects() {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem("audiovidpro_projects")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setProjects(parsed.map((p: Project) => ({ ...p, createdAt: new Date(p.createdAt) })))
      } catch {
        // Invalid data
      }
    }
  }, [])

  const deleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id)
    setProjects(updated)
    localStorage.setItem("audiovidpro_projects", JSON.stringify(updated))
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (projects.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Projects
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {projects.slice(0, 5).map((project) => (
            <div
              key={project.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors group"
            >
              <div
                className="w-16 h-9 rounded bg-secondary flex-shrink-0"
                style={{
                  backgroundImage: project.thumbnail ? `url(${project.thumbnail})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{project.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDuration(project.duration)} • {formatDate(project.createdAt)}
                </p>
              </div>
              <Badge
                variant={
                  project.status === "exported" ? "default" : project.status === "processing" ? "secondary" : "outline"
                }
                className="flex-shrink-0"
              >
                {project.status}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => deleteProject(project.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
