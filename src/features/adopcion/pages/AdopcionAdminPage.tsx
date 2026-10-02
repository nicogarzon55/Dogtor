import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Cargando } from '@/components/ui/Cargando'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { Insignia } from '@/components/ui/Insignia'
import { PageHeader } from '@/components/ui/PageHeader'
import { FormMascotaAdopcion } from '@/features/adopcion/components/FormMascotaAdopcion'
import { FormRefugio } from '@/features/adopcion/components/FormRefugio'
import { FotoMascota } from '@/features/adopcion/components/FotoMascota'
import {
  actualizarMascota,
  actualizarRefugio,
  cambiarAprobacionRefugio,
  crearRefugio,
  eliminarMascota,
  listarMascotasRefugio,
  listarRefugios,
  obtenerMiRefugio,
  publicarMascota,
} from '@/features/adopcion/services/adopcion'
import { useAuth } from '@/hooks/useAuth'
import { mensajeError } from '@/lib/errores'
import { ETIQUETA_ESPECIE, ETIQUETA_ESTADO_ADOPCION, formatoEdad, formatoFechaCorta, opciones } from '@/lib/formato'
import type { EstadoAdopcion, MascotaAdopcion, Perfil, Refugio } from '@/types'

export function AdopcionAdminPage() {
  const { perfil } = useAuth()
  if (!perfil) return null
  return perfil.rol === 'admin_sistema' ? <GestionRefugios /> : <PanelRefugio perfil={perfil} />
}

/* ------------------------- Vista del refugio ----------------------------- */

function PanelRefugio({ perfil }: { perfil: Perfil }) {
  const [refugio, setRefugio] = useState<Refugio | null | undefined>(undefined)
  const [editandoRefugio, setEditandoRefugio] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    obtenerMiRefugio(perfil.id)
      .then(setRefugio)
      .catch((err) => setError(mensajeError(err)))
  }, [perfil.id])

  if (error) return <Aviso tipo="error">{error}</Aviso>
  if (refugio === undefined) return <Cargando />

  // Paso 1: el refugio aún no ha registrado sus datos.
  if (refugio === null) {
    return (
      <section>
        <PageHeader
          titulo="Registra tu refugio"
          descripcion="Antes de publicar mascotas necesitamos los datos de tu refugio o fundación. Un administrador de Dogtor los revisará y aprobará."
        />
        <Card>
          <FormRefugio
            textoBoton="Enviar a revisión"
            alGuardar={async (datos) => setRefugio(await crearRefugio(perfil.id, datos))}
          />
        </Card>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <PageHeader
        titulo={refugio.nombre}
        descripcion="Publica y da seguimiento a las mascotas de tu refugio."
        acciones={
          <Button variante="secundario" tamano="sm" onClick={() => setEditandoRefugio((v) => !v)}>
            {editandoRefugio ? 'Cerrar' : 'Editar datos del refugio'}
          </Button>
        }
      />

      {editandoRefugio && (
        <Card>
          <FormRefugio
            inicial={refugio}
            textoBoton="Guardar cambios"
            alGuardar={async (datos) => {
              setRefugio(await actualizarRefugio(refugio.id, datos))
              setEditandoRefugio(false)
            }}
          />
        </Card>
      )}

      {/* REQ-ADO-03: sin aprobación no se puede publicar. */}
      {refugio.aprobado ? (
        <MascotasDelRefugio refugio={refugio} perfil={perfil} />
      ) : (
        <Aviso tipo="alerta" titulo="Tu refugio está en revisión">
          Un administrador de Dogtor debe aprobar tu refugio antes de que puedas publicar mascotas.
          Te avisaremos por correo cuando esté listo.
        </Aviso>
      )}
    </section>
  )
}

