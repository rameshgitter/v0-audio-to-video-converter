import { type NextRequest, NextResponse } from "next/server"

// YouTube OAuth configuration
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID
const YOUTUBE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`
  : "http://localhost:3000/api/auth/youtube/callback"

const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ")

export async function GET(request: NextRequest) {
  if (!YOUTUBE_CLIENT_ID) {
    return NextResponse.json(
      { error: "YouTube API not configured. Please add YOUTUBE_CLIENT_ID to environment variables." },
      { status: 500 },
    )
  }

  const state = Math.random().toString(36).substring(7)

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", YOUTUBE_CLIENT_ID)
  authUrl.searchParams.set("redirect_uri", YOUTUBE_REDIRECT_URI)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", YOUTUBE_SCOPES)
  authUrl.searchParams.set("access_type", "offline")
  authUrl.searchParams.set("prompt", "consent")
  authUrl.searchParams.set("state", state)

  return NextResponse.json({ authUrl: authUrl.toString(), state })
}
