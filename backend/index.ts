import type { Express } from 'express'

import { emailWebhook } from './api/emailWebhook'
import { replyController } from './api/replyController'

/** Register inbound pipeline HTTP routes on an existing Express app. */
export const registerPipelineRoutes = (app: Express) => {
  app.post('/api/webhooks/email', (req, res) => void emailWebhook(req, res))
  app.post('/api/replies', (req, res) => void replyController(req, res))
}

export { runReplyPipeline } from './services/pipeline/replyPipeline'
export { enqueue } from './queue/jobQueue'
export { startEmailListener } from './services/email/listener'
export { backendConfig } from './config/index'
