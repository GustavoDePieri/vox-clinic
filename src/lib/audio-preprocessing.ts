import ffmpeg from 'fluent-ffmpeg'
import { Readable, PassThrough } from 'stream'
import path from 'path'

// Resolve ffmpeg binary path — ffmpeg-static may return incorrect path on Windows
// so we resolve it relative to node_modules
const ffmpegPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)

interface PreprocessOptions {
  speed?: number        // 1.0 - 2.0, default 1.4
  removeSilence?: boolean  // default true
  targetSampleRate?: number // default 16000
  targetBitrate?: string   // default '64k'
}

export async function preprocessAudio(
  inputBuffer: Buffer,
  filename: string,
  options: PreprocessOptions = {}
): Promise<{ buffer: Buffer; originalDuration: number | null; processedDuration: number | null }> {
  const {
    speed = 1.4,
    removeSilence = true,
    targetSampleRate = 16000,
    targetBitrate = '64k',
  } = options

  return new Promise((resolve, reject) => {
    const inputStream = Readable.from(inputBuffer)
    const chunks: Buffer[] = []
    const output = new PassThrough()

    output.on('data', (chunk: Buffer) => chunks.push(chunk))
    output.on('end', () => {
      resolve({
        buffer: Buffer.concat(chunks),
        originalDuration: null, // will be filled from Whisper response
        processedDuration: null,
      })
    })
    output.on('error', reject)

    // Build audio filter chain
    const filters: string[] = []

    // 1. Silence removal (if enabled)
    if (removeSilence) {
      filters.push('silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold=-30dB:stop_silence=0.15')
    }

    // 2. Speed up (using atempo, max 2.0 per filter)
    if (speed > 1.0 && speed <= 2.0) {
      filters.push(`atempo=${speed}`)
    } else if (speed > 2.0) {
      // Chain atempo filters for speeds > 2.0
      filters.push(`atempo=2.0`)
      filters.push(`atempo=${speed / 2.0}`)
    }

    const command = ffmpeg(inputStream)
      .inputFormat(getInputFormat(filename))
      .audioChannels(1)
      .audioFrequency(targetSampleRate)
      .audioBitrate(targetBitrate)
      .format('mp3')

    if (filters.length > 0) {
      command.audioFilters(filters)
    }

    command
      .on('error', (err: Error) => reject(new Error(`FFmpeg error: ${err.message}`)))
      .pipe(output, { end: true })
  })
}

function getInputFormat(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'webm'
  const formatMap: Record<string, string> = {
    webm: 'webm',
    mp3: 'mp3',
    mp4: 'mp4',
    m4a: 'mp4',
    wav: 'wav',
    ogg: 'ogg',
    flac: 'flac',
  }
  return formatMap[ext] ?? 'webm'
}