function MascotasDelRefugio({ refugio, perfil }: { refugio: Refugio; perfil: Perfil }) {
  const [mascotas, setMascotas] = useState<MascotaAdopcion[] | null>(null)
  const [formulario, setFormulario] = useState<'nueva' | MascotaAdopcion | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    listarMascotasRefugio(refugio.id)
      .then(setMascotas)
      .catch((err) => setError(mensajeError(err)))
  }, [refugio.id])

  useEffect(cargar, [cargar])

  async function cambiarEstado(m: MascotaAdopcion, estado: EstadoAdopcion) {
    setError(null)
    try {
      const actualizada = await actualizarMascota(m.id, { estado })
      setMascotas((lista) => lista?.map((x) => (x.id === m.id ? actualizada : x)) ?? null)
    } catch (err) {
      setError(mensajeError(err))
    }
  }

  async function borrar(m: MascotaAdopcion) {
    if (!window.confirm(`¿Eliminar la publicación de ${m.nombre}? Esta acción no se puede deshacer.`)) return
    try {
      await eliminarMascota(m.id)
      setMascotas((lista) => lista?.filter((x) => x.id !== m.id) ?? null)
    } catch (err) {
      setError(mensajeError(err))
    }
  }

  const resumen = mascotas
    ? (['disponible', 'en_proceso', 'adoptada'] as const).map((estado) => ({
        estado,
        total: mascotas.filter((m) => m.estado === estado).length,
      }))
    : []

  return (
    <div className="space-y-4">
      {error && <Aviso tipo="error">{error}</Aviso>}

      <div className="grid gap-4 sm:grid-cols-3">
        {resumen.map(({ estado, total }) => (
          <Card key={estado}>
            <p className="text-sm text-ink-muted">{ETIQUETA_ESTADO_ADOPCION[estado]}</p>
            <p className="mt-1 text-3xl font-semibold text-ink">{total}</p>
          </Card>
        ))}
      </div>

      {formulario ? (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ink">
            {formulario === 'nueva' ? 'Publicar mascota' : `Editar a ${formulario.nombre}`}
          </h2>
          <FormMascotaAdopcion
            perfilId={perfil.id}
            ciudadPorDefecto={refugio.ciudad}
            inicial={formulario === 'nueva' ? undefined : formulario}
            alCancelar={() => setFormulario(null)}
            alGuardar={async (datos) => {
              if (formulario === 'nueva') await publicarMascota(refugio.id, datos)
              else await actualizarMascota(formulario.id, datos)
              setFormulario(null)
              cargar()
            }}
          />
        </Card>
      ) : (
        <div className="flex justify-between gap-2">
          <Link to="/adopcion" className="self-center text-sm font-medium text-brand-700 hover:underline">
            Ver catálogo público
          </Link>
          <Button onClick={() => setFormulario('nueva')}>Publicar mascota</Button>
        </div>
      )}

      {mascotas === null && <Cargando />}
      {mascotas?.length === 0 && !formulario && (
        <EstadoVacio titulo="Aún no has publicado mascotas" texto="Publica la primera para que aparezca en el catálogo público." />
      )}
      {mascotas && mascotas.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {mascotas.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="w-20 shrink-0 overflow-hidden rounded-lg">
                <FotoMascota url={m.fotoUrl} nombre={m.nombre} especie={m.especie} />
              </div>
              <div className="min-w-40 flex-1">
                <p className="font-medium text-ink">{m.nombre}</p>
                <p className="text-sm text-ink-muted">
                  {ETIQUETA_ESPECIE[m.especie]} · {formatoEdad(m.edadMeses)} · publicada {formatoFechaCorta(m.publicadaEn)}
                </p>
                {m.adoptadaEn && <p className="text-xs text-success">Adoptada el {formatoFechaCorta(m.adoptadaEn)}</p>}
              </div>
              {/* REQ-ADO-02/05: cambio de estado directo desde la lista. */}
              <label className="sr-only" htmlFor={`estado-${m.id}`}>
                Estado de {m.nombre}
              </label>
              <select
                id={`estado-${m.id}`}
                value={m.estado}
                onChange={(e) => cambiarEstado(m, e.target.value as EstadoAdopcion)}
                className="h-9 rounded-lg border border-line bg-surface px-2 text-sm"
              >
                {opciones(ETIQUETA_ESTADO_ADOPCION).map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiqueta}
                  </option>
                ))}
              </select>
              <div className="flex gap-1">
                <Button variante="fantasma" tamano="sm" onClick={() => setFormulario(m)}>
                  Editar
                </Button>
                <Button variante="fantasma" tamano="sm" className="text-danger hover:bg-danger/5" onClick={() => borrar(m)}>
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ------------------- Vista del administrador del sistema ----------------- */

/** REQ-ADO-03: aprobación de refugios. */
function GestionRefugios() {
  const [refugios, setRefugios] = useState<Refugio[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listarRefugios()
      .then(setRefugios)
      .catch((err) => setError(mensajeError(err)))
  }, [])

  async function cambiar(r: Refugio, aprobado: boolean) {
    setError(null)
    try {
      await cambiarAprobacionRefugio(r.id, aprobado)
      setRefugios((lista) => lista?.map((x) => (x.id === r.id ? { ...x, aprobado } : x)) ?? null)
    } catch (err) {
      setError(mensajeError(err))
    }
  }

  const pendientes = refugios?.filter((r) => !r.aprobado).length ?? 0

  return (
    <section>
      <PageHeader
        titulo="Refugios"
        descripcion="Aprueba los refugios y fundaciones antes de que puedan publicar mascotas."
      />
      {error && <Aviso tipo="error" className="mb-4">{error}</Aviso>}
      {refugios === null && <Cargando />}
      {refugios && pendientes > 0 && (
        <Aviso tipo="alerta" className="mb-4">
          {pendientes} {pendientes === 1 ? 'refugio espera' : 'refugios esperan'} aprobación.
        </Aviso>
      )}
      {refugios?.length === 0 && <EstadoVacio titulo="No hay refugios registrados" />}
      {refugios && refugios.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {refugios.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-48 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{r.nombre}</p>
                  <Insignia tono={r.aprobado ? 'exito' : 'alerta'}>{r.aprobado ? 'Aprobado' : 'Pendiente'}</Insignia>
                </div>
                <p className="text-sm text-ink-muted">
                  {r.ciudad} · {[r.telefono, r.emailContacto].filter(Boolean).join(' · ') || 'sin contacto'} · registrado{' '}
                  {formatoFechaCorta(r.creadoEn)}
                </p>
                {r.descripcion && <p className="mt-1 text-sm text-ink">{r.descripcion}</p>}
              </div>
              {r.aprobado ? (
                <Button variante="secundario" tamano="sm" onClick={() => cambiar(r, false)}>
                  Revocar
                </Button>
              ) : (
                <Button tamano="sm" onClick={() => cambiar(r, true)}>
                  Aprobar
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
