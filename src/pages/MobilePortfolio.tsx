import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useScrollReveal } from '../hooks/useScrollAnimation'
import { trackVisitor } from '../lib/visitor-tracker'

import { apiUrl } from '../config/apiBase'
import { MidnightScrollBackground } from '../components/features/backgrounds/MidnightScrollBackground'
import { SakuraCanvas } from '../components/features/petals/SakuraCanvas'
import { BlogPost } from '../components/features/sections/BlogPost/BlogPost'
import { ContactProgramCards } from '../components/features/sections/Contact/ContactProgramCards'
import { SectionSakuraRain } from '../components/features/petals/FloatingCardPetals'
import { VoiceCardPetals } from '../components/features/petals/VoiceCardPetals'
import { HeroAudioOrnament } from '../components/features/sections/Hero/HeroAudioOrnament'
import { HeroVoiceNoteCard } from '../components/features/sections/Hero/HeroVoiceNoteCard'
import { dayGlassSection, dayMobileSectionShell, nightGlassSection, nightMobileSectionShell } from '../components/features/sections/sectionGlass'
import { collectFingerprint } from '../lib/fingerprint'
import { SpotifyMiniPlayer } from '../components/features/SpotifyWidget/SpotifyMiniPlayer'
import { FeatureLocked } from '../components/features/CookieBanner/FeatureLocked'
import { useCookieConsent } from '../context/CookieConsentContext'


const sections = [
  { id: 'm-hero', label: 'Home', icon: homeIcon },
  { id: 'm-about', label: 'About', icon: userIcon },
  { id: 'm-skills', label: 'Skills', icon: codeIcon },
  { id: 'm-projects', label: 'Work', icon: folderIcon },
  { id: 'm-experience', label: 'Path', icon: briefcaseIcon },
  { id: 'm-blogpost', label: 'Blog', icon: blogIcon },
  { id: 'm-contact', label: 'Contact', icon: mailIcon },
]

function homeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5"><path d="M3 12l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 10v9a1 1 0 001 1h3v-5h6v5h3a1 1 0 001-1v-9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function userIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" /></svg>
}
function codeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function folderIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function briefcaseIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5"><rect x="3" y="7" width="18" height="12" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" /></svg>
}
function mailIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function blogIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5"><path d="M4 19.5a2.5 2.5 0 0 1 2.5-2.5H20" strokeLinecap="round" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 7h8M8 11h6" strokeLinecap="round" /></svg>
}

const ease = [0.22, 1, 0.36, 1] as const

const skillGroups = [
  { title: 'Languages', icon: '{ }', items: ['Python', 'TypeScript', 'JavaScript', 'Java', 'ReactJS', 'Vue.js', 'Three.js', 'CSS'] },
  { title: 'APIs & Tools', icon: '⚡', items: ['FastAPI', 'REST API', 'GraphQL', 'Postman'] },
  { title: 'ML & Data Science', icon: '📊', items: ['NumPy', 'Pandas', 'Matplotlib', 'Seaborn', 'Scikit-learn', 'XGBoost', 'LightGBM'] },
  { title: 'Deep Learning', icon: '🧠', items: ['TensorFlow', 'Transformers (BERTs)', 'CNN', 'OpenCV'] },
  { title: 'LLM & Voice', icon: '🗣️', items: ['OpenAI', 'Mistral', 'Google Flan', 'Whisper STT', 'CoquiTTS', 'Piper TTS'] },
  { title: 'Architecture & Infra', icon: '🏗️', items: ['RAG', 'Haystack', 'OPEA', 'HayHooks', 'Kong', 'Docker', 'Kubernetes'] },
  { title: 'Vector DBs', icon: '🔍', items: ['ArcadeDB', 'ArangoDB'] },
  { title: 'Databases & Deploy', icon: '🚀', items: ['SQL', 'MongoDB', 'Streamlit', 'Google Colab', 'Jupyter'] },
]

const certifications = [
  { title: 'The Complete Python Course', issuer: 'Udemy', badge: 'Certified 2025' },
  { title: 'Deep Learning Certification', issuer: 'Kaggle', badge: 'Kaggle Certified' },
  { title: 'Machine Learning Certification', issuer: 'Kaggle', badge: 'Kaggle Certified' },
]

