import { createTransporter } from './smtp'

export const sendEmail = async (opts: {
  to: string
  subject: string
  text: string
}) => {
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  if (!smtpUser || !smtpPass) {
    throw new Error('Email service not configured.')
  }

  const transporter = createTransporter(smtpUser, smtpPass)
  await transporter.sendMail({
    from: `Portfolio <${smtpUser}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
  })
}
