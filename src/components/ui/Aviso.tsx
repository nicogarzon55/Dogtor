import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type Tipo = 'info' | 'exito' | 'alerta' | 'error'

const estilos: Record<Tipo, string> = {
  info: 'border-info/30 bg-info/5 text-info',
  exito: 'border-success/30 bg-success/5 text-success',
  alerta: 'border-warning/30 bg-warning/5 text-warning',
  error: 'border-danger/30 bg-danger/5 text-danger',
}

export function Aviso({
  tipo = 'info',
  titulo,
  children,
  className,
}: {
  tipo?: Tipo
  titulo?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={cn('rounded-lg border px-4 py-3 text-sm', estilos[tipo], className)}
    >
      {titulo && <p className="font-medium">{titulo}</p>}
      {children && <div className={cn(titulo && 'mt-0.5', 'text-ink')}>{children}</div>}
    </div>
  )
}
