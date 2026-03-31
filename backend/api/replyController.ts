import type { Request, Response } from 'express'

import { enqueue } from '../queue/jobQueue'
import { runReplyPipeline } from '../services/pipeline/replyPipeline'

/**
 * Manual / admin triggers: e.g. re-run pipeline or send a drafted reply.
 * Extend with auth + validation before production use.
 */
export const replyController = async (req: Request, res: Response) => {
  const action = typeof req.body?.action === 'string' ? req.body.action : ''

  if (action === 'rerun' && req.body?.rawEmail !== undefined) {
    enqueue(() => runReplyPipeline(req.body.rawEmail))
    res.status(202).json({ ok: true, queued: true })
    return
  }

  res.status(400).json({
    ok: false,
    message: 'Expected { action: "rerun", rawEmail: <payload> }',
  })
}