const projects = [
  { title: 'Agentic RAG Evaluator', role: 'RAG pipeline & evaluation', description: 'Production-ready RAG system with PDF ingestion, vector indexing, and LLM-as-Judge scoring.', stack: ['LangChain', 'FAISS', 'OpenAI', 'Streamlit'], github: 'https://github.com/Hrithik373/ARAassistant', live: 'https://araassistant-ky7xiosunekrfmu427tt2f.streamlit.app/' },
  { title: 'SMS Spam Detection Engine', role: 'ML classification', description: 'Text classification pipeline with TF-IDF, SMOTE balancing, and tuned models (SVM, XGBoost).', stack: ['Python', 'scikit-learn', 'NLTK', 'XGBoost'], github: 'https://github.com/Hrithik373/sms-spam-detection', live: 'https://sms-spam-detection-uxuz5fe9icdlakvxvnvccy.streamlit.app/' },
  { title: 'Retail Sales Forecasting', role: 'Time-series forecasting', description: 'Forecasting pipeline with feature engineering, ARIMA/LSTM models, and production metrics.', stack: ['Pandas', 'TensorFlow', 'XGBoost', 'ARIMA'], github: 'https://github.com/Hrithik373/Retail-Prediction-model', live: 'https://retaildashboard005.streamlit.app/' },
  { title: 'LLM QA Bot', role: 'Conversational AI', description: 'Chatbot powered by OpenAI and Google Flan models via LangChain with a Streamlit dashboard.', stack: ['LangChain', 'OpenAI', 'HuggingFace', 'Streamlit'], github: 'https://github.com/Hrithik373/LLM_QABot' },
  { title: 'Emotion Detection Model', role: 'Deep learning & NLP', description: 'Emotion classification model for text data using deep learning to detect sentiment and emotional states.', stack: ['Python', 'TensorFlow', 'NLP', 'Deep Learning'], github: 'https://github.com/Hrithik373/Emotion-Detection-Model' },
  { title: 'Sentiment Analyzer', role: 'NLP analysis', description: 'Sentiment analysis demo classifying text polarity using NLP pipelines and notebook-driven experimentation.', stack: ['Python', 'NLTK', 'Jupyter', 'scikit-learn'], github: 'https://github.com/Hrithik373/SentimentAnalyzerDemo' },
]

const experience = [
  { period: '03/2026 — Present', place: 'International Telecommunication Union', location: 'Geneva, Switzerland', role: 'Backend Dev & AI Full Stack Engineer (LLM & Voice Module)', bullets: ['Re-engineered the Genie AI NCD Healthcare semantic cache intercept point post-guardrail, eliminating redundant LLM inference on cache hits and reducing API token costs and latency.', 'Created a clinical query classification gate routing safety-critical NCD queries via the full RAG pipeline using cosine similarity (≥0.95 clinical, ≥0.85 general).', 'Developed a multi-path retrieval pipeline integrating vector search, sparse indexing, Knowledge Graph traversal, keyword search, and Re-Ranker for guideline-based answers.', 'Architectured a validated cache store-back mechanism persisting only guardrail-approved LLM responses with query embeddings for progressive cache warming.', 'Defined a TTL-based cache invalidation strategy linked to knowledge base versioning, auto-purging cached responses when medical guidelines update.', 'Integrated a multilingual voice-text I/O system connecting STT, TTS, and Machine Translation layers with consistent cache behavior across languages.', 'Designed the Amina Care frontend with voice/text I/O, session-aware chat UI, and interactive pipeline visualisation.', 'Produced system architecture documentation, pipeline diagrams, and full team onboarding materials.'] },
  { period: '06/2021 — 10/2022', place: 'Amdocs', location: 'Pune, India', role: 'Software Engineer', bullets: ['Developed and maintained CRM/OMS products with Java and Spring, achieving a 20% performance boost.', 'Executed testing for online/offline events and billing, ensuring 95% accuracy rate.', 'Conducted API testing and debugging for Java and REST APIs, decreasing bug resolution time by 30%.', 'Streamlined development with Ginger, JSON, and CI/CD pipelines, enhancing team efficiency.', 'Contributed to frontend development with REST API and React JS.', 'Automated testing with Ginger and Selenium, reducing manual testing time by 40%.'] },
  { period: '01/2023 — 06/2025', place: 'West Bengal Youth Computer Center (Jagacha)', location: 'Kolkata, India', role: 'Software Engineer', bullets: ['Worked on front-end web development with the HP exam integration system.', 'Designed workflow and CI/CD integrations with Jira.', 'Worked with SQL to merge student datasets with billing entities.', 'Mentored students and professionals through mentorship programs.'] },
]

