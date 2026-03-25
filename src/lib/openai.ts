import OpenAI from 'openai'
import { env } from '@/lib/env'

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  timeout: 60_000,
})

const DEFAULT_MEDICAL_PROMPT =
  'Transcrição de consulta médica/odontológica em português brasileiro. Termos: anamnese, profilaxia, endodontia, periodontia, restauração, prótese, implante, ortodontia, radiografia, hemograma, pressão arterial, glicemia, alergia, medicamento, prescrição.'

const MIME_TYPES: Record<string, string> = {
  webm: 'audio/webm',
  mp3: 'audio/mpeg',
  mp4: 'audio/mp4',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  vocabularyHints?: string[],
  // Default to whisper-1 for safety. Can switch to 'gpt-4o-mini-transcribe' for
  // cheaper transcription (~50% cost reduction), but verify API parameter compatibility
  // first — gpt-4o-mini-transcribe may not support response_format: 'verbose_json' or prompt.
  model: string = 'whisper-1'
): Promise<{ text: string; duration: number | null }> {
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'webm'
  const mimeType = MIME_TYPES[ext] ?? 'audio/webm'

  const file = new File([new Uint8Array(audioBuffer)], filename, { type: mimeType })

  // Build vocabulary prompt
  let prompt = DEFAULT_MEDICAL_PROMPT
  if (vocabularyHints && vocabularyHints.length > 0) {
    const hints = vocabularyHints.slice(0, 50).join(', ')
    prompt = `${prompt} ${hints}.`
  }

  try {
    const response = await openai.audio.transcriptions.create({
      model,
      file,
      language: 'pt',
      response_format: 'verbose_json',
      prompt,
    })

    return {
      text: response.text,
      duration: response.duration ?? null,
    }
  } catch (err) {
    // Fallback to whisper-1 if the requested model fails (e.g. gpt-4o-mini-transcribe
    // may not support all parameters like response_format or prompt)
    if (model !== 'whisper-1') {
      console.warn(`Transcription with ${model} failed, falling back to whisper-1:`, err)
      const fallbackResponse = await openai.audio.transcriptions.create({
        model: 'whisper-1',
        file,
        language: 'pt',
        response_format: 'verbose_json',
        prompt,
      })

      return {
        text: fallbackResponse.text,
        duration: fallbackResponse.duration ?? null,
      }
    }
    throw err
  }
}
