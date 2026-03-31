/** One-off: verify Express 5 registers GET+POST on same path. */
import express from 'express'

const app = express()
app.get('/api/voice-note', (_req, res) => res.json({ which: 'voice get' }))
app.get('/api/transcribe-preview', (_req, res) => res.json({ which: 'tp get' }))
app.post('/api/transcribe-preview', express.raw({ type: '*/*', limit: '1mb' }), (_req, res) =>
  res.json({ which: 'tp post' }),
)

const port = 8799
app.listen(port, () => {
  console.log(`minimal test on ${port}`)
})
