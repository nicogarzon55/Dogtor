import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface Props {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl border border-line bg-surface p-5 shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}
