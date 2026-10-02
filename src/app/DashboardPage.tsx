import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { Perfil } from '@/types'

interface Indicador {
  etiqueta: string
  valor: number | null
  enlace?: string
}

const ACTIVAS = ['programada', 'reprogramada']

/** Cuenta filas sin traerlas (HEAD + count). La RLS limita lo que cada rol ve. */
async function contar(tabla: string, filtro: (q: ReturnType<typeof base>) => ReturnType<typeof base>) {
  const { count, error } = await filtro(base(tabla))
  if (error) return null
  return count ?? 0
}
const base = (tabla: string) => supabase.from(tabla).select('*', { count: 'exact', head: true })

async function indicadoresPara(perfil: Perfil): Promise<Indicador[]> {
  const ahora = new Date().toISOString()
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
  const enAdopcion = contar('mascotas_adopcion', (q) => q.in('estado', ['disponible', 'en_proceso']))

  switch (perfil.rol) {
    case 'propietario':
      return Promise.all([
        contar('citas', (q) => q.eq('propietario_id', perfil.id).in('estado', ACTIVAS).gt('inicio', ahora)),
        contar('mascotas', (q) => q.eq('propietario_id', perfil.id)),
        enAdopcion,
      ]).then(([citas, mascotas, adopcion]) => [
        { etiqueta: 'Próximas citas', valor: citas, enlace: '/app/citas' },
        { etiqueta: 'Mis mascotas', valor: mascotas, enlace: '/app/citas' },
        { etiqueta: 'Mascotas buscando hogar', valor: adopcion, enlace: '/adopcion' },
      ])
    case 'admin_refugio':
      return Promise.all([enAdopcion]).then(([adopcion]) => [
        { etiqueta: 'Mascotas en el catálogo público', valor: adopcion, enlace: '/adopcion' },
      ])
    default:
      return Promise.all([
        contar('citas', (q) =>
          q.in('estado', ACTIVAS).gte('inicio', `${hoy}T00:00:00-05:00`).lte('inicio', `${hoy}T23:59:59-05:00`),
        ),
        contar('mascotas', (q) => q),
        contar('doctores', (q) => q.eq('activo', true)),
        enAdopcion,
      ]).then(([citasHoy, mascotas, doctores, adopcion]) => [
        { etiqueta: 'Citas de hoy', valor: citasHoy, enlace: '/app/citas' },
        { etiqueta: 'Mascotas registradas', valor: mascotas },
        { etiqueta: 'Doctores activos', valor: doctores },
        { etiqueta: 'Mascotas en adopción', valor: adopcion, enlace: '/adopcion' },
      ])
  }
}

export function DashboardPage() {
  const { perfil } = useAuth()
  const [indicadores, setIndicadores] = useState<Indicador[] | null>(null)

  useEffect(() => {
    if (perfil) indicadoresPara(perfil).then(setIndicadores)
  }, [perfil])

  if (!perfil) return null

  return (
    <section>
      <PageHeader titulo={`Hola, ${perfil.nombre || 'bienvenido'}`} descripcion="Resumen de tu actividad en Dogtor." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(indicadores ?? Array.from({ length: 3 }, () => null)).map((indicador, i) => {
          const contenido = (
            <Card className="h-full">
              <p className="text-sm text-ink-muted">{indicador?.etiqueta ?? '…'}</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{indicador?.valor ?? '—'}</p>
            </Card>
          )
          return indicador?.enlace ? (
            <Link key={indicador.etiqueta} to={indicador.enlace} className="rounded-xl transition-shadow hover:shadow-md">
              {contenido}
            </Link>
          ) : (
            <div key={indicador?.etiqueta ?? i}>{contenido}</div>
          )
        })}
      </div>
    </section>
  )
}
