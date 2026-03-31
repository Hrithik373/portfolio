import type { EmailIntent } from '../../../shared/types'

export const classifyIntent = async (body: string): Promise<EmailIntent> => {
  const t = body.toLowerCase()

  if (
    /\b(offer letter|job offer|compensation package|base salary|equity|start date)\b/.test(
      t,
    )
  ) {
    return 'offer'
  }
  if (
    /\b(interview|phone screen|video call|zoom|teams meet|calendar invite|schedule (a |an )?(call|meeting))\b/.test(
      t,
    )
  ) {
    return 'interview'
  }
  if (
    /\b(follow(?:\s*[- ]?up)?|checking in|circling back|any update)\b/.test(t)
  ) {
    return 'follow_up'
  }

  return 'generic'
}
