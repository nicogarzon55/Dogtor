/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL del proyecto de Supabase. Ver .env.example. */
  readonly VITE_SUPABASE_URL: string
  /** Llave publicable (sb_publishable_...). Nunca la secreta. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
