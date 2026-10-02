import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { MODULOS_APP } from '@/app/permisos'
import { Logo } from '@/components/ui/Logo'
import { salir } from '@/features/auth/services/auth'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'
import { ETIQUETA_ROL } from '@/lib/formato'

export function AppLayout() {
  const { perfil } = useAuth()
  const navegar = useNavigate()

  const modulos = perfil ? MODULOS_APP.filter((m) => m.roles.includes(perfil.rol)) : []

  async function cerrarSesion() {
    await salir()
    navegar('/ingresar', { replace: true })
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-2.5 px-5 py-4">
          <NavLink to="/" className="flex items-center gap-2.5">
            <Logo tamano={34} />
            <span className="text-lg font-semibold text-ink">Dogtor</span>
          </NavLink>
          <button
            onClick={cerrarSesion}
            className="rounded-lg px-2 py-1 text-sm text-ink-muted hover:text-ink lg:hidden"
          >
            Salir
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible">
          {modulos.map((modulo) => (
            <NavLink
              key={modulo.ruta}
              to={modulo.ruta}
              end={modulo.exacto}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
                )
              }
            >
              {modulo.etiqueta}
            </NavLink>
          ))}
        </nav>
        {perfil && (
          <div className="hidden border-t border-line px-5 py-4 lg:block">
            <p className="truncate text-sm font-medium text-ink">
              {perfil.nombre} {perfil.apellido}
            </p>
            <p className="truncate text-xs text-ink-muted">{ETIQUETA_ROL[perfil.rol]}</p>
            <button
              onClick={cerrarSesion}
              className="mt-3 text-sm font-medium text-brand-700 hover:underline"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </aside>

      <main className="p-5 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