function mixLin(a: number, b: number, t: number) { return a + (b - a) * t }

function buildDawnStyleVars(dawn: number): Record<string, string> {
  const t = Math.max(0, Math.min(1, dawn))
  const mixRgb = (from: [number, number, number], to: [number, number, number]) =>
    `rgb(${mixLin(from[0], to[0], t)} ${mixLin(from[1], to[1], t)} ${mixLin(from[2], to[2], t)})`
  return {
    '--dawn-bg-from': mixRgb([210, 214, 236], [232, 198, 210]),
    '--dawn-bg-to': mixRgb([196, 204, 230], [222, 190, 202]),
    '--dawn-card': mixRgb([214, 218, 236], [220, 190, 202]),
    '--dawn-card-border': mixRgb([164, 172, 200], [176, 156, 170]),
    '--dawn-nav': mixRgb([210, 214, 236], [222, 192, 204]),
    '--dawn-input': mixRgb([220, 224, 240], [228, 200, 210]),
    '--dawn-text': mixRgb([34, 38, 64], [54, 42, 50]),
    '--dawn-muted': mixRgb([62, 72, 104], [84, 72, 82]),
    '--dawn-shadow': `rgba(${mixLin(120, 200, t)} ${mixLin(140, 120, t)} ${mixLin(200, 150, t)} / ${0.28 + t * 0.28})`,
  }
}

function applyDawnToDom(el: HTMLElement, dawn: number) {
  const vars = buildDawnStyleVars(dawn)
  for (const [key, value] of Object.entries(vars)) el.style.setProperty(key, value)
  el.style.background = 'linear-gradient(180deg, var(--dawn-bg-from), var(--dawn-bg-to))'
}

