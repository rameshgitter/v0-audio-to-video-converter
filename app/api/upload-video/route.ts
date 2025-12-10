import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("video") as File
    const title = (formData.get("title") as string) || "untitled"

    if (!file) {
      return NextResponse.json({ error: "No video provided" }, { status: 400 })
    }

    // Generate unique filename based on title
    const timestamp = Date.now()
    const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    const extension = file.type === "video/mp4" ? "mp4" : "webm"
    const filename = `${safeTitle}-${timestamp}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(`exports/${filename}`, file, {
      access: "public",
    })

    return NextResponse.json({
      url: blob.url,
      filename: filename,
      size: file.size,
      downloadUrl: blob.url,
    })
  } catch (error) {
    console.error("Video upload error:", error)
    return NextResponse.json({ error: "Video upload failed" }, { status: 500 })
  }
}
