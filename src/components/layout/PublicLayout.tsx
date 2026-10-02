import { Link, NavLink, Outlet } from 'react-router-dom'

import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'

export function PublicLayout() {
  const { perfil } = useAuth()
  const enlaces = [
    { ruta: '/adopcion', etiqueta: 'Adoptar' },
    perfil ? { ruta: '/app', etiqueta: 'Mi panel' } : { ruta: '/ingresar', etiqueta: 'Ingresar' },
  ]

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo tamano={34} />
            <span className="text-lg font-semibold text-ink">Dogtor</span>
          </Link>
          <nav className="flex items-center gap-1">
            {enlaces.map((enlace) => (
              <NavLink
                key={enlace.ruta}
                to={enlace.ruta}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-muted hover:text-ink',
                  )
                }
              >
                {enlace.etiqueta}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-line px-5 py-6 text-center text-xs text-ink-muted">
        Dogtor S.A.S. · Proyecto académico · Politécnico Grancolombiano
      </footer>
    </div>
  )
}
