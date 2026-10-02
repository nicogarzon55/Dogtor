import { useContext } from 'react'

import { ContextoAuth } from '@/features/auth/services/contexto'

export function useAuth() {
  const contexto = useContext(ContextoAuth)
  if (!contexto) throw new Error('useAuth debe usarse dentro de <ProveedorAuth>')
  return contexto
}
