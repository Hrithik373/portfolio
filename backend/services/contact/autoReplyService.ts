import { fetchWithTimeout } from '../../utils/http'

const randomPick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

const toneVariants = [
  "slightly formal",
  "friendly professional",
  "concise corporate",
  "warm and polite",
]

export const getAutoReplyText = async ({
  name,
  subject,
  groqApiKey,
  groqModel,
}: {
  name: string
  subject: string
  groqApiKey?: string
  groqModel: string
}) => {
  const role =
    subject.replace(/hiring|role|position|opening/gi, '').trim() ||
    "this opportunity"

  const tone = randomPick(toneVariants)

  if (!groqApiKey) {
    return `Dear ${name},

Thank you for reaching out regarding "${role}".

I've received your message and will review it shortly. I'll get back to you soon with more details.

Looking forward to connecting.

Hrithik will respond within 12–24 hours.`
  }

  try {
    const response = await fetchWithTimeout(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: groqModel,
          temperature: 1,
          top_p: 0.95,
          presence_penalty: 0.8,
          frequency_penalty: 0.6,
          messages: [
            {
              role: "system",
              content: `
You are a professional email assistant.

Generate a recruiter auto-reply email.

STYLE:
- ${tone}
- professional but natural
- human-like (not robotic)

REQUIREMENTS:
- Address recruiter by name
- Mention the role
- Acknowledge message
- Say you will review and respond soon
- Invite them to share more details
- Keep it concise (5–8 lines)

IMPORTANT:
- Every response MUST be phrased differently
- Vary sentence structure and wording
- Avoid repeating patterns
- Do NOT sound templated

DO NOT include this line:
"Hrithik will respond within 12–24 hours."
              `,
            },
            {
              role: "user",
              content: `Recruiter Name: ${name}
Role: ${role}`,
            },
          ],
        }),
      }
    )

    const data = await response.json()
    const generated =
      data?.choices?.[0]?.message?.content?.trim()

    if (!generated) throw new Error("Empty response")

    return `${generated}\n\nHrithik will respond within 12–24 hours.`
  } catch {
    return `Dear ${name},

Thank you for reaching out regarding "${role}".

I'll review your message and follow up shortly.

Looking forward to connecting.

Hrithik will respond within 12–24 hours.`
  }
}
