import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  const cookieStore = await cookies()

  cookieStore.delete("youtube_access_token")
  cookieStore.delete("youtube_refresh_token")
  cookieStore.delete("youtube_user")

  return NextResponse.json({ success: true })
}
