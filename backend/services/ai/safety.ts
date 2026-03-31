import type { EmailIntent } from '../../../shared/types'

const promptInjection = [
  /ignore (all|any|previous) (instructions|prompts)/i,
  /\b(system|assistant)\s*:\s*/i,
  /\[INST\]/i,
]

export const isSafe = (body: string, _intent: EmailIntent): boolean => {
  void _intent
  if (body.length > 50_000) return false
  if (/<script[\s>]/i.test(body)) return false
  return !promptInjection.some((re) => re.test(body))
}
