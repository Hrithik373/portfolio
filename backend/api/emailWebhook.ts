import type { Request, Response } from 'express'

import { enqueue } from '../queue/jobQueue'
import { runReplyPipeline } from '../services/pipeline/replyPipeline'

/** Receives raw inbound payloads (Resend, SendGrid, etc.) and queues processing. */
export const emailWebhook = async (req: Request, res: Response) => {
  enqueue(() => runReplyPipeline(req.body))
  res.status(202).json({ ok: true, queued: true })
}
