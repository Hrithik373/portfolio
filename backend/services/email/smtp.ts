import nodemailer from 'nodemailer'

export const createTransporter = (smtpUser: string, smtpPass: string) =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })
