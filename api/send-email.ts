import { sendEmailHandler } from '../backend/handlers/sendEmailHandler'

export default async function handler(req: any, res: any) {
  return sendEmailHandler(req, res)
}
