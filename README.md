
All rights reserved. No part of this project may be used or reproduced without explicit written permission from Hrithik Ghosh @2026


# Hrithik Ghosh — Portfolio

**Live:** [hrithikghosh.vercel.app](https://hrithikghosh.vercel.app)

> Personal portfolio of Hrithik Ghosh — AI & ML Engineer specialising in RAG pipelines, multilingual voice interfaces, and production-grade backend systems.

---

## Features

### Desktop View
- **Hero** — Full-screen landing with Japanese typography, profile photo, animated audio ornament, and CTA buttons (View Work, Career Timeline, Résumé PDF)
- **Voice Note** — Visitors can leave a voice recording + typed note; delivered securely to Hrithik with an AI-trained handwritten-style reply
- **About / Skills / Projects / Experience / Blog / Contact** — Full scrollable sections with GSAP ScrollTrigger entrance animations
- **Night / Day mode** — Toggle between dark ink and warm dawn themes
- **Sound toggle** — Ambient audio on/off
- **Cookie & Privacy banner** — First-visit consent with 12-hour auto-purge of collected data

### Mobile View
- **Responsive hero** — Optimised layout with touch-friendly CTA buttons
- **Music Player** — Floating pill widget (top-left) with YouTube embed; collapses without stopping playback; Android lock-screen Media Session controls
- **Voice Note card** — Cookie-gated voice recording feature
- **Contact form** — Always accessible (no cookie gate) so recruiters can reach out freely
- **Program Enquiry** — Cookie-gated
- **Social links** — Email, phone, LinkedIn, GitHub — always accessible
- **Bottom nav** — Fixed navigation bar for quick section jumping
- **Cookie settings** — Accessible from footer; floating "Features limited" FAB when cookies declined

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Framer Motion + GSAP |
| Backend | Node.js + Express (Render) |
| Persistence | Upstash Redis |
| Deployment | Vercel (frontend) + Render (backend) |
| Security | IP + device fingerprint collection (security only, auto-purged every 12h) |

---

## Architecture

```
├── src/
│   ├── pages/
│   │   ├── DesktopPortfolio.tsx     # Full desktop layout
│   │   └── MobilePortfolio.tsx      # Mobile-optimised layout
│   ├── components/features/
│   │   ├── SpotifyWidget/           # YouTube music player (pill + embed)
│   │   ├── CookieBanner/            # Consent banner + FeatureLocked gate
│   │   ├── sections/                # Hero, About, Skills, Projects, etc.
│   │   └── ...
│   ├── context/
│   │   └── CookieConsentContext.tsx # Global consent state
│   └── lib/
│       ├── visitor-tracker.ts       # IP/device tracking (consent-gated)
│       └── cookie-consent.ts        # Versioned localStorage consent
├── backend/
│   ├── server.ts                    # Express API + 12h purge scheduler
│   ├── services/                    # Music + email services
│   └── redis-store.ts              # Upstash Redis dual-write
└── vercel.json                      # CSP headers + cache rules
```

---

## Privacy & Data

- Collects **IP address and device fingerprint** strictly for security (spam/abuse prevention)
- **Auto-deleted every 12 hours** via scheduled backend purge
- No advertising. No analytics. No third-party data sharing.
- IP collection is lawful under applicable Indian regulations
- Users can **decline cookies** — all tracking is skipped, features limited accordingly

---

## Copyright & Legal Notice

**Copyright © 2026 Hrithik Ghosh. All Rights Reserved.**

This repository and all of its contents — including but not limited to source code, design, graphics, animations, text, layout, structure, and any other creative or technical elements — are the exclusive intellectual property of **Hrithik Ghosh**.

### Restrictions

Unauthorized use, reproduction, modification, distribution, transmission, republication, display, or performance of any material from this repository is **strictly prohibited** without the express prior written permission of the copyright holder.

You may **not**:
- Copy, clone, or fork this repository for personal or commercial use
- Use any part of this codebase as a template or starting point for another project
- Reproduce the design, UI, or visual identity in any form
- Use the content, copy, or personal information contained herein for any purpose
- Redistribute or sublicense any part of this work

### Contact

For licensing inquiries or permissions: **hrithikgh29@gmail.com**

---

*All rights reserved. No part of this project may be used or reproduced without explicit written permission from Hrithik Ghosh.*
