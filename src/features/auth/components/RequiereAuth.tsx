import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { Card } from '@/components/ui/Card'
import { Cargando } from '@/components/ui/Cargando'
import { useAuth } from '@/hooks/useAuth'
import type { Rol } from '@/types'

/**
 * Protege rutas: sin sesión redirige a /ingresar recordando a dónde iba; con
 * sesión pero sin el rol requerido muestra un aviso. La protección real de los
 * datos está en las políticas RLS de la base de datos.
 */
export function RequiereAuth({ roles }: { roles?: Rol[] }) {
  const { perfil, cargando } = useAuth()
  const ubicacion = useLocation()

  if (cargando) return <Cargando texto="Verificando sesión…" />

  if (!perfil) {
    return <Navigate to="/ingresar" replace state={{ desde: ubicacion.pathname }} />
  }

  if (roles && !roles.includes(perfil.rol)) {
    return (
      <Card>
        <p className="font-medium text-ink">Sin acceso a este módulo</p>
        <p className="mt-1 text-sm text-ink-muted">
          Tu cuenta no tiene permisos para esta sección. Si crees que es un error, contacta al
          administrador de la clínica.
        </p>
      </Card>
    )
  }

  return <Outlet />
}
