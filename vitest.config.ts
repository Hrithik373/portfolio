import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // Frontend tests run in happy-dom; backend tests run in node
    environmentMatchGlobs: [
      ['src/**', 'happy-dom'],
      ['backend/**', 'node'],
    ],
    include: ['src/**/*.test.{ts,tsx}', 'backend/**/*.test.ts'],
  },
})
