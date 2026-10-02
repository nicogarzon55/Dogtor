import { useState } from 'react'

import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { Insignia } from '@/components/ui/Insignia'
import { SelectorFranja } from '@/features/citas/components/SelectorFranja'
import { cancelarCita, marcarAtendida, reprogramarCita } from '@/features/citas/services/citas'
import { mensajeError } from '@/lib/errores'
import {
  ETIQUETA_ESPECIALIDAD,
  ETIQUETA_ESTADO_CITA,
  ETIQUETA_TIPO_CONSULTA,
  formatoFechaLarga,
  formatoHora,
} from '@/lib/formato'
import type { CitaDetalle, EstadoCita } from '@/types'

const TONO_ESTADO: Record<EstadoCita, 'marca' | 'acento' | 'exito' | 'neutro'> = {
  programada: 'marca',
  reprogramada: 'acento',
  atendida: 'exito',
  cancelada: 'neutro',
}

/**
 * Una cita con sus acciones. `modo` decide qué puede hacer quien la ve:
 * el propietario cancela o reprograma (REQ-AGC-04); el personal además la
 * marca como atendida.
 */
export function TarjetaCita({
  cita,
  modo,
  alCambiar,
}: {
  cita: CitaDetalle
  modo: 'propietario' | 'personal'
  alCambiar: () => void
}) {
  const [reprogramando, setReprogramando] = useState(false)
  const [nuevoInicio, setNuevoInicio] = useState<string | null>(null)
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activa = cita.estado === 'programada' || cita.estado === 'reprogramada'
  const [renderizadaEn] = useState(() => Date.now())
  const futura = new Date(cita.inicio).getTime() > renderizadaEn

  async function ejecutar(accion: () => Promise<void>) {
    setTrabajando(true)
    setError(null)
    try {
      await accion()
      setReprogramando(false)
      alCambiar()
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setTrabajando(false)
    }
  }

  return (
    <li className="space-y-3 p-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-24 shrink-0">
          <p className="text-lg font-semibold text-ink">{formatoHora(cita.inicio)}</p>
          <p className="text-xs text-ink-muted first-letter:uppercase">{formatoFechaLarga(cita.inicio)}</p>
        </div>
        <div className="min-w-48 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-ink">
              {cita.mascotaNombre}
              {modo === 'personal' && cita.propietarioNombre && (
                <span className="font-normal text-ink-muted"> · {cita.propietarioNombre}</span>
              )}
            </p>
            <Insignia tono={TONO_ESTADO[cita.estado]}>{ETIQUETA_ESTADO_CITA[cita.estado]}</Insignia>
          </div>
          <p className="text-sm text-ink-muted">
            {ETIQUETA_TIPO_CONSULTA[cita.tipoConsulta]} · {cita.doctorNombre}
            {cita.especialidad && ` (${ETIQUETA_ESPECIALIDAD[cita.especialidad]})`} · {cita.sedeNombre}
          </p>
          <p className="mt-1 text-sm text-ink">
            <span className="text-ink-muted">Motivo:</span> {cita.motivo}
          </p>
        </div>

        {activa && (
          <div className="flex flex-wrap gap-1">
            {modo === 'personal' && (
              <Button tamano="sm" disabled={trabajando} onClick={() => ejecutar(() => marcarAtendida(cita.id))}>
                Marcar atendida
              </Button>
            )}
            {futura && (
              <Button variante="secundario" tamano="sm" disabled={trabajando} onClick={() => setReprogramando((v) => !v)}>
                {reprogramando ? 'Cerrar' : 'Reprogramar'}
              </Button>
            )}
            <Button
              variante="fantasma"
              tamano="sm"
              className="text-danger hover:bg-danger/5"
              disabled={trabajando}
              onClick={() => {
                if (window.confirm(`¿Cancelar la cita de ${cita.mascotaNombre}?`)) {
                  void ejecutar(() => cancelarCita(cita.id))
                }
              }}
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>

      {error && <Aviso tipo="error">{error}</Aviso>}

      {reprogramando && (
        <div className="space-y-3 rounded-lg bg-surface-muted p-4">
          <p className="text-sm font-medium text-ink">Nueva fecha con {cita.doctorNombre}</p>
          <SelectorFranja doctorId={cita.doctorId} seleccionada={nuevoInicio} alElegir={setNuevoInicio} />
          <Button
            disabled={!nuevoInicio || trabajando}
            onClick={() => nuevoInicio && ejecutar(() => reprogramarCita(cita.id, nuevoInicio))}
          >
            {trabajando ? 'Guardando…' : 'Confirmar nuevo horario'}
          </Button>
        </div>
      )}
    </li>
  )
}
