import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRef, useState } from 'react'

import { SectionShell } from '../SectionShell/SectionShell'
import type { SectionProps } from '../SectionTypes'
import { dayGlassSection, nightGlassSection } from '../sectionGlass'

type Project = {
  title: string
  role: string
  description: string
  stack: string[]
  github: string
  live?: string
  featured?: boolean
}

const projects: Project[] = [
  {
    title: 'Agentic RAG Evaluator',
    role: 'RAG pipeline & evaluation',
    description:
      'Production-ready RAG system with PDF ingestion, vector indexing, and LLM-as-Judge scoring for relevance, faithfulness, and groundedness.',
    stack: ['LangChain', 'FAISS', 'OpenAI', 'Streamlit'],
    github: 'https://github.com/Hrithik373/ARAassistant',
    live: 'https://araassistant-ky7xiosunekrfmu427tt2f.streamlit.app/',
    featured: true,
  },
  {
    title: 'SMS Spam Detection Engine',
    role: 'ML classification',
    description:
      'Text classification pipeline with TF-IDF, SMOTE balancing, and tuned models (SVM, XGBoost) with robust evaluation metrics.',
    stack: ['Python', 'scikit-learn', 'NLTK', 'XGBoost'],
    github: 'https://github.com/Hrithik373/sms-spam-detection',
    live: 'https://sms-spam-detection-uxuz5fe9icdlakvxvnvccy.streamlit.app/',
  },
  {
    title: 'Retail Sales Forecasting',
    role: 'Time-series forecasting',
    description:
      'Forecasting pipeline with feature engineering, ARIMA/LSTM models, and production metrics (MAPE, RMSE, R²).',
    stack: ['Pandas', 'TensorFlow', 'XGBoost', 'ARIMA'],
    github: 'https://github.com/Hrithik373/Retail-Prediction-model',
    live: 'https://retaildashboard005.streamlit.app/',
  },
  {
    title: 'LLM QA Bot',
    role: 'Conversational AI',
    description:
      'Chatbot powered by OpenAI and Google Flan models via LangChain, with a Streamlit dashboard for interactive question-answering.',
    stack: ['LangChain', 'OpenAI', 'HuggingFace', 'Streamlit'],
    github: 'https://github.com/Hrithik373/LLM_QABot',
  },
  {
    title: 'Emotion Detection Model',
    role: 'Deep learning & NLP',
    description:
      'Emotion classification model for text data, applying deep learning techniques to detect sentiment and emotional states.',
    stack: ['Python', 'TensorFlow', 'NLP', 'Deep Learning'],
    github: 'https://github.com/Hrithik373/Emotion-Detection-Model',
  },
  {
    title: 'Sentiment Analyzer',
    role: 'NLP analysis',
    description:
      'Sentiment analysis demo classifying text polarity using NLP pipelines, with clean notebook-driven experimentation.',
    stack: ['Python', 'NLTK', 'Jupyter', 'scikit-learn'],
    github: 'https://github.com/Hrithik373/SentimentAnalyzerDemo',
  },
]

