import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

export async function uploadAudio(file: Buffer, filename: string): Promise<string> {
  const path = `recordings/${Date.now()}-${filename}`
  const { error } = await supabase.storage
    .from('audio')
    .upload(path, file, { contentType: 'audio/webm' })
  if (error) throw error
  return path
}

export async function getSignedAudioUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('audio')
    .createSignedUrl(path, 300)
  if (error || !data?.signedUrl) throw error ?? new Error('Failed to create signed URL')
  return data.signedUrl
}

export async function deleteAudio(path: string): Promise<void> {
  await supabase.storage.from('audio').remove([path])
}

export async function uploadVideo(file: Buffer, filename: string): Promise<string> {
  const path = `video/${Date.now()}-${filename}`
  const { error } = await supabase.storage
    .from('audio')  // reuse same bucket, different folder
    .upload(path, file, { contentType: 'video/mp4' })
  if (error) throw error
  return path
}

export async function uploadVideoBlob(blob: Blob, filename: string): Promise<string> {
  const path = `video/${Date.now()}-${filename}`
  const { error } = await supabase.storage
    .from('audio')  // reuse same bucket, different folder
    .upload(path, blob, { contentType: 'video/mp4' })
  if (error) throw error
  return path
}

export async function getSignedVideoUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('audio')
    .createSignedUrl(path, 300) // 5 min expiry
  if (error || !data?.signedUrl) throw error ?? new Error('Failed to create signed URL')
  return data.signedUrl
}

// ============================================================
// Clinical Images
// ============================================================

export async function uploadClinicalImage(
  file: Buffer,
  workspaceId: string,
  patientId: string,
  filename: string
): Promise<string> {
  const ext = filename.split('.').pop() || 'jpg'
  const path = `clinical-images/${workspaceId}/${patientId}/${Date.now()}_${crypto.randomUUID()}.${ext}`
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  }
  const contentType = mimeMap[ext.toLowerCase()] || 'image/jpeg'
  const { error } = await supabase.storage
    .from('audio')
    .upload(path, file, { contentType, upsert: false })
  if (error) throw error
  return path
}

export async function getSignedImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('audio')
    .createSignedUrl(path, 300) // 5 min expiry
  if (error || !data?.signedUrl) throw error ?? new Error('Failed to create signed URL')
  return data.signedUrl
}

export async function deleteClinicalImage(path: string): Promise<void> {
  await supabase.storage.from('audio').remove([path])
}

export async function getAudioBuffer(path: string): Promise<Buffer> {
  const { data, error } = await supabase.storage
    .from('audio')
    .download(path)
  if (error || !data) throw error ?? new Error('Failed to download audio')
  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
