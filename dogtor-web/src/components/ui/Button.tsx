import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro'
type Tamano = 'sm' | 'md' | 'lg'

const variantes: Record<Variante, string> = {
  primario: 'bg-brand-600 text-white hover:bg-brand-700',
  secundario: 'bg-white text-ink border border-line hover:bg-surface-muted',
  fantasma: 'bg-transparent text-brand-700 hover:bg-brand-50',
  peligro: 'bg-danger text-white hover:opacity-90',
}

const tamanos: Record<Tamano, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamano?: Tamano
}

export function Button({
  variante = 'primario',
  tamano = 'md',
  className,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variantes[variante],
        tamanos[tamano],
        className,
      )}
      {...props}
    />
  )
}
