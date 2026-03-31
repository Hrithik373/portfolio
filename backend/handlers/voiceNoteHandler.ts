import type { Request, Response } from 'express'
import multer from 'multer'
import { createTransporter } from '../services/email/smtp'
import { encodeVoiceNoteToMp3Hd } from '../services/voice/encodeVoiceNoteMp3'
import { transcribeWithWhisper } from '../services/voice/whisperTranscribe'

export const voiceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
})

const sanitize = (value: unknown) => String(value ?? '').trim()
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

function guestFromEmail(addr: string): string {
  const local = addr.split('@')[0] || ''
  const cleaned = local.replace(/[._+\d]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'there'
  return cleaned
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function thankYouIndex(email: string): number {
  let h = 0
  for (let i = 0; i < email.length; i++) {
    h = (h * 31 + email.charCodeAt(i)) >>> 0
  }
  return h % THANK_YOU_VARIANTS.length
}

/** Twenty distinct thank-you bodies; one stable choice per sender email. */
const THANK_YOU_VARIANTS: string[] = [
  `Dear {name},\n\nYour voice note arrived like the first blossom after winter — unexpected and deeply appreciated. Thank you for taking a moment to speak from the heart; I will listen with care.\n\nWith warmth,\nHrithik`,
  `Dear {name},\n\nHearing your message was a quiet joy. I am grateful you chose to share your voice; it means more than a line of text ever could. Thank you for this thoughtful gesture.\n\nGratefully,\nHrithik`,
  `Dear {name},\n\nThank you for the voice you sent my way. There is something honest about spoken words, and I receive yours with genuine appreciation. I will hold this kindly.\n\nWarmly,\nHrithik`,
  `Dear {name},\n\nYour kind voice note landed softly and sincerely. I am touched that you took the time — thank you for reaching out in such a personal way.\n\nWith appreciation,\nHrithik`,
  `Dear {name},\n\nWhat a lovely surprise. Your spoken message carries a warmth that typed letters rarely match; I am truly thankful for your gesture.\n\nKind regards,\nHrithik`,
  `Dear {name},\n\nI received your voice note with gratitude. Thank you for trusting me with your words — I will give them the attention they deserve.\n\nSincerely,\nHrithik`,
  `Dear {name},\n\nYour voice traveled through the wire and still felt human and close. Thank you for this gentle, generous hello.\n\nWarm regards,\nHrithik`,
  `Dear {name},\n\nA spoken message is a small gift of time and tone; I appreciate yours more than I can say here. Thank you sincerely.\n\nWith thanks,\nHrithik`,
  `Dear {name},\n\nThank you for the voice you shared. It reminded me why I build systems that carry real human connection — gestures like yours matter.\n\nGratefully,\nHrithik`,
  `Dear {name},\n\nI am honored by your voice note. Thank you for choosing something so personal; I will listen and respond with the same respect.\n\nWarmly,\nHrithik`,
  `Dear {name},\n\nYour message arrived as sound, but it read as kindness. Thank you for taking that extra step — it does not go unnoticed.\n\nKind regards,\nHrithik`,
  `Dear {name},\n\nThank you for sending your thoughts by voice. There is sincerity in the medium, and I am grateful to receive it.\n\nWith appreciation,\nHrithik`,
  `Dear {name},\n\nI listened to your note with a smile. Thank you for this warm, human touch amid the noise of the everyday web.\n\nSincerely,\nHrithik`,
  `Dear {name},\n\nYour voice note was a bright spot in my inbox. Thank you for the effort and the care woven into it.\n\nWarm regards,\nHrithik`,
  `Dear {name},\n\nReceiving your spoken words felt like a letter sealed with care. Thank you — I am genuinely thankful.\n\nGratefully,\nHrithik`,
  `Dear {name},\n\nThank you for sharing your voice. I treat every such message as a small ceremony of trust, and I honor yours.\n\nWith warmth,\nHrithik`,
  `Dear {name},\n\nWhat you sent was more than audio — it was intention. Thank you for that rare and welcome gift.\n\nKind regards,\nHrithik`,
  `Dear {name},\n\nI am grateful for your voice note and the spirit behind it. Thank you for reaching out so thoughtfully.\n\nSincerely,\nHrithik`,
  `Dear {name},\n\nYour words, spoken aloud, carried a sincerity that moved me. Thank you for this beautiful gesture.\n\nWarmly,\nHrithik`,
  `Dear {name},\n\nThank you for the privilege of hearing you directly. I will remember this kindness — and reply in kind when I can.\n\nWith deep thanks,\nHrithik`,
]

function buildThankYouBody(email: string): string {
  const name = guestFromEmail(email)
  const template = THANK_YOU_VARIANTS[thankYouIndex(email)]
  return template.replace(/\{name\}/g, name)
}

function thankYouToHtml(body: string) {
  return body
    .split('\n\n')
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br />')}</p>`)
    .join('')
}

export async function voiceNoteHandler(req: Request, res: Response) {
  const email = sanitize(req.body?.email)
  const warmNote = sanitize(req.body?.warmNote)
  const file = (req as Request & { file?: Express.Multer.File }).file

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'A valid email is required.' })
  }

  if (!file?.buffer || file.buffer.length === 0) {
    return res.status(400).json({ message: 'Please attach a voice recording.' })
  }

  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const recipient = process.env.CONTACT_TO ?? 'hrithikgh29@gmail.com'

  if (!smtpUser || !smtpPass) {
    return res.status(500).json({ message: 'Email service not configured.' })
  }

  const ext =
    file.mimetype?.includes('mp4') || file.originalname?.toLowerCase().endsWith('.m4a')
      ? 'm4a'
      : file.mimetype?.includes('mpeg') || file.originalname?.toLowerCase().endsWith('.mp3')
        ? 'mp3'
        : 'webm'

  const transcript = await transcribeWithWhisper(
    file.buffer,
    file.originalname || `recording.${ext}`,
    file.mimetype || `audio/${ext}`
  )

  const transcriptBlock =
    transcript ||
    (process.env.OPENAI_API_KEY
      ? '[Transcription unavailable — audio file is attached.]'
      : '[Set OPENAI_API_KEY on the server for automatic transcription. Audio file is attached.]')

  const mp3Attachment = await encodeVoiceNoteToMp3Hd(file.buffer, ext)
  const attachmentBuffer = mp3Attachment ?? file.buffer
  const attachmentFilename = mp3Attachment ? 'voice-note.mp3' : `voice-note.${ext}`
  const attachmentContentType = mp3Attachment ? 'audio/mpeg' : file.mimetype || `audio/${ext}`

  const transporter = createTransporter(smtpUser, smtpPass)
  const thankYouText = buildThankYouBody(email)
  const thankYouHtml = thankYouToHtml(thankYouText)

  const ownerSubject = `Voice note · Cherry Blossom Petal · ${email}`
  const userSubject = 'Thank you for your voice note · Cherry Blossom Petal'

  await transporter.sendMail({
    from: `Cherry Blossom Petal Bot <${smtpUser}>`,
    to: recipient,
    replyTo: email,
    subject: ownerSubject,
    text:
      `Voice note from: ${email}\n\n` +
      (warmNote ? `Warm note from sender:\n${warmNote}\n\n` : '') +
      `Transcript (Whisper when configured):\n${transcriptBlock}\n`,
    html:
      `<p><strong>From:</strong> ${escapeHtml(email)}</p>` +
      (warmNote ? `<p><strong>Warm note</strong><br />${escapeHtml(warmNote).replace(/\n/g, '<br />')}</p>` : '') +
      `<p><strong>Transcript</strong><br />${escapeHtml(transcriptBlock).replace(/\n/g, '<br />')}</p>`,
    attachments: [
      {
        filename: attachmentFilename,
        content: attachmentBuffer,
        contentType: attachmentContentType,
      },
    ],
  })

  await transporter.sendMail({
    from: `Cherry Blossom Petal Bot <${smtpUser}>`,
    to: email,
    replyTo: recipient,
    subject: userSubject,
    text:
      `${thankYouText}\n\n---\n` +
      `This note was sent automatically by the portfolio mail bot after your voice message was received.`,
    html:
      `<div style="font-family:Georgia,serif;line-height:1.6;color:#3d2c32;max-width:520px">` +
      thankYouHtml +
      `<hr style="border:0;border-top:1px solid #f0c8d8;margin:20px 0" />` +
      `<p style="font-size:0.85rem;color:#6b5a60"><em>This message was sent automatically by the Cherry Blossom Petal portfolio bot after your voice note was safely received.</em></p>` +
      `</div>`,
  })

  return res.status(200).json({
    ok: true,
    transcribed: Boolean(transcript),
  })
}
