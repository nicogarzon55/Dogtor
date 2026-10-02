import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'

import { obtenerPerfil } from '@/features/auth/services/auth'
import { ContextoAuth } from '@/features/auth/services/contexto'
import { supabase } from '@/lib/supabase'
import type { Perfil } from '@/types'

/** Mantiene la sesión de Supabase y el perfil (con su rol) del usuario. */
export function ProveedorAuth({ children }: { children: ReactNode }) {
  // undefined = todavía no se sabe si hay sesión guardada.
  const [sesion, setSesion] = useState<Session | null | undefined>(undefined)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [perfilDe, setPerfilDe] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    // No se llama a Supabase dentro del callback (puede bloquear el cliente):
    // solo se guarda la sesión y el efecto de abajo carga el perfil.
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => setSesion(nueva))
    return () => data.subscription.unsubscribe()
  }, [])

  const usuarioId = sesion?.user.id ?? null
  const email = sesion?.user.email ?? ''

  useEffect(() => {
    if (!usuarioId) return
    let vigente = true
    obtenerPerfil(usuarioId, email)
      .catch(() => null)
      .then((p) => {
        if (!vigente) return
        setPerfil(p)
        setPerfilDe(usuarioId)
      })
    return () => {
      vigente = false
    }
  }, [usuarioId, email])

  /** Para refrescar el perfil después de editarlo. */
  const recargarPerfil = useCallback(async () => {
    if (usuarioId) setPerfil(await obtenerPerfil(usuarioId, email))
  }, [usuarioId, email])

  // Cargando mientras no se conoce la sesión o el perfil no corresponde a ella.
  const cargando = sesion === undefined || (usuarioId !== null && perfilDe !== usuarioId)
  // Sin sesión (o con un perfil de una sesión anterior) no se expone perfil.
  const perfilVigente = usuarioId !== null && perfilDe === usuarioId ? perfil : null

  return (
    <ContextoAuth.Provider value={{ perfil: perfilVigente, cargando, recargarPerfil }}>
      {children}
    </ContextoAuth.Provider>
  )
}
