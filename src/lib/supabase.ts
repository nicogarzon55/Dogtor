import { createClient } from '@supabase/supabase-js'

/**
 * Cliente único de Supabase.
 *
 * Supabase expone la base de datos como una API REST (PostgREST) que habla JSON
 * sobre HTTPS, lo que cumple las interfaces de comunicación del documento de
 * requerimientos. La seguridad real vive en la base de datos (RLS por rol), no
 * en el frontend: este cliente solo usa la llave publicable.
 */

const url = import.meta.env.VITE_SUPABASE_URL
const llave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** false cuando falta el .env.local; la app muestra cómo configurarlo. */
export const supabaseConfigurado = Boolean(url && llave)

export const supabase = createClient(
  url || 'https://sin-configurar.supabase.co',
  llave || 'sin-configurar',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)
