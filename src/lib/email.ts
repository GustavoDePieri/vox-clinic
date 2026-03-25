import { Resend } from 'resend'
import { env } from '@/lib/env'

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
}) {
  if (!resend) {
    console.warn('Email not configured: RESEND_API_KEY is missing')
    return null
  }

  const { data, error } = await resend.emails.send({
    from: 'VoxClinic <noreply@voxclinic.com>',
    ...options,
  })

  if (error) throw new Error(error.message)
  return data
}
