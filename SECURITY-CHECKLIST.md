# Security Pipeline — Pre-Deploy Checklist

## File Placement

```
project-root/
├── vercel.json                    ← Vercel headers + rewrites
├── middleware.ts                  ← Vercel Edge Middleware (rate limit, bot block)
├── render.yaml                   ← Render service blueprint
├── .env.example                  ← Template (committed)
├── .env                           ← Actual secrets (NEVER committed)
├── .gitignore                     ← Must include .env entries
│
├── server/
│   ├── security.ts                ← Express security middleware stack
│   ├── sanitize.ts                ← Input validation + honeypot
│   └── ai-security.ts            ← Anthropic API proxy + prompt injection defense
│
└── src/
    └── components/features/
        └── ... (your existing frontend)
```

## Pre-Deploy Checklist

### Secrets
- [ ] `.env` is in `.gitignore`
- [ ] No API keys in any committed file (search: `sk-`, `SG.`, `re_`, `API_KEY`)
- [ ] `ANTHROPIC_API_KEY` is set in Render dashboard, not in code
- [ ] `RESEND_API_KEY` / `SENDGRID_API_KEY` is set in Render dashboard
- [ ] Run: `git log --all -p | grep -i "api_key\|secret\|password"` — should find nothing

### Vercel (Frontend)
- [ ] `vercel.json` deployed with security headers
- [ ] `middleware.ts` deployed (rate limiting + bot blocking)
- [ ] CSP header updated with your actual domain
- [ ] API rewrites point to your Render URL
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel environment variables

### Render (Backend)
- [ ] `render.yaml` deployed
- [ ] `applySecurity(app)` called in your Express entry point
- [ ] `rejectHoneypot` middleware applied to email/newsletter routes
- [ ] `sanitizeContactInput` / `sanitizeNewsletterInput` used before processing
- [ ] CORS origins updated to your actual domain
- [ ] Health check endpoint `/api/health` responds 200

### AI Endpoint
- [ ] `aiRouter` mounted at `/api/ai`
- [ ] Frontend calls `/api/ai/chat` — NEVER calls Anthropic directly
- [ ] `MAX_TOKENS` and `MONTHLY_BUDGET` set to reasonable limits
- [ ] System prompt is hardcoded server-side
- [ ] Prompt injection patterns block common attacks

### Dependencies
- [ ] Run `npm audit` — fix critical/high issues
- [ ] Run `npm audit fix` or update vulnerable packages
- [ ] Lock file (`package-lock.json`) is committed

### DNS / SSL
- [ ] HTTPS enforced (HSTS header set)
- [ ] Consider Cloudflare free tier in front of your domain for:
  - Automatic SSL
  - DDoS protection
  - Bot filtering
  - Edge caching
  - "Under Attack Mode" toggle

### Monitoring (free tools)
- [ ] UptimeRobot — ping Render health endpoint every 14 min (keeps free tier warm)
- [ ] Vercel Analytics — monitor traffic patterns
- [ ] Set up email alerts for Render deploy failures

## Architecture Diagram

```
User's Browser
     │
     ▼
┌─────────────┐
│   Vercel     │  ← Static React app + Edge Middleware
│  (Frontend)  │     • Security headers (CSP, HSTS, etc.)
│              │     • Rate limiting (IP-based)
│              │     • Bot/scanner blocking
│              │     • Suspicious path blocking
└──────┬──────┘
       │ /api/* rewrites
       ▼
┌─────────────┐
│   Render     │  ← Express API server
│  (Backend)   │     • Helmet (15 security headers)
│              │     • CORS (origin whitelist)
│              │     • Rate limiting (global + per-endpoint)
│              │     • Speed limiting (progressive delay)
│              │     • Input sanitization (HTML strip, length, spam)
│              │     • Honeypot bot trap
│              │     • IP blocklist
│              │     • Bot user-agent blocking
│              │     • Request logging
│              │
│  /api/send-email  ← sanitizeContactInput + rejectHoneypot
│  /api/newsletter  ← sanitizeNewsletterInput + rejectHoneypot
│  /api/ai/chat     ← AI proxy (prompt injection defense,
│              │       token budget, response sanitization,
│              │       API key hidden server-side)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Anthropic   │  ← Only the server talks to this
│   Claude API │     API key NEVER reaches the browser
└─────────────┘
```

## Quick Hardening Commands

```bash
# Check for leaked secrets in git history
git log --all -p | grep -iE "sk-|api_key|password|secret" | head -20

# Audit dependencies
npm audit

# Fix auto-fixable vulnerabilities
npm audit fix

# Check .env isn't tracked
git ls-files | grep -i env

# Test security headers (after deploy)
curl -I https://yourdomain.com | grep -iE "x-frame|x-content|strict-transport|content-security"

# Test rate limiting
for i in {1..15}; do curl -s -o /dev/null -w "%{http_code}\n" https://yourdomain.com/api/health; done
```
