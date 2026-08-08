import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import { FeatureLocked } from '../../CookieBanner/FeatureLocked'
import { vikApiUrl } from '../../../../config/vikApiBase'
import type { VikBackendStatus } from './VikOrb'

interface Message {
  role: 'user' | 'vik'
  text: string
}

const OFFLINE_NOTICE =
  "Vik's backend isn't reachable right now — it runs locally via Docker Compose (see the repo's vik/ directory) and isn't hosted publicly yet."

/**
 * FastAPI's /chat streams over a POST request, not a GET, so the browser's
 * native EventSource (GET-only) can't be used — this reads the
 * `text/event-stream` body manually via fetch()'s ReadableStream instead.
 * (Same parsing logic as vik/web-widget/src/VikChat.tsx — duplicated
 * rather than shared, since these are two independently-built/deployed
 * projects with no shared package tooling between them.)
 */
async function streamChat(message: string, onToken: (token: string) => void): Promise<void> {
  const response = await fetch(vikApiUrl('/agent/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  if (!response.ok || !response.body) throw new Error(`Vik chat request failed (HTTP ${response.status})`)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''
    for (const event of events) {
      const line = event.trim()
      if (!line.startsWith('data:')) continue
      const payload = JSON.parse(line.slice('data:'.length).trim())
      if (payload.token) onToken(payload.token)
    }
  }
}

export function VikChatPanel({
  theme,
  status,
  onBackendUnreachable,
}: {
  theme: 'night' | 'day'
  status: VikBackendStatus
  onBackendUnreachable: () => void
}) {
  const isNight = theme === 'night'
  const [messages, setMessages] = useState<Message[]>([
    { role: 'vik', text: "Hi, I'm Vik — ask me about Hrithik's experience, projects, or skills." },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const vikIndexRef = useRef<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || sending) return

    if (status === 'offline') {
      setMessages((prev) => [...prev, { role: 'user', text }, { role: 'vik', text: OFFLINE_NOTICE }])
      setInput('')
      return
    }

    setMessages((prev) => {
      vikIndexRef.current = prev.length + 1
      return [...prev, { role: 'user', text }, { role: 'vik', text: '' }]
    })
    setInput('')
    setSending(true)

    try {
      await streamChat(text, (token) => {
        setMessages((prev) => {
          const idx = vikIndexRef.current
          if (idx === null) return prev
          const next = [...prev]
          next[idx] = { role: 'vik', text: next[idx].text + token }
          return next
        })
      })
    } catch {
      onBackendUnreachable()
      setMessages((prev) => {
        const idx = vikIndexRef.current
        if (idx === null) return prev
        const next = [...prev]
        next[idx] = { role: 'vik', text: OFFLINE_NOTICE }
        return next
      })
    } finally {
      setSending(false)
    }
  }

  const bubbleVik = isNight
    ? 'border border-white/[0.14] bg-black/50 text-parchment/90'
    : 'border border-[color:var(--dawn-card-border)] bg-[color:var(--dawn-card)] text-[color:var(--dawn-text)]'
  const bubbleUser = isNight
    ? 'border border-violet-300/30 bg-violet-500/20 text-parchment/95'
    : 'border border-rose-300/50 bg-rose-100/80 text-[color:var(--dawn-text)]'

  const inputClass = isNight
    ? 'w-full min-w-0 rounded-xl border border-white/12 bg-black/35 px-3.5 py-2.5 text-sm text-parchment/95 outline-none transition placeholder:text-parchment/50 focus:border-violet-400/35 focus:bg-black/45 focus:ring-1 focus:ring-violet-400/20'
    : 'w-full min-w-0 rounded-xl border border-[rgba(236,72,153,0.22)] bg-[color:var(--dawn-input)] px-3.5 py-2.5 text-sm text-[color:var(--dawn-text)] outline-none transition placeholder:text-[color:var(--dawn-muted)] focus:border-rose-400/55 focus:bg-white focus:ring-2 focus:ring-rose-300/35'

  const btnClass = `inline-flex shrink-0 items-center gap-2 rounded-full border px-6 py-2.5 text-[0.62rem] font-medium uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-65 ${
    isNight
      ? 'border-violet-300/45 bg-gradient-to-r from-violet-500/25 via-fuchsia-500/15 to-sky-500/20 text-parchment/95 shadow-[0_0_24px_rgba(139,92,246,0.25)] hover:from-violet-500/35 hover:via-fuchsia-500/22 hover:to-sky-500/28'
      : 'border-rose-300/55 bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50/90 text-[color:var(--dawn-text)] shadow-[0_8px_28px_rgba(244,114,182,0.18)] hover:from-rose-100/95 hover:via-pink-50 hover:to-amber-50'
  }`

  return (
    <FeatureLocked feature="Vik Chat" theme={theme}>
      <div className="flex flex-col gap-3">
        <div ref={listRef} className="max-h-[20rem] space-y-2 overflow-y-auto pr-1 sm:max-h-[24rem]">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user' ? bubbleUser : bubbleVik
                }`}
              >
                {m.text || (sending && i === vikIndexRef.current ? '···' : '')}
              </div>
            </motion.div>
          ))}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Vik about Hrithik's work..."
            disabled={sending}
            className={inputClass}
          />
          <button type="submit" disabled={sending || !input.trim()} className={btnClass}>
            {sending ? 'Sending' : 'Send'}
          </button>
        </form>
      </div>
    </FeatureLocked>
  )
}
