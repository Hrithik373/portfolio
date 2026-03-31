import type { EmailIntent } from '../../../shared/types'
import { fetchWithTimeout } from '../../utils/http'

const fallbackReply = (senderName: string, intent: EmailIntent) => {
  const opener = `Hi ${senderName},`
  if (intent === 'interview' || intent === 'offer') {
    return `${opener}\n\nThanks for your message — I’ll review the details and get back to you shortly.\n\nBest,\nHrithik`
  }
  return `${opener}\n\nThank you for reaching out. I’ve received your note and will reply soon with more detail.\n\nBest,\nHrithik`
}

export const generateReply = async ({
  emailBody,
  senderName,
  intent,
}: {
  emailBody: string
  senderName: string
  intent: EmailIntent
}): Promise<string> => {
  const groqApiKey = process.env.GROQ_API_KEY
  const groqModel = process.env.GROQ_MODEL || 'llama3-8b-8192'

  if (!groqApiKey) {
    return fallbackReply(senderName, intent)
  }

  try {
    const response = await fetchWithTimeout(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: groqModel,
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content: `You are Hrithik’s professional email assistant. Write a short, warm, human reply (under 120 words). Intent label: ${intent}. Do not promise specific interview times or accept/decline offers; acknowledge and say you’ll follow up.`,
            },
            {
              role: 'user',
              content: `From: ${senderName}\n\n${emailBody}`,
            },
          ],
        }),
      },
    )

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const text = data?.choices?.[0]?.message?.content?.trim()
    if (text) return text
  } catch {
    // fall through
  }

  return fallbackReply(senderName, intent)
}
