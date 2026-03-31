import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

import { createEmptyDb, normalizeDb } from './schema'
import type { DbData } from './schema'
import type {
  ParsedInboundEmail,
  PipelineReplyPatch,
  RawEmail,
  ReplyRecord,
} from '../../shared/types'

const dbFile = path.resolve(process.cwd(), 'backend', 'db', 'data.json')

const loadDb = (): DbData => {
  try {
    if (!fs.existsSync(dbFile)) return createEmptyDb()
    const raw = fs.readFileSync(dbFile, 'utf8')
    return normalizeDb(JSON.parse(raw) as Partial<DbData>)
  } catch {
    return createEmptyDb()
  }
}

const saveDb = (data: DbData) => {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8')
}

export const saveRawEmail = (raw: RawEmail) => {
  const db = loadDb()
  db.rawEmails.push(raw)
  saveDb(db)
  return raw
}

export const appendContactReplyRecord = (reply: ReplyRecord) => {
  const db = loadDb()
  db.replies.push(reply)
  saveDb(db)
  return reply
}

export const listRawEmails = () => loadDb().rawEmails

export const listReplies = () => loadDb().replies

/** Persist parsed inbound mail; returns new raw email id. */
export const savePipelineEmail = (parsed: ParsedInboundEmail): string => {
  const db = loadDb()
  const id = crypto.randomUUID()
  const row: RawEmail = {
    id,
    receivedAt: new Date().toISOString(),
    fromName: parsed.senderName,
    fromEmail: parsed.sender,
    subject: parsed.subject,
    message: parsed.body,
    source: 'inbound',
  }
  db.rawEmails.push(row)
  saveDb(db)
  return id
}

/** Merge state for the pipeline reply row tied to this email id. */
export const upsertPipelineReply = (
  rawEmailId: string,
  patch: PipelineReplyPatch,
) => {
  const db = loadDb()
  const now = new Date().toISOString()
  const idx = db.pipelineReplies.findIndex((r) => r.rawEmailId === rawEmailId)
  if (idx === -1) {
    db.pipelineReplies.push({
      id: crypto.randomUUID(),
      rawEmailId,
      status: patch.status ?? 'draft',
      text: patch.text,
      reason: patch.reason,
      updatedAt: now,
    })
  } else {
    const prev = db.pipelineReplies[idx]
    db.pipelineReplies[idx] = {
      ...prev,
      ...patch,
      updatedAt: now,
    }
  }
  saveDb(db)
}

export const saveEmail = async (parsed: ParsedInboundEmail) =>
  savePipelineEmail(parsed)

export const saveReply = async (
  emailId: string,
  patch: PipelineReplyPatch,
) => {
  upsertPipelineReply(emailId, patch)
}
