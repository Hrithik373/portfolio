export type RawEmail = {
  id: string
  receivedAt: string
  fromName: string
  fromEmail: string
  subject: string
  message: string
  source: 'contact-form' | 'webhook' | 'inbound'
}

export type EmailIntent =
  | 'generic'
  | 'follow_up'
  | 'interview'
  | 'offer'

/** Normalized shape after parsing an inbound payload (webhook, etc.). */
export type ParsedInboundEmail = {
  body: string
  senderName: string
  sender: string
  subject: string
}

export type PipelineReplyStatus = 'blocked' | 'generated' | 'sent' | 'draft'

export type PipelineReply = {
  id: string
  rawEmailId: string
  status: PipelineReplyStatus
  text?: string
  reason?: string
  updatedAt: string
}

export type ParsedEmail = {
  id: string
  fromName: string
  fromEmail: string
  subject: string
  message: string
}

export type ReplyRecord = {
  id: string
  rawEmailId: string
  instanceId: string
  petalName: string
  petalColor: string
  subject: string
  body: string
  createdAt: string
  status: 'draft' | 'sent'
}

export type PipelineReplyPatch = Partial<
  Pick<PipelineReply, 'status' | 'text' | 'reason'>
>

export type QueueJob = {
  id: string
  rawEmailId: string
  instanceId: string
}
