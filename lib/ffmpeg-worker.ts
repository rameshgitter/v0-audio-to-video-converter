// FFmpeg WASM worker for real video generation
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { toBlobURL, fetchFile } from "@ffmpeg/util"

let ffmpeg: FFmpeg | null = null
let loaded = false

export async function loadFFmpeg(onProgress?: (progress: number) => void) {
  if (loaded && ffmpeg) return ffmpeg

  ffmpeg = new FFmpeg()

  ffmpeg.on("progress", ({ progress }) => {
    onProgress?.(Math.round(progress * 100))
  })

  // Load FFmpeg WASM from CDN
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm"

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  })

  loaded = true
  return ffmpeg
}

export async function generateVideoWithFFmpeg(
  audioBlob: Blob,
  frameBlobs: Blob[],
  fps: number,
  onProgress?: (stage: string, progress: number) => void,
): Promise<Blob> {
  const ffmpeg = await loadFFmpeg()

  onProgress?.("loading", 0)

  // Write audio file
  const audioData = await fetchFile(audioBlob)
  await ffmpeg.writeFile("audio.mp3", audioData)

  onProgress?.("frames", 0)

  // Write all frames
  for (let i = 0; i < frameBlobs.length; i++) {
    const frameData = await fetchFile(frameBlobs[i])
    await ffmpeg.writeFile(`frame${String(i).padStart(6, "0")}.png`, frameData)
    onProgress?.("frames", Math.round((i / frameBlobs.length) * 100))
  }

  onProgress?.("encoding", 0)

  // Encode video with audio
  await ffmpeg.exec([
    "-framerate",
    String(fps),
    "-i",
    "frame%06d.png",
    "-i",
    "audio.mp3",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-pix_fmt",
    "yuv420p",
    "-shortest",
    "-movflags",
    "+faststart",
    "output.mp4",
  ])

  onProgress?.("finalizing", 90)

  // Read output file
  const data = await ffmpeg.readFile("output.mp4")
  const videoBlob = new Blob([data], { type: "video/mp4" })

  // Cleanup
  await ffmpeg.deleteFile("audio.mp3")
  for (let i = 0; i < frameBlobs.length; i++) {
    await ffmpeg.deleteFile(`frame${String(i).padStart(6, "0")}.png`)
  }
  await ffmpeg.deleteFile("output.mp4")

  onProgress?.("complete", 100)

  return videoBlob
}

export function isFFmpegSupported(): boolean {
  return typeof SharedArrayBuffer !== "undefined"
}
