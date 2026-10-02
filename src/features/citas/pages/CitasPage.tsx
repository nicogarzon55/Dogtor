import { useCallback, useEffect, useState } from 'react'

import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CampoSelect, CampoTexto } from '@/components/ui/Campo'
import { Cargando } from '@/components/ui/Cargando'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { Insignia } from '@/components/ui/Insignia'
import { PageHeader } from '@/components/ui/PageHeader'
import { AgendarCita } from '@/features/citas/components/AgendarCita'
import { FormMascota } from '@/features/citas/components/FormMascota'
import { TarjetaCita } from '@/features/citas/components/TarjetaCita'
import {
  listarAgendaDia,
  listarCitasPropietario,
  listarDoctores,
  listarMisMascotas,
} from '@/features/citas/services/citas'
import { useAuth } from '@/hooks/useAuth'
import { useConsulta } from '@/hooks/useConsulta'
import { mensajeError } from '@/lib/errores'
import { ETIQUETA_ESPECIE, hoyBogota } from '@/lib/formato'
import type { CitaDetalle, DoctorConSede, Mascota, Perfil } from '@/types'

export function CitasPage() {
  const { perfil } = useAuth()
  if (!perfil) return null
  return perfil.rol === 'propietario' ? <VistaPropietario perfil={perfil} /> : <AgendaClinica perfil={perfil} />
}

/* --------------------------- Propietario --------------------------------- */

