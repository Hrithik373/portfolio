# Hrithik Ghosh — Résumé

> Source of truth: primarily `src/components/features/sections/Experience/Experience.tsx`
> and `src/components/features/sections/About/About.tsx` (the live, current site copy),
> cross-checked against `public/hrithikgh_resume.pdf`. Where the two disagree, the
> conflict is flagged inline with `NEEDS REVIEW` rather than silently picking one —
> Vik should hedge on any such field until Hrithik resolves it.

## Summary

Software Engineer with 4+ years of experience in backend systems, scalable product
engineering, and AI-driven solution development. Background spans Java, Spring Boot,
databases, and system design, with prior industry experience at Amdocs delivering
performance optimization, API development, testing automation, and reliability
improvements in production environments.

More recently, through work with ITU, expanded into applied AI and healthcare-focused
intelligent systems, contributing to the design and development of multilingual,
clinically aware AI platforms. Experience includes architecting Retrieval-Augmented
Generation pipelines, semantic caching strategies, multimodal voice-and-text systems,
frontend interfaces, and evaluation-oriented AI workflows for real-world public health
use cases.

Currently pursuing a Master's degree in AI & Data Science.

## Experience

### International Telecommunication Union (ITU) — Geneva, Switzerland
**Backend Dev & AI Full Stack Engineer (LLM & Voice Module)**
03/2026 — Present

- Conducted an end-to-end architectural review of the Genie AI NCD Healthcare pipeline
  and re-engineered the semantic cache intercept point post-guardrail, eliminating
  redundant LLM inference on cache hits and significantly reducing API token costs and
  response latency.
- Created a clinical query classification gate to route safety-critical NCD queries via
  the full RAG pipeline. Directed general queries using cosine similarity (≥0.95
  clinical, ≥0.85 general), avoiding incorrect cached responses for distinct but similar
  queries.
- Developed a multi-path retrieval pipeline integrating vector search, sparse indexing,
  Knowledge Graph traversal, keyword search, filtering, and a re-ranker to deliver
  contextually accurate, guideline-based answers on cache misses.
- Architected a validated cache store-back mechanism that persists only
  guardrail-approved LLM responses paired with query embeddings, enabling progressive
  cache warming while guaranteeing clinically safe responses are served on future cache
  hits.
- Defined a TTL-based cache invalidation strategy linked to knowledge base versioning,
  automatically purging cached clinical responses when source documents or medical
  guidelines are updated.
- Integrated a multilingual voice-text I/O system: connected STT transcription, TTS
  synthesis, and machine translation layers, ensuring consistent cache behavior across
  input languages.
- Designed and developed the AMINA Care frontend interface, implementing voice and text
  input/output components, a session-aware chat UI, and an interactive pipeline
  visualisation layer to support both end users and internal team workflows.
- Produced system architecture documentation, redesigned pipeline diagrams, and
  authored full team onboarding materials covering server SSH access, GitLab PAT setup,
  branch configuration, and daily Git workflow.

<!-- NEEDS REVIEW: this role has no end date on the site (implying ongoing); the PDF
resume also lists only "03/2026" with no end date. Not a conflict, just flagging that
Vik should describe this as Hrithik's current role. -->

### Amdocs — Pune, India
**Software Engineer**
<!-- NEEDS REVIEW: site says 06/2021 – 10/2022; PDF résumé says 06/2021 – 10/2023.
A one-year discrepancy. Vik should say "roughly 2021 to 2022/2023" and defer exact
end date to Hrithik rather than assert either date confidently. -->

- Developed and maintained Amdocs products (CRM, OMS) with Java and Spring, achieving a
  20% boost in application performance.
- Executed thorough testing for online/offline events and billing, ensuring a 95%
  accuracy rate in functionality.
- Conducted API testing and debugging for Java and REST APIs, decreasing bug
  resolution time by 30%.
- Streamlined development processes by leveraging technologies like Ginger, JSON, and
  CI/CD pipelines, enhancing team efficiency.
- Helped with frontend development using REST API and React JS.
- Automated testing processes with Ginger and Selenium, resulting in a 40% reduction in
  manual testing time.

### West Bengal Youth Computer Center (Jagacha) — Kolkata, India
**Software Engineer**
<!-- NEEDS REVIEW: site says 01/2023 – 06/2025; PDF résumé says just "06/2025 - 06/2025"
(a single month). Large discrepancy — possibly a part-time/volunteer role stated
differently in each source. Vik should describe this vaguely ("a role at a Kolkata-based
youth computer center") and avoid committing to a specific duration until Hrithik
confirms. -->

- Worked on front-end web development for the HP exam integration system, connecting it
  to the youth center's exam system.
- Designed workflow and CI/CD integrations with Jira.
- Worked with SQL to merge student datasets with billing entities.
- Worked with students and professionals in mentorship programs.

## Education

> Only present in the PDF résumé (`public/hrithikgh_resume.pdf`), not in the site's
> React source — the site only says "pursuing a Master's degree in AI & Data Science."

- **KIIT Institute of Technology (KIIT)**, Bhubaneshwar, India — Master's in Technology,
  2025–Ongoing. Specialization: AI & Data Science. SGPA 8.34.
- **Maulana Abul Kalam Azad University of Technology, West Bengal** (formerly WBUT),
  Kolkata, India — Bachelor's in Technology, 2017–2021. Specialization: Computer
  Science & Engineering. CGPA 7.92.

## Skills

**Languages**: Python, TypeScript, JavaScript (beginner), Java (beginner), ReactJS,
Vue.js, Three.js, CSS

**APIs & Tools**: FastAPI, REST API, GraphQL, Postman

**ML & Data Science**: NumPy, Pandas, Matplotlib, Seaborn, Scikit-learn, XGBoost,
LightGBM

**Deep Learning**: TensorFlow, Transformers (BERT-family), CNN, OpenCV (beginner)

**LLM & Voice**: OpenAI, Mistral, Google Flan, Whisper STT, Coqui TTS, Piper TTS

**Architecture & Infra**: RAG, Haystack, OPEA (only the existing/pre-built part —
not deep OPEA expertise), HayHooks, Kong, Docker, Kubernetes

**Vector / Graph Databases**: ArcadeDB, ArangoDB (only existing integration
experience, not from-scratch admin expertise)

**Databases & Deploy**: SQL, MongoDB, Streamlit, Google Colab, Jupyter, VS Code

**Languages spoken**: English (Proficient), Hindi (Advanced), Bengali (Native)

## Certifications

- The Complete Python Course — Udemy (2025)
- Deep Learning Certification — Kaggle
- Machine Learning Certification — Kaggle

## Contact

- Email: hrithikgh29@gmail.com
- GitHub: https://github.com/Hrithik373
- LinkedIn: https://www.linkedin.com/in/hrithikgh29
  <!-- NEEDS REVIEW: the PDF résumé header lists a different LinkedIn URL
  (linkedin.com/in/hrithik-ghosh-340ba4153) — likely the same profile via a vanity vs.
  auto-generated slug, but unconfirmed. Vik should give the site's URL as canonical. -->
- Tagline: "Seeking AI/ML roles building calm, reliable systems that blend strong
  backend foundations with responsible AI delivery."
