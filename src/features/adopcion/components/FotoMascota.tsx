import { useState } from 'react'

import { cn } from '@/lib/cn'
import type { Especie } from '@/types'

/** Foto de la mascota o, si no tiene / no carga, una huella de respaldo. */
export function FotoMascota({
  url,
  nombre,
  especie,
  className,
}: {
  url: string | null
  nombre: string
  especie: Especie
  className?: string
}) {
  const [fallo, setFallo] = useState(false)

  if (url && !fallo) {
    return (
      <img
        src={url}
        alt={`Foto de ${nombre}`}
        loading="lazy"
        onError={() => setFallo(true)}
        className={cn('aspect-[4/3] w-full object-cover', className)}
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={`${nombre} (${especie}) sin foto`}
      className={cn('grid aspect-[4/3] w-full place-items-center bg-accent-50 text-accent-400', className)}
    >
      <svg viewBox="0 0 64 64" className="size-16" fill="currentColor" aria-hidden="true">
        <ellipse cx="32" cy="42" rx="13" ry="11" />
        <ellipse cx="16" cy="27" rx="6" ry="8" />
        <ellipse cx="48" cy="27" rx="6" ry="8" />
        <ellipse cx="25" cy="15" rx="5.5" ry="7.5" />
        <ellipse cx="39" cy="15" rx="5.5" ry="7.5" />
      </svg>
    </div>
  )
}
