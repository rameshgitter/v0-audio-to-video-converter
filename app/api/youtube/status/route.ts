import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("youtube_access_token")?.value
  const userCookie = cookieStore.get("youtube_user")?.value

  if (!accessToken) {
    return NextResponse.json({ connected: false })
  }

  // Verify token is still valid
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v1/tokeninfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ connected: false })
    }

    const userInfo = userCookie ? JSON.parse(userCookie) : null

    return NextResponse.json({
      connected: true,
      user: userInfo,
    })
  } catch {
    return NextResponse.json({ connected: false })
  }
}
