import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("youtube_access_token")?.value

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated with YouTube" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const videoFile = formData.get("video") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const tags = formData.get("tags") as string
    const privacy = (formData.get("privacy") as string) || "private"

    if (!videoFile) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 })
    }

    // Step 1: Create the video metadata
    const metadata = {
      snippet: {
        title: title || "Untitled Video",
        description: description || "",
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        categoryId: "10", // Music category
      },
      status: {
        privacyStatus: privacy,
        selfDeclaredMadeForKids: false,
      },
    }

    // Step 2: Initialize resumable upload
    const initResponse = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Length": String(videoFile.size),
          "X-Upload-Content-Type": videoFile.type,
        },
        body: JSON.stringify(metadata),
      },
    )

    if (!initResponse.ok) {
      const error = await initResponse.json()
      console.error("YouTube init error:", error)
      return NextResponse.json({ error: error.error?.message || "Failed to initialize upload" }, { status: 500 })
    }

    const uploadUrl = initResponse.headers.get("location")

    if (!uploadUrl) {
      return NextResponse.json({ error: "Failed to get upload URL" }, { status: 500 })
    }

    // Step 3: Upload the video file
    const videoBuffer = await videoFile.arrayBuffer()

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": videoFile.type,
        "Content-Length": String(videoFile.size),
      },
      body: videoBuffer,
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json()
      console.error("YouTube upload error:", error)
      return NextResponse.json({ error: error.error?.message || "Failed to upload video" }, { status: 500 })
    }

    const videoData = await uploadResponse.json()

    return NextResponse.json({
      success: true,
      videoId: videoData.id,
      videoUrl: `https://www.youtube.com/watch?v=${videoData.id}`,
      studioUrl: `https://studio.youtube.com/video/${videoData.id}/edit`,
    })
  } catch (error) {
    console.error("YouTube upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
