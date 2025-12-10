import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET
const YOUTUBE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`
  : "http://localhost:3000/api/auth/youtube/callback"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(new URL("/create?youtube_error=" + error, request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL("/create?youtube_error=no_code", request.url))
  }

  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/create?youtube_error=not_configured", request.url))
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
        redirect_uri: YOUTUBE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    })

    const tokens = await tokenResponse.json()

    if (tokens.error) {
      return NextResponse.redirect(new URL("/create?youtube_error=" + tokens.error, request.url))
    }

    // Get user info
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const userInfo = await userResponse.json()

    // Get YouTube channel info
    const channelResponse = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const channelData = await channelResponse.json()
    const channel = channelData.items?.[0]

    // Store tokens in cookies (in production, use a database)
    const cookieStore = await cookies()
    cookieStore.set("youtube_access_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in,
    })

    if (tokens.refresh_token) {
      cookieStore.set("youtube_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      })
    }

    cookieStore.set(
      "youtube_user",
      JSON.stringify({
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        channelId: channel?.id,
        channelTitle: channel?.snippet?.title,
      }),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: tokens.expires_in,
      },
    )

    return NextResponse.redirect(new URL("/create?youtube_connected=true", request.url))
  } catch (error) {
    console.error("YouTube OAuth error:", error)
    return NextResponse.redirect(new URL("/create?youtube_error=token_exchange_failed", request.url))
  }
}
