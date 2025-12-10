import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedAudioTypes = ["audio/mpeg", "audio/wav", "audio/flac", "audio/ogg", "audio/mp3", "audio/x-m4a"]
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"]
    const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    const allowedTypes = [...allowedAudioTypes, ...allowedVideoTypes, ...allowedImageTypes]

    if (!allowedTypes.some((type) => file.type.includes(type.split("/")[1]))) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`
    const folder = file.type.startsWith("audio/") ? "audio" : file.type.startsWith("video/") ? "video" : "images"

    // Upload to Vercel Blob
    const blob = await put(`${folder}/${filename}`, file, {
      access: "public",
    })

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
