# Security Pipeline — Corrected Placement Guide
# Matches your actual monorepo: src/ (Vite React) + backend/ (Express)

## File Placement Map

| Downloaded File            | Save To                                          | Notes                                |
|----------------------------|--------------------------------------------------|--------------------------------------|
| `server-security.ts`      | `backend/security.ts`                            | Rename on save                       |
| `sanitize.ts`             | `backend/sanitize.ts`                            | As-is                                |
| `ai-security.ts`          | `backend/ai-security.ts`                         | As-is                                |
| `abuse-tracker.ts`        | `backend/abuse-tracker.ts`                       | As-is                                |
| `vercel.json`             | `vercel.json` (project root)                     | Replace if exists                    |
| `render.yaml`             | `render.yaml` (project root)                     | New file                             |
| `.env.example`            | `.env.example` (project root)                    | Merge with your existing one         |
| `.gitignore-additions`    | Append to existing `.gitignore`                  | Don't replace — append               |
| `SECURITY-CHECKLIST.md`   | `SECURITY-CHECKLIST.md` (project root)           | Optional reference                   |
| `honeypot-snippet.tsx`    | Paste JSX into form components                   | Not a separate file                  |
| `server-index.ts`         | **DON'T USE** — wire into existing backend/server.ts | See below                       |
| `middleware.ts`           | **DON'T USE** — this is for Next.js only         | Your app is Vite, skip this          |

---

## ⚠️  You Already Have backend/server.ts — Don't Create server/

### 4 new files go into backend/:

```
backend/security.ts          ★ from: server-security.ts (rename!)
backend/sanitize.ts          ★ from: sanitize.ts
backend/ai-security.ts      ★ from: ai-security.ts
backend/abuse-tracker.ts    ★ from: abuse-tracker.ts
```

### 3 new files go at project root:

```
vercel.json                  ★ security headers + rewrites
render.yaml                  ★ Render blueprint
SECURITY-CHECKLIST.md        ★ optional reference
```

### Merge into existing files:

```
.env.example                 merge new vars into yours
.gitignore                   append security rules
backend/server.ts            add security imports (see below)
```

---

## Complete Final Tree (★ = new)

```
D:\hrithikghportfolio\
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig*.json
├── vercel.json                      ★
├── render.yaml                      ★
├── SECURITY-CHECKLIST.md            ★
├── .env.example                       (merge new vars)
├── .env                               (add ABUSE_ADMIN_PASSWORD)
├── .gitignore                         (append security rules)
│
├── src/
│   ├── main.tsx, App.tsx
│   ├── config/apiBase.ts, adminBypass.ts
│   ├── hooks/
│   ├── pages/
│   │   ├── DesktopPortfolio.tsx
│   │   └── MobilePortfolio.tsx
│   └── components/features/
│       ├── petals/
│       │   ├── FloatingCardPetals.tsx
│       │   ├── VoiceCardPetals.tsx   ★ (from earlier session)
│       │   ├── SakuraCanvas.tsx
│       │   ├── SakuraPetals.css
│       │   └── SakuraPetals.tsx
│       ├── sections/
│       │   ├── Hero/
│       │   ├── BlogPost/
│       │   ├── Contact/
│       │   └── sectionGlass.ts
│       ├── navigation/
│       ├── loader/Loader.tsx
│       └── backgrounds/
│
├── backend/
│   ├── server.ts                      ✏️ EDIT (add security imports)
│   ├── index.ts                       (existing)
│   ├── security.ts                  ★ NEW
│   ├── sanitize.ts                  ★ NEW
│   ├── ai-security.ts              ★ NEW
│   ├── abuse-tracker.ts            ★ NEW
│   ├── handlers/
│   │   ├── sendEmailHandler.ts        ✏️ EDIT (add abuseTracker)
│   │   ├── voiceNoteHandler.ts
│   │   └── transcribePreviewHandler.ts
│   ├── services/
│   ├── api/
│   ├── config/
│   ├── data/                          (abuse-log.json auto-created here)
│   └── ...
│
└── dist/                              (gitignored)
```

---

## Wiring Into backend/server.ts

Add at the top with your other imports:

```ts
import { applySecurity } from './security'
import { abuseTracker, abuseAdminRouter } from './abuse-tracker'
import { rejectHoneypot } from './sanitize'
```

After creating your Express app, BEFORE routes:

```ts
// Replace your manual cors() and express.json() — applySecurity handles both
applySecurity(app)
```

On your email route (find existing line and add middleware):

```ts
// Before:
app.post('/api/send-email', sendEmailHandler)
// After:
app.post('/api/send-email', abuseTracker, rejectHoneypot, sendEmailHandler)
```

Mount admin dashboard:

```ts
app.use('/api/admin', abuseAdminRouter)
```

---

## New .env Variables to Add

```bash
ABUSE_ADMIN_PASSWORD=pick-a-strong-password-here
# Only if using AI proxy:
# ANTHROPIC_API_KEY=sk-ant-xxxxx
```

---

## Install

```bash
npm install helmet express-rate-limit express-slow-down hpp
npm install -D @types/hpp
```

---

## Honeypot — Paste Into 3 Forms

Contact form, BlogPost newsletter form, MobileContactForm:

```tsx
<div className="absolute -left-[9999px] -top-[9999px]" aria-hidden="true">
  <label htmlFor="website">Website</label>
  <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
</div>
```
