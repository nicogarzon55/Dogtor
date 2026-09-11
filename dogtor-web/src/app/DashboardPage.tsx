import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'

/** Datos de ejemplo: se reemplazan por las consultas a la API. */
const INDICADORES = [
  { etiqueta: 'Citas de hoy', valor: '—' },
  { etiqueta: 'Mascotas registradas', valor: '—' },
  { etiqueta: 'Alertas de inventario', valor: '—' },
  { etiqueta: 'Mascotas en adopción', valor: '—' },
]

export function DashboardPage() {
  return (
    <section>
      <PageHeader
        titulo="Panel"
        descripcion="Resumen operativo de la clínica. Los indicadores se conectarán a la API en la siguiente iteración."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {INDICADORES.map((indicador) => (
          <Card key={indicador.etiqueta}>
            <p className="text-sm text-ink-muted">{indicador.etiqueta}</p>
            <p className="mt-2 text-3xl font-semibold text-ink">{indicador.valor}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}
