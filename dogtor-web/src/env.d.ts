/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API REST de Dogtor. Ver .env.example. */
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