export default function MobilePortfolio() {
  const [activeId, setActiveId] = useState('m-hero')
  const [showLoader, setShowLoader] = useState(true)
  const [theme, setTheme] = useState<'night' | 'day'>('night')
  const [dawnIntensity, setDawnIntensity] = useState(55)
  const [voiceStream, setVoiceStream] = useState<MediaStream | null>(null)
  const [voiceLive, setVoiceLive] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion() ?? false
  const isNight = theme === 'night'

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    trackVisitor('mobile')
    const t = window.setTimeout(() => setShowLoader(false), 1200)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => { document.body.dataset.theme = theme }, [theme])

  useLayoutEffect(() => {
    if (isNight || !rootRef.current) return
    applyDawnToDom(rootRef.current, dawnIntensity / 100)
  }, [isNight]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => { for (const entry of entries) { if (entry.isIntersecting) { setActiveId(entry.target.id); break } } }, { threshold: 0.45, rootMargin: '0px 0px -10% 0px' })
    sections.forEach((s) => { const el = document.getElementById(s.id); if (el) observerRef.current!.observe(el) })
    return () => observerRef.current?.disconnect()
  }, [])

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  const card = isNight ? `${nightGlassSection} p-5` : `${dayGlassSection} p-5`
  const muted = isNight ? 'text-parchment/60' : 'text-[color:var(--dawn-muted)]'
  const pink = isNight ? 'text-sakura-pink/80' : 'text-rose-500/70'
  const rootStyle = useMemo(
    () => !isNight ? ({ background: 'linear-gradient(180deg, var(--dawn-bg-from), var(--dawn-bg-to))' } as React.CSSProperties) : undefined,
    [isNight],
  )

  const skillsRef = useScrollReveal<HTMLDivElement>({ children: '.m-skill-card', stagger: 0.06, from: { opacity: 0, y: 18, scale: 0.97 }, to: { opacity: 1, y: 0, scale: 1 } })
  const certsRef = useScrollReveal<HTMLDivElement>({ children: '.m-cert-card', stagger: 0.08, from: { opacity: 0, y: 12 }, to: { opacity: 1, y: 0 } })
  const projectsRef = useScrollReveal<HTMLDivElement>({ children: '.m-project-card', stagger: 0.08, from: { opacity: 0, y: 24, scale: 0.97 }, to: { opacity: 1, y: 0, scale: 1 } })
  const expRef = useScrollReveal<HTMLDivElement>({ children: '.m-exp-card', stagger: 0.08, from: { opacity: 0, y: 16 }, to: { opacity: 1, y: 0 } })
  const footerRef = useScrollReveal<HTMLElement>({ from: { opacity: 0 }, to: { opacity: 1 } })

  return (
    <div
      ref={rootRef}
      className={`relative min-h-screen overflow-x-hidden ${isNight ? 'bg-black text-parchment' : 'text-[color:var(--dawn-text)]'}`}
      style={rootStyle}
    >
      {isNight && <MidnightScrollBackground />}
      {!isNight && (
        <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,198,214,0.08) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(139,47,60,0.12) 0%, transparent 50%)' }} />
      )}
      <SakuraCanvas reduced={prefersReducedMotion} theme={theme} />

      {/* Day/Night toggle — top right */}
      <div className="pointer-events-none fixed right-4 top-4 z-40">
        <button
          type="button"
          onClick={() => setTheme(isNight ? 'day' : 'night')}
          className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.65rem] font-medium tracking-[0.18em] uppercase shadow-soft-glow backdrop-blur-md transition-[background-color,border-color,box-shadow,color] ${
            isNight
              ? 'border-white/20 bg-white/10 text-white/90 shadow-[0_0_18px_rgba(255,255,255,0.35)] hover:bg-white/15'
              : 'border-pink-200/60 bg-white/70 text-[#4a3a44] shadow-[0_0_18px_rgba(255,182,193,0.45)] hover:bg-white/85'
          }`}
          aria-label={isNight ? 'Switch to day mode' : 'Switch to night mode'}
        >
          <span aria-hidden="true" className="text-sm">{isNight ? '🌙' : '☀️'}</span>
          <span>{isNight ? 'Night' : 'Day'}</span>
        </button>
      </div>

      {/* Dawn warmth slider — shown in day mode below toggle */}
      {!isNight && (
        <div className="pointer-events-none fixed right-4 top-12 z-40 mt-1 w-44">
          <div className="pointer-events-auto rounded-2xl border border-stone-200/80 bg-white/90 px-3 py-2 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-stone-500">Dawn warmth</p>
              <span className="tabular-nums text-[0.68rem] font-semibold text-rose-500/90">{Math.max(0, Math.min(100, ((dawnIntensity - 20) / 80) * 100)).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              className="dawn-range-input w-full"
              min={20}
              max={100}
              step="any"
              value={dawnIntensity}
              onInput={(e) => {
                const v = Number((e.target as HTMLInputElement).value)
                setDawnIntensity(v)
                if (rootRef.current) applyDawnToDom(rootRef.current, v / 100)
              }}
              onChange={(e) => {
                const v = Number(e.target.value)
                setDawnIntensity(v)
                if (rootRef.current) applyDawnToDom(rootRef.current, v / 100)
              }}
              aria-label="Dawn warmth"
            />
          </div>
        </div>
      )}

      <SpotifyMiniPlayer theme={theme} />

      <AnimatePresence>
        {showLoader && (
          <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <motion.span className="block h-8 w-5 rounded-full bg-gradient-to-b from-sakura-pink/80 via-sakura-pink/30 to-transparent shadow-soft-glow" animate={{ y: [0, 40, 0], rotate: [-8, 4, -8] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
            <h1 className="font-heading text-2xl tracking-[0.3em] text-parchment/90">HRITHIK GHOSH</h1>
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-sakura-pink/70">Loading mobile view</p>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 w-full min-w-0 px-4 pb-24 pt-6">
        {/* Hero */}
        <motion.section id="m-hero" className="flex min-h-[85vh] flex-col justify-center gap-6 py-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
          {/* Top circle with HeroAudioOrnament */}
          <div className="relative mx-auto h-32 w-32">
            <div className="h-32 w-32 rounded-full border border-white/[0.14] bg-gradient-to-b from-black via-black to-ink-deep/90 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),0_0_60px_rgba(0,0,0,0.9)]" />
            <HeroAudioOrnament theme={theme} stream={voiceStream} live={voiceLive} />
          </div>
          <div className="space-y-3 text-center">
            <p className={`text-[0.65rem] uppercase tracking-[0.22em] ${pink}`}>AI · ML · Backend</p>
            <h1 className={`font-heading text-2xl leading-snug ${isNight ? 'text-parchment/95' : 'text-[color:var(--dawn-text)]'}`}>Building trustworthy AI systems<span className={`block ${isNight ? 'text-parchment/60' : 'text-[color:var(--dawn-muted)]'}`}>for real-world healthcare and products.</span></h1>
            <p className={`mx-auto max-w-xs text-xs leading-relaxed ${muted}`}>AI & ML Engineer with 4+ years in backend systems, scalable product engineering, and AI-driven solutions.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button type="button" onClick={() => scrollTo('m-projects')} className="rounded-full border border-white/[0.16] bg-white/[0.06] px-4 py-2.5 text-xs font-medium tracking-wide text-parchment/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] active:scale-95 sm:px-5">View work</button>
            <button type="button" onClick={() => scrollTo('m-experience')} className="rounded-full border border-white/[0.14] bg-white/[0.05] px-4 py-2.5 text-xs font-medium tracking-wide text-parchment/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] active:scale-95 sm:px-5">Career timeline</button>
            <a href="/hrithikgh_resume.pdf" download="hrithikgh_resume.pdf" className="rounded-full border border-ink-red/70 bg-black/60 px-4 py-2.5 text-xs font-medium tracking-wide text-parchment/80 active:scale-95 sm:px-5">My résumé · PDF</a>
          </div>
          {/* petals as sibling outside the card's backdrop-blur */}
          <FeatureLocked feature="Voice Note" theme={theme}>
            <div className="relative">
              <VoiceCardPetals isNight={isNight} />
              <HeroVoiceNoteCard
                theme={theme}
                onVoiceStreamChange={setVoiceStream}
                onVoiceRecordingChange={setVoiceLive}
              />
            </div>
          </FeatureLocked>
        </motion.section>

        <MobileSection id="m-about" eyebrow="Story" title="About" showPetals theme={theme}>
          <div className={`${card} relative overflow-hidden space-y-3 text-sm leading-relaxed text-parchment/75`}>
            <span className="pointer-events-none absolute -right-2 -top-3 select-none font-jp-hand text-[6rem] leading-none text-white/[0.02]" aria-hidden>道</span>
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,198,214,0.5), transparent)' }} />
            <div className="mb-3 flex items-center gap-2"><span className={`font-jp-hand text-xl ${pink}`}>士</span><div><p className={`font-heading text-[0.7rem] uppercase tracking-[0.2em] ${pink}`}>The Engineer</p><p className={`text-[0.55rem] tracking-wider ${muted}`}>4+ years · Backend · AI · ML</p></div></div>
            <p>Software Engineer with 4+ years of experience in backend systems, scalable product engineering, and AI-driven solution development.</p>
            <p>Through work with ITU, expanded into applied AI and healthcare-focused intelligent systems — architecting RAG pipelines, semantic caching strategies, multimodal voice-and-text systems.</p>
            <p>Currently pursuing a Master's in AI & Data Science, committed to building practical, trustworthy, and impactful AI systems.</p>
            <p className={`font-jp-hand text-xs tracking-wider ${pink} pt-1`}>一期一会 — One encounter, one chance</p>
          </div>
          <div className={`${card} relative overflow-hidden mt-4 space-y-3`}>
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,198,214,0.5), transparent)' }} />
            <p className={`font-heading text-[0.8rem] uppercase tracking-[0.18em] ${pink}`}>Current focus</p>
            <ul className="space-y-3 text-xs text-parchment/80">
              {[{ kanji: '検', label: 'RAG Systems & Evaluation', desc: 'Grounded answers, safety checks, and measurable AI quality.' }, { kanji: '声', label: 'Voice + Multilingual AI', desc: 'STT/TTS + translation for inclusive healthcare access.' }, { kanji: '築', label: 'Scalable Architecture', desc: 'Backend systems, caching strategies, and production-grade pipelines.' }, { kanji: '学', label: 'Continuous Learning', desc: "Pursuing a Master's in AI & Data Science — always growing." }].map((item) => (
                <li key={item.kanji} className="flex items-start gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-sakura-pink/20 bg-sakura-pink/[0.06] font-jp-hand text-sm text-sakura-pink/80">{item.kanji}</span>
                  <div><p className="font-medium text-parchment/90">{item.label}</p><p className={muted}>{item.desc}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </MobileSection>

        <MobileSection id="m-skills" eyebrow="Dojo" title="Skills & Certifications" theme={theme}>
          <div ref={skillsRef} className="space-y-4">
            {skillGroups.map((group) => (
              <div key={group.title} className={`m-skill-card ${card} relative overflow-hidden`}>
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,198,214,0.45), transparent)' }} />
                <div className="mb-3 flex items-center gap-2"><span className="text-sm">{group.icon}</span><p className="font-heading text-sm text-parchment/90">{group.title}</p></div>
                <div className="flex flex-wrap gap-1.5">{group.items.map((item) => (<span key={item} className="rounded-full border border-white/12 bg-black/40 px-2.5 py-1.5 text-[0.66rem] text-parchment/70">{item}</span>))}</div>
              </div>
            ))}
          </div>
          <div ref={certsRef} className="mt-6">
            <div className="mb-4 flex items-center gap-2"><span className="text-sm">🎓</span><p className="font-heading text-sm text-parchment/90">Certifications</p></div>
            <div className="space-y-3">
              {certifications.map((cert) => (<div key={cert.title} className={`m-cert-card ${card} relative overflow-hidden`}><p className="text-[0.6rem] font-medium uppercase tracking-[0.22em] text-sakura-pink/70">{cert.issuer}</p><p className="mt-1 text-sm font-medium leading-snug text-parchment/90">{cert.title}</p><span className="mt-2 inline-block rounded-full border border-sakura-pink/20 bg-sakura-pink/8 px-2.5 py-0.5 text-[0.58rem] tracking-wide text-sakura-pink/80">{cert.badge}</span></div>))}
            </div>
          </div>
        </MobileSection>

        <MobileSection id="m-projects" eyebrow="Work" title="Projects" showPetals theme={theme}>
          <div ref={projectsRef} className="space-y-4">
            {projects.map((project) => (
              <article key={project.title} className={`m-project-card ${card} relative space-y-3 overflow-hidden`}>
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,198,214,0.5), transparent)' }} />
                <div><p className={`text-[0.65rem] uppercase tracking-[0.22em] ${pink}`}>{project.role}</p><h3 className="mt-1 font-heading text-base text-parchment/95">{project.title}</h3></div>
                <p className={`text-xs leading-relaxed ${muted}`}>{project.description}</p>
                <div className="flex flex-wrap gap-2">{project.stack.map((tech) => (<span key={tech} className="rounded-full border border-white/12 bg-black/40 px-2.5 py-1 text-[0.65rem] text-parchment/60">{tech}</span>))}</div>
                <div className="flex items-center gap-3 pt-1">
                  <a href={project.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.14] bg-white/[0.04] px-3.5 py-2 text-[0.68rem] text-parchment/80 active:scale-95"><svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-3 .6-3.6-1.3-3.6-1.3-.5-1.2-1.2-1.5-1.2-1.5-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 .1.7 1.1 2.2 1.6.2-.7.4-1.1.7-1.4-2.4-.3-4.8-1.2-4.8-5.4 0-1.2.4-2.2 1.1-3-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 3 1.1a10.3 10.3 0 015.5 0c2.1-1.4 3-1.1 3-1.1.6 1.5.2 2.6.1 2.9.7.8 1.1 1.8 1.1 3 0 4.2-2.4 5.1-4.8 5.4.4.3.8 1 .8 2v2.9c0 .3.2.6.7.5A10 10 0 0012 2z" /></svg><span>Code</span></a>
                  {project.live && <a href={project.live} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.16] bg-white/[0.06] px-3.5 py-2 text-[0.68rem] text-parchment/85 active:scale-95"><svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" /></svg><span>Live</span></a>}
                </div>
              </article>
            ))}
          </div>
        </MobileSection>

        <MobileSection id="m-experience" eyebrow="Path" title="Experience" theme={theme}>
          <div className="relative pl-5">
            <div className="absolute inset-y-0 left-1 w-px bg-gradient-to-b from-sakura-pink/40 via-white/8 to-transparent" />
            <div ref={expRef} className="space-y-5">
              {experience.map((entry) => (
                <article key={entry.period} className={`m-exp-card ${card} relative`}>
                  <div className="absolute -left-[25px] top-5 h-2.5 w-2.5 rounded-full border border-sakura-pink/40 bg-sakura-pink/70" />
                  <p className={`text-[0.65rem] uppercase tracking-[0.22em] ${pink}`}>{entry.period}</p>
                  <h3 className="mt-1 font-heading text-sm text-parchment/90">{entry.place}</h3>
                  <p className={`text-[0.6rem] ${muted}`}>{entry.location}</p>
                  <p className="mt-0.5 text-xs font-medium text-parchment/80">{entry.role}</p>
                  <ul className={`mt-2.5 space-y-1.5 text-[0.7rem] leading-relaxed ${muted}`}>{entry.bullets.map((bullet, bi) => (<li key={bi} className="flex gap-2"><span className="mt-1.5 h-0.5 w-2 shrink-0 rounded-full bg-sakura-pink/40" /><span>{bullet}</span></li>))}</ul>
                </article>
              ))}
            </div>
          </div>
        </MobileSection>

        <MobileSection id="m-blogpost" eyebrow="Journal" title="Blogpost" showPetals theme={theme}>
          <BlogPost theme={theme} embedded />
        </MobileSection>

        <MobileSection id="m-contact" eyebrow="Reach out" title="Contact" showPetals theme={theme}>
          <MobileContactForm />
          <div className={`${card} mt-4 space-y-3`}>
            <p className="font-jp-hand text-sm leading-relaxed text-parchment/95">Seeking AI/ML roles building calm, reliable systems that blend strong backend foundations with responsible AI delivery.</p>
            <div className="grid min-w-0 grid-cols-[repeat(2,minmax(0,1fr))] gap-3">
              <ContactLink href="mailto:hrithikgh29@gmail.com" label="Email" value="hrithikgh29@gmail.com" />
              <ContactLink href="tel:+918420736098" label="Phone" value="+91-8420736098" />
              <ContactLink href="https://www.linkedin.com/in/hrithikgh29" label="LinkedIn" value="hrithikgh29" />
              <ContactLink href="https://github.com/Hrithik373" label="GitHub" value="Hrithik373" />
            </div>
          </div>
          <FeatureLocked feature="Program Enquiry" theme={theme}>
            <MobileContactPrograms />
          </FeatureLocked>
        </MobileSection>

        <footer ref={footerRef} className="mt-10 space-y-3 px-1 pb-4 text-center">
          <div className="mx-auto h-px w-2/3 bg-gradient-to-r from-transparent via-sakura-pink/30 to-transparent" />
          <p className="text-[0.65rem] text-parchment/50">&copy; {new Date().getFullYear()} Hrithik Ghosh. Built with care.</p>
          <MobileCookieSettingsLink />
        </footer>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.12] bg-black/90 backdrop-blur-lg safe-bottom">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 py-1">
          {sections.map((s) => { const active = activeId === s.id; const Icon = s.icon; return (
            <button key={s.id} onClick={() => scrollTo(s.id)} className={`flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${active ? 'text-sakura-pink' : 'text-parchment/40'}`} aria-label={s.label}>
              <Icon /><span className="text-[0.55rem] font-medium uppercase tracking-wider">{s.label}</span>
              {active && <motion.span layoutId="tab-dot" className="mt-0.5 h-[3px] w-3 rounded-full bg-sakura-pink/70" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
            </button>
          ) })}
        </div>
      </nav>
    </div>
  )
}

function MobileSection({ id, eyebrow, title, children, showPetals = false, theme = 'night' }: { id: string; eyebrow: string; title: string; children: React.ReactNode; showPetals?: boolean; theme?: 'night' | 'day' }) {
  const shell = theme === 'night' ? nightMobileSectionShell : dayMobileSectionShell
  const headerRef = useScrollReveal<HTMLElement>({ from: { opacity: 0, y: 16 }, to: { opacity: 1, y: 0 }, start: 'top 85%' })
  return (
    <section id={id} className="py-8" aria-label={title}>
      <div className={shell}>
        {showPetals && <SectionSakuraRain isNight={theme === 'night'} />}
        <header ref={headerRef} className="relative z-10 mb-5 space-y-1">
          <p className={`text-[0.6rem] uppercase tracking-[0.28em] ${theme === 'night' ? 'text-sakura-pink/70' : 'text-rose-500/70'}`}>{eyebrow}</p>
          <h2 className={`font-heading text-xl ${theme === 'night' ? 'text-parchment/90' : 'text-[color:var(--dawn-text)]'}`}>{title}</h2>
        </header>
        <div className="relative z-10">{children}</div>
      </div>
    </section>
  )
}

function MobileContactPrograms() {
  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  const ic = 'w-full min-w-0 rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-sm text-parchment/95 outline-none transition placeholder:text-parchment/45 focus:border-white/25 focus:bg-black/45 focus:ring-1 focus:ring-white/10'
  return <div className="mt-6"><ContactProgramCards theme="night" inputClass={ic} isValidEmail={isValidEmail} /></div>
}

function MobileContactForm() {
  const [isSending, setIsSending] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number>(0)
  const showToast = (msg: string) => { setToast(msg); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(null), 4000) }
  const ic = 'w-full min-w-0 rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-sm text-parchment/95 outline-none transition placeholder:text-parchment/45 focus:border-white/25 focus:bg-black/45 focus:ring-1 focus:ring-white/10'
  return (
    <form
      className={`relative ${nightGlassSection} p-5`}
      onSubmit={async (e) => {
        e.preventDefault()
        if (isSending) return
        const fd = new FormData(e.currentTarget)
        const name = String(fd.get('name') ?? '').trim()
        const email = String(fd.get('email') ?? '').trim()
        const subject = String(fd.get('subject') ?? '').trim()
        const message = String(fd.get('message') ?? '').trim()
        const website = String(fd.get('website') ?? '').trim()
        if (!name || !email || !subject || !message) {
          showToast('Please complete every field.')
          return
        }
        try {
          setIsSending(true)
          const res = await fetch(apiUrl('/api/send-email'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, subject, message, website, _fp: await collectFingerprint() }),
          })
          if (!res.ok) {
            showToast('Something went wrong.')
            return
          }
          e.currentTarget.reset()
          showToast('Message sent — petals are on their way.')
        } catch {
          showToast('Network error.')
        } finally {
          setIsSending(false)
        }
      }}
    >
      <div className="absolute -left-[9999px] -top-[9999px]" aria-hidden="true">
        <label htmlFor="mobile-contact-honeypot-website">Website</label>
        <input type="text" id="mobile-contact-honeypot-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="space-y-3"><div className="grid min-w-0 grid-cols-[repeat(2,minmax(0,1fr))] gap-3"><input name="name" placeholder="Name" className={ic} required /><input name="email" type="email" placeholder="Email" className={ic} required /></div><input name="subject" placeholder="Subject" className={ic} required /><textarea name="message" rows={4} placeholder="Message" className={`${ic} resize-none`} required /></div>
      <div className="mt-4 flex items-center justify-between gap-3"><button type="submit" disabled={isSending} className="rounded-full border border-pink-400/60 bg-pink-400/20 px-6 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-parchment/95 shadow-[0_0_18px_rgba(255,182,193,0.5)] active:scale-95 disabled:opacity-60">{isSending ? 'Sending...' : 'Send'}</button><AnimatePresence>{toast && <motion.p className="max-w-[180px] text-[0.68rem] text-parchment/80" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>{toast}</motion.p>}</AnimatePresence></div>
    </form>
  )
}

function ContactLink({ href, label, value }: { href: string; label: string; value: string }) {
  return <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className={`flex min-w-0 flex-col gap-0.5 ${nightGlassSection} px-3 py-3 text-parchment/95 active:scale-[0.97]`}><span className="text-[0.55rem] uppercase tracking-[0.18em] text-parchment/50">{label}</span><span className="truncate text-[0.68rem] font-medium">{value}</span></a>
}

function MobileCookieSettingsLink() {
  const { reopen, consent } = useCookieConsent()
  return (
    <button
      type="button"
      onClick={reopen}
      className="text-[0.58rem] text-parchment/30 underline-offset-2 hover:text-parchment/50 hover:underline transition-colors"
    >
      {consent === 'denied' ? '🔒 Cookie settings (features limited)' : 'Cookie & privacy settings'}
    </button>
  )
}
