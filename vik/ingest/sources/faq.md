# FAQ — things recruiters actually ask

## Sponsorship, visa, notice period, relocation

<!-- NEEDS INPUT FROM HRITHIK: none of this exists anywhere on the site or in the PDF
résumé. Until these fields are filled in, Vik must NOT guess or assert an answer — it
should say something like "I don't have Hrithik's current sponsorship/visa/notice-period
details confirmed yet — want me to flag this question to him directly?" and (if the
lead-capture tool is available) offer to capture the visitor as a lead so Hrithik can
follow up personally. Fields to fill in once known:
  - Current location / base country
  - Visa / sponsorship needs (e.g. Germany Blue Card, NL Highly Skilled Migrant, UK
    Skilled Worker, Ireland Critical Skills Permit, or none needed)
  - Notice period at current role (ITU)
  - Remote / hybrid / relocation preferences
-->

## Is Hrithik open to new roles?

The site's tagline: "Seeking AI/ML roles building calm, reliable systems that blend
strong backend foundations with responsible AI delivery." Beyond that, defer to the
sponsorship/notice-period gap above — don't imply active vs. passive job search status
without confirmation.

## How can I reach him?

- Email: hrithikgh29@gmail.com
- LinkedIn: https://www.linkedin.com/in/hrithikgh29
- GitHub: https://github.com/Hrithik373
- The portfolio's contact form (always accessible, no cookie gate required, per the
  site's mobile UX) is the most direct route for a recruiter message.

## Does Hrithik have production Kubernetes / cloud experience?

Point to the concrete, real examples: RAG/AI infrastructure work at ITU (semantic
caching, multi-path retrieval, cache invalidation tied to KB versioning — production
systems, not toy demos), and separately, Vik itself (this very agent) is built and
deployed as a containerized microservices system with Kubernetes/Helm in the repo.
Be honest that Vik's full Kubernetes deployment is a self-hosted showcase (k3s /
single-node), not an enterprise EKS deployment — see the architecture doc's own
honesty note about cost-conscious hosting tiers.

## What is "Vik"?

Vik is Hrithik's AI agent, embedded on this portfolio, that answers questions about his
career grounded in his real experience, projects, and skills — the very agent
answering this question right now. The site had already publicly teased Vik (see the
"Vik AI agent" flagship card on the Journal/Blog section) before it was built, describing
it as "a personal research-and-action agent: grounded retrieval, careful tool use, and
human-readable traces."

## About the "assistant beta" waitlist

The site's Contact section already has a waitlist ("A dedicated auto-replying assistant
will ship on this portfolio later. If you would like to test it when it goes live, join
the waitlist.") — that assistant is Vik. If a visitor asks how to try it early or give
feedback, point them to that waitlist / the contact form.

## Can I see his other work?

Yes — GitHub (https://github.com/Hrithik373) has his public repos, several of which are
described in `ingest/sources/projects/*.md` and mirrored in `ingest/sources/github/*.md`.
The résumé PDF is downloadable directly from the portfolio site.
