import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/Card'

const MODULOS = [
  {
    titulo: 'Historias clínicas',
    texto: 'Toda la información médica de cada mascota en un solo lugar.',
  },
  {
    titulo: 'Citas en línea',
    texto: 'Agenda con la disponibilidad real de cada doctor.',
  },
  {
    titulo: 'Urgencias 24 horas',
    texto: 'Identifica qué sedes atienden fuera del horario habitual.',
  },
  {
    titulo: 'Inventario y ventas',
    texto: 'Alertas de stock y vencimiento, con trazabilidad hacia la consulta.',
  },
  {
    titulo: 'Recordatorios',
    texto: 'Avisos automáticos de citas, vacunas y controles periódicos.',
  },
  {
    titulo: 'Adopción',
    texto: 'Refugios y fundaciones publican sus mascotas disponibles.',
  },
]

export function HomePage() {
  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="text-3xl font-semibold text-balance text-ink sm:text-4xl">
          Gestión veterinaria y adopción de mascotas en un solo sistema
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-ink-muted">
          Dogtor reúne la gestión clínica, administrativa y comercial de las clínicas
          veterinarias pequeñas y medianas, e incluye un módulo para que refugios y
          fundaciones den visibilidad a sus mascotas en adopción.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/adopcion"
            className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Ver mascotas en adopción
          </Link>
          <Link
            to="/app"
            className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-5 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
          >
            Entrar al panel
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULOS.map((modulo) => (
          <Card key={modulo.titulo}>
            <h2 className="font-medium text-ink">{modulo.titulo}</h2>
            <p className="mt-1 text-sm text-ink-muted">{modulo.texto}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
