import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type Tono = 'neutro' | 'marca' | 'acento' | 'exito' | 'alerta' | 'peligro'

const tonos: Record<Tono, string> = {
  neutro: 'bg-surface-muted text-ink-muted',
  marca: 'bg-brand-50 text-brand-700',
  acento: 'bg-accent-100 text-accent-800',
  exito: 'bg-success/10 text-success',
  alerta: 'bg-warning/10 text-warning',
  peligro: 'bg-danger/10 text-danger',
}

export function Insignia({ tono = 'neutro', children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tonos[tono])}>
      {children}
    </span>
  )
}
