# AudioVid Pro

> Transform your audio into stunning videos with real-time visualizers and upload directly to YouTube.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/rameshgitters-projects/v0-audio-to-video-converter)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0-black?style=for-the-badge)](https://v0.app/chat/rOZerIXod47)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org)

![AudioVid Pro Banner](/public/og-image.png)

## Features

### Core Functionality
- **Audio Upload** - Drag & drop or browse for MP3, WAV, FLAC, OGG files (up to 100MB)
- **Cloud Storage** - Files stored securely using Vercel Blob
- **Real-time Preview** - See your video with synchronized audio visualization before export

### Video Customization
- **4 Visualizer Styles**
  - Bars - Classic frequency bars
  - Wave - Smooth waveform display
  - Circular - Radial frequency visualization
  - Particles - Dynamic particle system reacting to audio
- **Background Options**
  - Gradient presets (Sunset, Ocean, Forest, Nebula, Midnight)
  - Custom image upload
  - Custom video upload
- **Aspect Ratios**
  - 16:9 (YouTube, Desktop)
  - 9:16 (TikTok, Reels, Shorts)
  - 1:1 (Instagram, Square)

### Export Options
- **Quality**: 720p, 1080p, 1440p, 4K
- **Frame Rate**: 30 FPS, 60 FPS
- **Format**: WebM (MP4 with FFmpeg WASM when available)

### YouTube Integration
- **OAuth 2.0 Authentication** - Securely connect your YouTube channel
- **Direct Upload** - Upload videos directly to YouTube from the app
- **Metadata Support** - Set title, description, tags, and privacy settings

### Additional Features
- **Templates** - Pre-designed templates for different genres (Lo-Fi, Podcast, EDM, etc.)
- **Keyboard Shortcuts** - Power user controls (Space, arrows, M, etc.)
- **Recent Projects** - Auto-saved project history
- **Audio Trimming** - Interactive waveform trimmer with zoom support

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Storage**: Vercel Blob
- **Audio Processing**: Web Audio API
- **Video Rendering**: Canvas API + MediaRecorder
- **Authentication**: YouTube OAuth 2.0

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm, npm, or yarn

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/rameshgitter/v0-audio-to-video-converter.git

# Navigate to the project
cd v0-audio-to-video-converter

# Install dependencies
pnpm install

# Start development server
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`env
# Vercel Blob Storage (Required)
BLOB_READ_WRITE_TOKEN=your_blob_token_here

# YouTube API (Optional - for YouTube upload feature)
YOUTUBE_CLIENT_ID=your_google_client_id
YOUTUBE_CLIENT_SECRET=your_google_client_secret
\`\`\`

### Setting Up Vercel Blob

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Storage** tab
4. Create a new **Blob** store
5. Copy the `BLOB_READ_WRITE_TOKEN` to your environment variables

### Setting Up YouTube API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **YouTube Data API v3**
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**
5. Set application type to **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/youtube/callback` (development)
   - `https://yourdomain.com/api/auth/youtube/callback` (production)
7. Copy the **Client ID** and **Client Secret**

## Project Structure

\`\`\`
├── app/
│   ├── api/
│   │   ├── upload/              # Audio upload to Blob
│   │   ├── upload-video/        # Video upload to Blob
│   │   ├── delete/              # Delete from Blob
│   │   ├── auth/youtube/        # YouTube OAuth flow
│   │   └── youtube/             # YouTube API endpoints
│   ├── create/                  # Video editor page
│   ├── templates/               # Templates gallery
│   ├── pricing/                 # Pricing page
│   └── page.tsx                 # Landing page
├── components/
│   ├── audio-uploader.tsx       # File upload component
│   ├── video-editor.tsx         # Main editor controls
│   ├── video-preview.tsx        # Canvas-based preview
│   ├── export-panel.tsx         # Export & YouTube upload
│   ├── audio-waveform-trimmer.tsx
│   └── ...
├── lib/
│   ├── frame-renderer.ts        # Visualizer rendering logic
│   ├── ffmpeg-worker.ts         # FFmpeg WASM integration
│   └── video-renderer.ts        # Video export utilities
└── ...
\`\`\`

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload audio file to Vercel Blob |
| `/api/upload-video` | POST | Upload generated video to Vercel Blob |
| `/api/delete` | DELETE | Delete file from Vercel Blob |
| `/api/auth/youtube` | GET | Initiate YouTube OAuth flow |
| `/api/auth/youtube/callback` | GET | Handle OAuth callback |
| `/api/youtube/status` | GET | Check YouTube connection status |
| `/api/youtube/upload` | POST | Upload video to YouTube |
| `/api/youtube/disconnect` | POST | Disconnect YouTube account |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` | Rewind 5 seconds |
| `→` | Forward 5 seconds |
| `↑` | Volume up |
| `↓` | Volume down |
| `M` | Mute/Unmute |
| `F` | Toggle fullscreen |
| `?` | Show shortcuts help |

## Deployment

### Deploy with Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rameshgitter/v0-audio-to-video-converter)

1. Click the button above
2. Connect your GitHub repository
3. Add environment variables in Vercel dashboard
4. Deploy!

### Manual Deployment

\`\`\`bash
# Build the project
pnpm build

# Start production server
pnpm start
\`\`\`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [v0.app](https://v0.app) by Vercel
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

---

**[Live Demo](https://v0-audio-to-video-converter.vercel.app)** | **[Report Bug](https://github.com/rameshgitter/v0-audio-to-video-converter/issues)** | **[Request Feature](https://github.com/rameshgitter/v0-audio-to-video-converter/issues)**
