export const backendConfig = {
  port: Number(process.env.PORT || 8787),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || 'llama3-8b-8192',
} as const
