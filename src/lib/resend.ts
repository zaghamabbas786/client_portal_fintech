/**
 * Resend email integration.
 * Docs: https://resend.com/docs
 */

import { Resend } from 'resend'

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

/** Send 30-day check-in email with Calendly link. */
export async function sendCheckInEmail(params: {
  to: string
  name?: string | null
  calendlyUrl: string
}): Promise<{ success: boolean; error?: string }> {
  const resend = getClient()
  if (!resend) {
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  const displayName = params.name || 'there'
  const subject = 'Time for your 30-day check-in'
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #333;">Hi ${displayName},</h2>
      <p style="color: #555; line-height: 1.6;">
        You've been with us for 30 days! We'd love to hear how things are going and answer any questions you might have.
      </p>
      <p style="color: #555; line-height: 1.6;">
        Book a quick check-in call at a time that works for you:
      </p>
      <p style="margin: 24px 0;">
        <a href="${params.calendlyUrl}" style="background: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
          Book Check-In Call
        </a>
      </p>
      <p style="color: #888; font-size: 14px;">
        Looking forward to connecting with you!
      </p>
    </div>
  `

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject,
      html,
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send email'
    return { success: false, error: msg }
  }
}
