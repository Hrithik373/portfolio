import type { PipelineReply, RawEmail, ReplyRecord } from '../../shared/types'

export type DbData = {
  rawEmails: RawEmail[]
  replies: ReplyRecord[]
  pipelineReplies: PipelineReply[]
}

export const createEmptyDb = (): DbData => ({
  rawEmails: [],
  replies: [],
  pipelineReplies: [],
})

export const normalizeDb = (data: Partial<DbData>): DbData => ({
  rawEmails: data.rawEmails ?? [],
  replies: data.replies ?? [],
  pipelineReplies: data.pipelineReplies ?? [],
})
