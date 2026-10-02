import { useEffect, useState, type ReactNode } from 'react'

import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { CampoArea, CampoSelect } from '@/components/ui/Campo'
import { Insignia } from '@/components/ui/Insignia'
import { SelectorFranja } from '@/features/citas/components/SelectorFranja'
import { agendarCita, listarDoctores } from '@/features/citas/services/citas'
import { cn } from '@/lib/cn'
import { mensajeError } from '@/lib/errores'
import {
  ETIQUETA_ESPECIALIDAD,
  ETIQUETA_TIPO_CONSULTA,
  formatoFechaHora,
  opciones,
} from '@/lib/formato'
import type { DoctorConSede, Especialidad, Mascota, TipoConsulta } from '@/types'

const PASOS = ['Mascota y motivo', 'Doctor y horario', 'Confirmar'] as const

/** Especialidad sugerida según el tipo de consulta. */
const ESPECIALIDAD_SUGERIDA: Partial<Record<TipoConsulta, Especialidad>> = {
  urgencia: 'urgencias',
  cirugia: 'cirugia',
}

/**
 * Agendamiento en 3 pasos (RNF de usabilidad: "no más de 3 pasos").
 * Cubre REQ-AGC-01, 02 (vía base de datos), 05 y 07.
 */
export function AgendarCita({
  mascotas,
  alAgendar,
  alCancelar,
}: {
  mascotas: Mascota[]
  alAgendar: () => void
  alCancelar: () => void
}) {
  const [paso, setPaso] = useState(0)
  const [mascotaId, setMascotaId] = useState(mascotas[0]?.id ?? '')
  const [tipoConsulta, setTipoConsulta] = useState<TipoConsulta>('control')
  const [motivo, setMotivo] = useState('')
  const [especialidad, setEspecialidad] = useState<Especialidad | ''>('')
  const [doctores, setDoctores] = useState<DoctorConSede[]>([])
  const [doctorId, setDoctorId] = useState('')
  const [inicio, setInicio] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // REQ-AGC-05: lista de doctores filtrada por especialidad.
  useEffect(() => {
    listarDoctores(especialidad || undefined)
      .then((lista) => {
        setDoctores(lista)
        setDoctorId((actual) => (lista.some((d) => d.id === actual) ? actual : (lista[0]?.id ?? '')))
      })
      .catch((err) => setError(mensajeError(err)))
  }, [especialidad])

  const doctor = doctores.find((d) => d.id === doctorId)
  const mascota = mascotas.find((m) => m.id === mascotaId)

  function siguiente() {
    setError(null)
    if (paso === 0) {
      if (motivo.trim().length < 3) return setError('Cuéntanos brevemente el motivo de la consulta.')
      const sugerida = ESPECIALIDAD_SUGERIDA[tipoConsulta]
      if (sugerida && !especialidad) setEspecialidad(sugerida)
    }
    if (paso === 1 && !inicio) return setError('Elige un horario disponible.')
    setPaso((p) => p + 1)
  }

  async function confirmar() {
    if (!inicio) return
    setEnviando(true)
    setError(null)
    try {
      await agendarCita({ mascotaId, doctorId, inicio, tipoConsulta, motivo })
      alAgendar()
    } catch (err) {
      setError(mensajeError(err))
      // Si alguien tomó la franja mientras confirmaba, se vuelve a elegir.
      if ((err as { code?: string }).code === '23P01') {
        setInicio(null)
        setPaso(1)
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-5">
      <ol className="grid grid-cols-3 gap-2" aria-label="Pasos del agendamiento">
        {PASOS.map((nombre, i) => (
          <li
            key={nombre}
            aria-current={i === paso ? 'step' : undefined}
            className={cn(
              'border-t-4 pt-2 text-xs font-medium sm:text-sm',
              i <= paso ? 'border-brand-600 text-ink' : 'border-line text-ink-muted',
            )}
          >
            {i + 1}. {nombre}
          </li>
        ))}
      </ol>

      {error && <Aviso tipo="error">{error}</Aviso>}

      {paso === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoSelect
            etiqueta="Mascota"
            value={mascotaId}
            onChange={(e) => setMascotaId(e.target.value)}
            opciones={mascotas.map((m) => ({ valor: m.id, etiqueta: m.nombre }))}
          />
          <CampoSelect
            etiqueta="Tipo de consulta"
            value={tipoConsulta}
            onChange={(e) => setTipoConsulta(e.target.value as TipoConsulta)}
            opciones={opciones(ETIQUETA_TIPO_CONSULTA)}
          />
          {/* REQ-AGC-07: el doctor ve este motivo antes de atender. */}
          <CampoArea
            etiqueta="Motivo de la consulta"
            required
            className="sm:col-span-2"
            placeholder="Ej.: control anual y revisión de una cojera en la pata trasera."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>
      )}

      {paso === 1 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoSelect
              etiqueta="Especialidad"
              vacio="Todas"
              value={especialidad}
              onChange={(e) => {
                setEspecialidad(e.target.value as Especialidad | '')
                setInicio(null)
              }}
              opciones={opciones(ETIQUETA_ESPECIALIDAD)}
            />
            <CampoSelect
              etiqueta="Doctor"
              value={doctorId}
              onChange={(e) => {
                setDoctorId(e.target.value)
                setInicio(null)
              }}
              opciones={doctores.map((d) => ({
                valor: d.id,
                etiqueta: `${d.nombreCompleto} · ${ETIQUETA_ESPECIALIDAD[d.especialidad]}`,
              }))}
              ayuda={
                doctor && (
                  <>
                    {doctor.sede.nombre} · {doctor.sede.direccion}
                    {doctor.sede.urgencias24h && ' · Sede con urgencias 24 h'}
                  </>
                )
              }
            />
          </div>
          {doctores.length === 0 ? (
            <p className="text-sm text-ink-muted">No hay doctores activos con esa especialidad.</p>
          ) : (
            doctorId && <SelectorFranja key={doctorId} doctorId={doctorId} seleccionada={inicio} alElegir={setInicio} />
          )}
        </div>
      )}

      {paso === 2 && inicio && doctor && mascota && (
        <dl className="grid gap-3 rounded-xl bg-surface-muted p-4 text-sm sm:grid-cols-2">
          <Dato etiqueta="Mascota">{mascota.nombre}</Dato>
          <Dato etiqueta="Tipo de consulta">{ETIQUETA_TIPO_CONSULTA[tipoConsulta]}</Dato>
          <Dato etiqueta="Fecha y hora">{formatoFechaHora(inicio)}</Dato>
          <Dato etiqueta="Doctor">
            {doctor.nombreCompleto} <Insignia tono="marca">{ETIQUETA_ESPECIALIDAD[doctor.especialidad]}</Insignia>
          </Dato>
          <Dato etiqueta="Sede">
            {doctor.sede.nombre} · {doctor.sede.direccion}
          </Dato>
          <Dato etiqueta="Motivo">{motivo}</Dato>
        </dl>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <Button variante="secundario" onClick={paso === 0 ? alCancelar : () => setPaso((p) => p - 1)} disabled={enviando}>
          {paso === 0 ? 'Cancelar' : 'Atrás'}
        </Button>
        {paso < 2 ? (
          <Button onClick={siguiente}>Continuar</Button>
        ) : (
          <Button onClick={confirmar} disabled={enviando}>
            {enviando ? 'Agendando…' : 'Confirmar cita'}
          </Button>
        )}
      </div>
    </div>
  )
}

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-ink-muted">{etiqueta}</dt>
      <dd className="font-medium text-ink">{children}</dd>
    </div>
  )
}
