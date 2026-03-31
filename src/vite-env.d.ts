/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ADMIN_BYPASS_EMAILS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
