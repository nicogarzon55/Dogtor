import { Link } from 'react-router-dom'

import { Insignia } from '@/components/ui/Insignia'
import { FotoMascota } from '@/features/adopcion/components/FotoMascota'
import { ETIQUETA_ESPECIE, ETIQUETA_SEXO, ETIQUETA_TAMANO, formatoEdad } from '@/lib/formato'
import type { MascotaAdopcion } from '@/types'

export function TarjetaMascota({ mascota }: { mascota: MascotaAdopcion }) {
  return (
    <Link
      to={`/adopcion/${mascota.id}`}
      className="group overflow-hidden rounded-xl border border-line bg-surface shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative">
        <FotoMascota url={mascota.fotoUrl} nombre={mascota.nombre} especie={mascota.especie} />
        {mascota.estado === 'en_proceso' && (
          <span className="absolute top-3 left-3">
            <Insignia tono="acento">En proceso de adopción</Insignia>
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-ink group-hover:text-brand-700">{mascota.nombre}</h2>
          <span className="text-xs text-ink-muted">{mascota.ciudad}</span>
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          {ETIQUETA_ESPECIE[mascota.especie]} · {ETIQUETA_SEXO[mascota.sexo]} · {formatoEdad(mascota.edadMeses)} ·{' '}
          {ETIQUETA_TAMANO[mascota.tamano]}
        </p>
        {mascota.descripcion && <p className="mt-2 line-clamp-2 text-sm text-ink">{mascota.descripcion}</p>}
      </div>
    </Link>
  )
}