function VistaPropietario({ perfil }: { perfil: Perfil }) {
  const [mascotas, setMascotas] = useState<Mascota[] | null>(null)
  const [citas, setCitas] = useState<CitaDetalle[] | null>(null)
  const [panel, setPanel] = useState<'agendar' | 'mascota' | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  // Momento de referencia para separar próximas citas del historial.
  const [ahora, setAhora] = useState(() => Date.now())
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    Promise.all([listarMisMascotas(perfil.id), listarCitasPropietario(perfil.id)])
      .then(([m, c]) => {
        setMascotas(m)
        setCitas(c)
        setAhora(Date.now())
      })
      .catch((err) => setError(mensajeError(err)))
  }, [perfil.id])

  useEffect(cargar, [cargar])

  if (error) return <Aviso tipo="error">{error}</Aviso>
  if (!mascotas || !citas) return <Cargando />

  const proximas = citas
    .filter((c) => (c.estado === 'programada' || c.estado === 'reprogramada') && new Date(c.inicio).getTime() > ahora)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
  const historial = citas.filter((c) => !proximas.includes(c))

  return (
    <section className="space-y-6">
      <PageHeader
        titulo="Mis citas"
        descripcion="Agenda en línea con la disponibilidad real de cada doctor."
        acciones={
          mascotas.length > 0 &&
          panel !== 'agendar' && (
            <Button
              onClick={() => {
                setExito(null)
                setPanel('agendar')
              }}
            >
              Agendar cita
            </Button>
          )
        }
      />

      {exito && <Aviso tipo="exito">{exito}</Aviso>}

      {/* Sin mascotas no se puede agendar: se pide registrar la primera. */}
      {mascotas.length === 0 ? (
        <Card>
          <h2 className="text-lg font-semibold text-ink">Registra a tu primera mascota</h2>
          <p className="mb-4 text-sm text-ink-muted">La necesitamos para asociarle las citas y su historia clínica.</p>
          <FormMascota propietarioId={perfil.id} alGuardar={(m) => setMascotas([m])} />
        </Card>
      ) : (
        <>
          {panel === 'agendar' && (
            <Card>
              <AgendarCita
                mascotas={mascotas}
                alCancelar={() => setPanel(null)}
                alAgendar={() => {
                  setPanel(null)
                  setExito('Tu cita quedó agendada. Te esperamos.')
                  cargar()
                }}
              />
            </Card>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-ink-muted">Mis mascotas:</span>
            {mascotas.map((m) => (
              <Insignia key={m.id} tono="marca">
                {m.nombre} · {ETIQUETA_ESPECIE[m.especie]}
              </Insignia>
            ))}
            {panel !== 'mascota' && (
              <button onClick={() => setPanel('mascota')} className="text-sm font-medium text-brand-700 hover:underline">
                + Agregar mascota
              </button>
            )}
          </div>

          {panel === 'mascota' && (
            <Card>
              <FormMascota
                propietarioId={perfil.id}
                alCancelar={() => setPanel(null)}
                alGuardar={(m) => {
                  setMascotas((lista) => [...(lista ?? []), m])
                  setPanel(null)
                }}
              />
            </Card>
          )}
        </>
      )}

      <ListaCitas titulo="Próximas citas" citas={proximas} modo="propietario" alCambiar={cargar} vacio="No tienes citas próximas." />
      {/* REQ-AGC-08 */}
      <ListaCitas titulo="Historial" citas={historial} modo="propietario" alCambiar={cargar} vacio="Aún no tienes citas pasadas." />
    </section>
  )
}

/* ----------------------- Personal de la clínica -------------------------- */

function AgendaClinica({ perfil }: { perfil: Perfil }) {
  const [fecha, setFecha] = useState(hoyBogota())
  const [doctores, setDoctores] = useState<DoctorConSede[]>([])
  const [doctorId, setDoctorId] = useState('')
  const [errorDoctores, setErrorDoctores] = useState<string | null>(null)

  const esDoctor = perfil.rol === 'doctor'

  useEffect(() => {
    listarDoctores()
      .then((lista) => {
        setDoctores(lista)
        // El doctor ve por defecto su propia agenda.
        if (esDoctor) setDoctorId(lista.find((d) => d.usuarioId === perfil.id)?.id ?? '')
      })
      .catch((err) => setErrorDoctores(mensajeError(err)))
  }, [esDoctor, perfil.id])

  const agenda = useConsulta(() => listarAgendaDia(fecha, doctorId || undefined), `${fecha}|${doctorId}`)
  const citas = agenda.datos
  const error = errorDoctores ?? agenda.error

  const activas = citas?.filter((c) => c.estado === 'programada' || c.estado === 'reprogramada').length ?? 0

  return (
    <section className="space-y-6">
      <PageHeader titulo="Agenda" descripcion="Citas del día por doctor. Las reglas de cruce y antelación se validan en el servidor." />

      {esDoctor && doctores.length > 0 && !doctores.some((d) => d.usuarioId === perfil.id) && (
        <Aviso tipo="alerta">
          Tu usuario aún no está vinculado a un perfil de doctor. Pídele al administrador que lo asocie.
        </Aviso>
      )}

      <div className="grid gap-4 rounded-xl border border-line bg-surface p-4 sm:grid-cols-3 sm:items-end">
        <CampoTexto etiqueta="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <CampoSelect
          etiqueta="Doctor"
          vacio="Todos los doctores"
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          opciones={doctores.map((d) => ({ valor: d.id, etiqueta: d.nombreCompleto }))}
        />
        <p className="text-sm text-ink-muted sm:pb-2.5">
          {citas ? `${activas} ${activas === 1 ? 'cita activa' : 'citas activas'} de ${citas.length}` : ''}
        </p>
      </div>

      {error && <Aviso tipo="error">{error}</Aviso>}
      {!citas ? (
        <Cargando />
      ) : (
        <ListaCitas titulo="Citas del día" citas={citas} modo="personal" alCambiar={agenda.recargar} vacio="No hay citas para este día." />
      )}
    </section>
  )
}

/* ------------------------------------------------------------------------- */

function ListaCitas({
  titulo,
  citas,
  modo,
  alCambiar,
  vacio,
}: {
  titulo: string
  citas: CitaDetalle[]
  modo: 'propietario' | 'personal'
  alCambiar: () => void
  vacio: string
}) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-ink">{titulo}</h2>
      {citas.length === 0 ? (
        <EstadoVacio titulo={vacio} />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {citas.map((c) => (
            <TarjetaCita key={c.id} cita={c} modo={modo} alCambiar={alCambiar} />
          ))}
        </ul>
      )}
    </div>
  )
}
