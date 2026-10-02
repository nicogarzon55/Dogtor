import { useState } from 'react'

import { Aviso } from '@/components/ui/Aviso'
import { CampoTexto } from '@/components/ui/Campo'
import { Cargando } from '@/components/ui/Cargando'
import { franjasDisponibles } from '@/features/citas/services/citas'
import { useConsulta } from '@/hooks/useConsulta'
import { cn } from '@/lib/cn'
import { formatoFechaLarga, formatoHora, hoyBogota } from '@/lib/formato'
import type { ID } from '@/types'

/** Ventana máxima de agendamiento. */
const DIAS_MAXIMOS = 60

/**
 * REQ-AGC-01: fecha + franjas libres del doctor, consultadas en el momento.
 * Si el doctor cambia, se limpia la franja elegida.
 */
export function SelectorFranja({
  doctorId,
  seleccionada,
  alElegir,
}: {
  doctorId: ID
  seleccionada: string | null
  alElegir: (inicio: string | null) => void
}) {
  const [fecha, setFecha] = useState(hoyBogota())
  const { datos: franjas, error } = useConsulta(
    () => franjasDisponibles(doctorId, fecha),
    `${doctorId}|${fecha}`,
  )

  return (
    <div className="space-y-3">
      <CampoTexto
        etiqueta="Fecha"
        type="date"
        min={hoyBogota()}
        max={hoyBogota(DIAS_MAXIMOS)}
        value={fecha}
        onChange={(e) => {
          setFecha(e.target.value)
          alElegir(null)
        }}
        className="max-w-xs"
      />
      {error && <Aviso tipo="error">{error}</Aviso>}
      {!error && !franjas && <Cargando texto="Consultando disponibilidad…" />}
      {franjas?.length === 0 && (
        <p className="rounded-lg bg-surface-muted px-4 py-3 text-sm text-ink-muted">
          No hay franjas libres este día. Prueba con otra fecha u otro doctor.
        </p>
      )}
      {franjas && franjas.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">
            Horarios libres · <span className="font-normal text-ink-muted">{formatoFechaLarga(franjas[0].inicio)}</span>
          </legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
            {franjas.map((f) => {
              const activa = seleccionada !== null && new Date(seleccionada).getTime() === new Date(f.inicio).getTime()
              return (
                <button
                  key={f.inicio}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => alElegir(f.inicio)}
                  className={cn(
                    'h-10 rounded-lg border text-sm font-medium transition-colors',
                    activa
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-line bg-surface text-ink hover:border-brand-400 hover:bg-brand-50',
                  )}
                >
                  {formatoHora(f.inicio)}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}
    </div>
  )
}
