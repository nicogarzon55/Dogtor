import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'

interface Props {
  titulo: string
  descripcion: string
  /** Identificadores de los requerimientos que cubrirá este módulo. */
  requerimientos: string[]
}

/**
 * Marcador temporal para los módulos aún no implementados.
 * Se reemplaza por la vista real a medida que avanza cada sprint.
 */
export function ModuloEnConstruccion({ titulo, descripcion, requerimientos }: Props) {
  return (
    <section>
      <PageHeader titulo={titulo} descripcion={descripcion} />
      <Card>
        <p className="text-sm font-medium text-ink">Requerimientos por implementar</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {requerimientos.map((req) => (
            <li
              key={req}
              className="rounded-lg bg-surface-muted px-3 py-2 font-mono text-xs text-ink-muted"
            >
              {req}
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}
