import type { ReactNode } from 'react'

interface Props {
  titulo: string
  descripcion?: string
  acciones?: ReactNode
}

export function PageHeader({ titulo, descripcion, acciones }: Props) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{titulo}</h1>
        {descripcion && (
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">{descripcion}</p>
        )}
      </div>
      {acciones && <div className="flex gap-2">{acciones}</div>}
    </header>
  )
}
