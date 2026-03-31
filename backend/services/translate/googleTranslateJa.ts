import { fetchWithTimeout } from '../../utils/http'

/**
 * Translate plain text to Japanese via Google Cloud Translation API (v2).
 * Set GOOGLE_TRANSLATE_API_KEY in .env (API key with Cloud Translation enabled).
 */
export async function translateTextToJapanese(text: string): Promise<string> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY?.trim()
  const trimmed = text.trim()
  if (!key || !trimmed) {
    return ''
  }

  const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: trimmed,
          target: 'ja',
          format: 'text',
        }),
      },
      20000,
    )

    if (!response.ok) {
      const err = await response.text().catch(() => '')
      console.warn('[translate]', response.status, err.slice(0, 200))
      return ''
    }

    const data = (await response.json()) as {
      data?: { translations?: Array<{ translatedText?: string }> }
    }
    const out = data.data?.translations?.[0]?.translatedText
    return (out || '').trim()
  } catch (e) {
    console.warn('[translate] request failed', e)
    return ''
  }
}
