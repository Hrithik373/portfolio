import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Dev + `vite preview` — without this, POST /api/* hits the static server → "Cannot POST /api/...". */
const apiProxy = {
  '/api': {
    target: 'http://localhost:8787',
    changeOrigin: true,
  },
  /**
   * Vik's chat backend (vik/gateway — Kong on :8000, routing /api/agent/*
   * to svc-agent; see vik/infra/docker-compose.yml). Proxied under a
   * separate same-origin prefix, rewritten back to /api/* on the way out,
   * so the browser never needs cross-origin CORS/CSP handling for it.
   * Requires `docker compose -f vik/infra/docker-compose.yml up -d`.
   */
  '/vik-api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/vik-api/, '/api'),
  },
} as const

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    /** Listen on all interfaces so phone / LAN and `localhost` both work (fixes “site unreachable” on wrong host). */
    host: true,
    port: 5173,
    strictPort: false,
    proxy: apiProxy,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
    proxy: apiProxy,
  },
})
