import { classifyIntent } from '../ai/classifier'
import { generateReply } from '../ai/generator'
import { isSafe } from '../ai/safety'
import { saveEmail, saveReply } from '../../db/queries'
import { parseEmail } from '../email/parser'
import { sendEmail } from '../email/sender'

/** Core orchestrator: parse → persist → classify → safety → generate → send or draft. */
export const runReplyPipeline = async (rawEmail: unknown) => {
  const parsed = parseEmail(rawEmail)

  const emailId = await saveEmail(parsed)

  const intent = await classifyIntent(parsed.body)

  const safe = isSafe(parsed.body, intent)

  if (!safe) {
    await saveReply(emailId, {
      status: 'blocked',
      reason: 'unsafe',
    })
    return
  }

  const reply = await generateReply({
    emailBody: parsed.body,
    senderName: parsed.senderName,
    intent,
  })

  await saveReply(emailId, {
    text: reply,
    status: 'generated',
  })

  if (intent === 'generic' || intent === 'follow_up') {
    await sendEmail({
      to: parsed.sender,
      subject: `Re: ${parsed.subject}`,
      text: reply,
    })

    await saveReply(emailId, {
      status: 'sent',
    })
  } else {
    await saveReply(emailId, {
      status: 'draft',
    })
  }
}
