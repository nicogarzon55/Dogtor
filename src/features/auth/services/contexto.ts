import { createContext } from 'react'

import type { Perfil } from '@/types'

export interface EstadoAuth {
  /** null mientras no hay sesión. */
  perfil: Perfil | null
  /** true hasta saber si hay sesión guardada y cargar el perfil. */
  cargando: boolean
  recargarPerfil: () => Promise<void>
}

export const ContextoAuth = createContext<EstadoAuth | null>(null)
