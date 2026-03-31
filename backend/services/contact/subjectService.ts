import { fetchWithTimeout } from '../../utils/http'

export const getProfessionalSubject = async (
  subject: string,
  groqApiKey: string | undefined,
  groqModel: string
) => {
  const fallback = subject
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90)
    .replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase())

  if (!groqApiKey) return fallback
  try {
    const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: groqModel,
        messages: [
          {
            role: 'system',
            content: 'You rewrite subject lines professionally. Keep it concise under 10 words, no emojis.',
          },
          {
            role: 'user',
            content: `Rewrite this subject: "${subject}"`,
          },
        ],
        temperature: 0.4,
        max_tokens: 24,
      }),
    })
    if (!response.ok) return fallback
    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content?.trim?.() || ''
    return text ? text.replace(/\s+/g, ' ') : fallback
  } catch {
    return fallback
  }
}
