import { useState } from 'react'

import { cn } from '@/lib/cn'

interface Props {
  /** Lado del isotipo, en píxeles. */
  tamano?: number
  className?: string
}

/**
 * Isotipo de Dogtor.
 *
 * Carga `public/logo.png`. Si ese archivo todavía no está en el proyecto cae al
 * monograma, de modo que la aplicación nunca muestra una imagen rota.
 */
export function Logo({ tamano = 32, className }: Props) {
  const [sinImagen, setSinImagen] = useState(false)

  if (sinImagen) {
    return (
      <span
        className={cn(
          'grid shrink-0 place-items-center rounded-xl bg-brand-600 font-semibold text-white',
          className,
        )}
        style={{
          width: tamano,
          height: tamano,
          fontSize: Math.round(tamano * 0.46),
          fontFamily: 'var(--font-display)',
        }}
        aria-hidden="true"
      >
        D
      </span>
    )
  }

  return (
    <img
      src="/logo.png"
      alt="Dogtor"
      width={tamano}
      height={tamano}
      className={cn('shrink-0 rounded-xl object-contain', className)}
      onError={() => setSinImagen(true)}
    />
  )
}
