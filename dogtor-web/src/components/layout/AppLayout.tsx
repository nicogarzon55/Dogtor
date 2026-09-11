import { NavLink, Outlet } from 'react-router-dom'

import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/cn'

const MODULOS = [
  { ruta: '/app', etiqueta: 'Panel', exacto: true },
  { ruta: '/app/historias-clinicas', etiqueta: 'Historias clínicas' },
  { ruta: '/app/citas', etiqueta: 'Citas' },
  { ruta: '/app/doctores', etiqueta: 'Doctores y turnos' },
  { ruta: '/app/inventario', etiqueta: 'Inventario' },
  { ruta: '/app/ventas', etiqueta: 'Ventas' },
  { ruta: '/app/recordatorios', etiqueta: 'Recordatorios' },
  { ruta: '/app/adopcion', etiqueta: 'Adopción' },
]

export function AppLayout() {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-line bg-surface lg:border-r lg:border-b-0">
        <div className="flex items-center gap-2.5 px-5 py-4">
          <Logo tamano={34} />
          <span className="text-lg font-semibold text-ink">Dogtor</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {MODULOS.map((modulo) => (
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
      </aside>

      <main className="p-5 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