const easeBezier: [number, number, number, number] = [0.22, 1, 0.36, 1]

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 00-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-3 .6-3.6-1.3-3.6-1.3-.5-1.2-1.2-1.5-1.2-1.5-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 .1.7 1.1 2.2 1.6.2-.7.4-1.1.7-1.4-2.4-.3-4.8-1.2-4.8-5.4 0-1.2.4-2.2 1.1-3-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 3 1.1a10.3 10.3 0 015.5 0c2.1-1.4 3-1.1 3-1.1.6 1.5.2 2.6.1 2.9.7.8 1.1 1.8 1.1 3 0 4.2-2.4 5.1-4.8 5.4.4.3.8 1 .8 2v2.9c0 .3.2.6.7.5A10 10 0 0012 2z" />
    </svg>
  )
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TiltCard({
  project,
  index,
  isNight,
}: {
  project: Project
  index: number
  isNight: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = { stiffness: 200, damping: 20 }
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), springConfig)
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), springConfig)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    setHovered(false)
  }

  const isFeatured = project.featured

  return (
    <motion.article
      ref={ref}
      className={`group relative flex h-full flex-col overflow-hidden p-6 lg:p-7 ${
        isFeatured ? 'sm:col-span-2' : ''
      } ${isNight ? nightGlassSection : dayGlassSection}`}
      style={{ rotateX, rotateY, transformPerspective: 800, transformStyle: 'preserve-3d' }}
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ amount: 0.2, once: true }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: easeBezier }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hover glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 -z-0"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(245,198,214,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(139,47,60,0.12),_transparent_50%)]" />
      </motion.div>

      {/* Animated top accent line */}
      <motion.div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(245,198,214,0.55), transparent)',
        }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: easeBezier }}
      />

      <div className="relative z-10 flex flex-1 flex-col">
        <header className="mb-3 space-y-1.5">
          <motion.p
            className="text-[0.65rem] uppercase tracking-[0.25em] text-sakura-pink/80"
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + 0.15, duration: 0.6, ease: easeBezier }}
          >
            {project.role}
          </motion.p>
          <h3
            className={`font-heading text-lg ${
              isNight ? 'text-parchment/95' : 'text-[color:var(--dawn-text)]'
            }`}
          >
            {project.title}
          </h3>
        </header>

        <p
          className={`mb-5 text-xs leading-relaxed ${
            isNight ? 'text-parchment/65' : 'text-[color:var(--dawn-muted)]'
          }`}
        >
          {project.description}
        </p>

        {/* Tech stack with staggered entrance */}
        <div className={`mb-5 flex flex-wrap gap-2 text-[0.66rem] ${isNight ? 'text-parchment/55' : 'text-[color:var(--dawn-muted)]'}`}>
          {project.stack.map((tech, ti) => (
            <motion.span
              key={tech}
              className={`rounded-full border px-2.5 py-1 tracking-wide ${
                isNight ? 'border-white/12 bg-white/[0.04]' : 'border-[rgba(245,198,214,0.32)] bg-white/70'
              }`}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 + 0.3 + ti * 0.05, duration: 0.4, ease: easeBezier }}
            >
              {tech}
            </motion.span>
          ))}
        </div>

        {/* Links — pushed to bottom */}
        <div className="mt-auto flex flex-wrap items-center gap-3 text-xs">
          <a
            href={project.github}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 ${
              isNight
                ? 'border-white/[0.14] bg-white/[0.04] text-parchment/80 hover:border-white/22 hover:bg-white/[0.08] hover:text-parchment hover:shadow-[0_0_16px_rgba(255,255,255,0.06)] focus-visible:ring-white/25'
                : 'border-[rgba(245,198,214,0.3)] bg-white/70 text-[color:var(--dawn-text)] hover:border-[rgba(245,198,214,0.5)] hover:shadow-[0_0_16px_rgba(245,198,214,0.15)] focus-visible:ring-sakura-pink/70'
            }`}
          >
            <GithubIcon className="h-3.5 w-3.5" />
            <span>View code</span>
            <motion.span
              className={`h-px bg-gradient-to-r ${
                isNight ? 'from-sakura-pink/40 to-sakura-pink/80' : 'from-sakura-pink/40 to-sakura-pink/70'
              }`}
              initial={{ width: 12 }}
              whileHover={{ width: 20 }}
              transition={{ duration: 0.4 }}
            />
          </a>
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 ${
                isNight
                  ? 'border-white/[0.16] bg-white/[0.05] text-parchment/85 hover:border-white/24 hover:bg-white/[0.09] hover:text-parchment hover:shadow-[0_0_18px_rgba(255,255,255,0.08)] focus-visible:ring-white/25'
                  : 'border-[rgba(245,198,214,0.3)] bg-[color:var(--dawn-card)] text-[color:var(--dawn-text)] hover:border-[rgba(245,198,214,0.5)] hover:shadow-[0_0_18px_rgba(245,198,214,0.18)] focus-visible:ring-sakura-pink/70'
              }`}
            >
              <ExternalLinkIcon className="h-3.5 w-3.5" />
              <span>Live demo</span>
            </a>
          )}
        </div>
      </div>
    </motion.article>
  )
}

export function Projects({ theme }: SectionProps) {
  const isNight = theme === 'night'

  return (
    <SectionShell
      id="projects"
      label="Projects"
      eyebrow="Work"
      theme={theme}
      backgroundVideo="https://motionbgs.com/dl/hd/36"
    >
      <div className="grid min-w-0 gap-6 sm:grid-cols-[repeat(2,minmax(0,1fr))] lg:gap-8">
        {projects.map((project, index) => (
          <TiltCard key={project.title} project={project} index={index} isNight={isNight} />
        ))}
      </div>
    </SectionShell>
  )
}
