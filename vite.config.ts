import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Dev + `vite preview` — without this, POST /api/* hits the static server → "Cannot POST /api/...". */
const apiProxy = {
  '/api': {
    target: 'http://localhost:8787',
    changeOrigin: true,
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
