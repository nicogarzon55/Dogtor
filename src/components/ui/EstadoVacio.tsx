import type { ReactNode } from 'react'

export function EstadoVacio({
  titulo,
  texto,
  accion,
}: {
  titulo: string
  texto?: string
  accion?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-10 text-center">
      <p className="font-medium text-ink">{titulo}</p>
      {texto && <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">{texto}</p>}
      {accion && <div className="mt-4 flex justify-center">{accion}</div>}
    </div>
  )
}
