import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Aviso } from '@/components/ui/Aviso'
import { Card } from '@/components/ui/Card'
import { Cargando } from '@/components/ui/Cargando'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { Insignia } from '@/components/ui/Insignia'
import { FotoMascota } from '@/features/adopcion/components/FotoMascota'
import { obtenerMascotaPublica } from '@/features/adopcion/services/adopcion'
import { mensajeError } from '@/lib/errores'
import {
  ETIQUETA_ESPECIE,
  ETIQUETA_SEXO,
  ETIQUETA_TAMANO,
  formatoEdad,
  formatoFechaCorta,
} from '@/lib/formato'
import type { MascotaAdopcionConRefugio } from '@/types'

/** Ficha pública de una mascota con el contacto del refugio. */
export function DetalleMascotaAdopcionPage() {
  const { id = '' } = useParams()
  const [mascota, setMascota] = useState<MascotaAdopcionConRefugio | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    obtenerMascotaPublica(id)
      .then(setMascota)
      .catch((err) => setError(mensajeError(err)))
  }, [id])

  if (error) return <Aviso tipo="error">{error}</Aviso>
  if (mascota === undefined) return <Cargando />
  if (mascota === null) {
    return (
      <EstadoVacio
        titulo="Esta mascota ya no está disponible"
        texto="Puede que ya haya encontrado hogar. Revisa las demás mascotas del catálogo."
        accion={
          <Link to="/adopcion" className="text-sm font-medium text-brand-700 hover:underline">
            Ver catálogo
          </Link>
        }
      />
    )
  }

  const { refugio } = mascota
  const telefonoWhatsApp = refugio.telefono?.replace(/\D/g, '')
  const mensaje = encodeURIComponent(`Hola, vi a ${mascota.nombre} en Dogtor y me interesa adoptarle.`)

  const datos = [
    ['Especie', ETIQUETA_ESPECIE[mascota.especie]],
    ['Edad', formatoEdad(mascota.edadMeses)],
    ['Sexo', ETIQUETA_SEXO[mascota.sexo]],
    ['Tamaño', ETIQUETA_TAMANO[mascota.tamano]],
    ['Ciudad', mascota.ciudad],
    ['Publicada', formatoFechaCorta(mascota.publicadaEn)],
  ]

  return (
    <article>
      <Link to="/adopcion" className="text-sm font-medium text-brand-700 hover:underline">
        ← Volver al catálogo
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="self-start overflow-hidden rounded-xl border border-line bg-surface">
          <FotoMascota url={mascota.fotoUrl} nombre={mascota.nombre} especie={mascota.especie} />
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold text-ink">{mascota.nombre}</h1>
              {mascota.estado === 'en_proceso' && <Insignia tono="acento">En proceso de adopción</Insignia>}
            </div>
            {mascota.descripcion && <p className="mt-2 text-ink">{mascota.descripcion}</p>}
          </div>

          <dl className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-surface p-4 text-sm">
            {datos.map(([etiqueta, valor]) => (
              <div key={etiqueta}>
                <dt className="text-ink-muted">{etiqueta}</dt>
                <dd className="font-medium text-ink">{valor}</dd>
              </div>
            ))}
            {mascota.estadoSalud && (
              <div className="col-span-2">
                <dt className="text-ink-muted">Estado de salud</dt>
                <dd className="font-medium text-ink">{mascota.estadoSalud}</dd>
              </div>
            )}
          </dl>

          <Card>
            <p className="text-sm text-ink-muted">Publicada por</p>
            <p className="text-lg font-semibold text-ink">{refugio.nombre}</p>
            <p className="text-sm text-ink-muted">{refugio.ciudad}</p>
            {mascota.estado === 'en_proceso' && (
              <Aviso tipo="info" className="mt-3">
                Ya hay una familia en proceso con {mascota.nombre}. Puedes escribir al refugio por
                si el proceso no se concreta.
              </Aviso>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {telefonoWhatsApp && (
                <a
                  href={`https://wa.me/57${telefonoWhatsApp}?text=${mensaje}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center rounded-lg bg-accent-600 px-4 text-sm font-medium text-white hover:bg-accent-700"
                >
                  Escribir por WhatsApp
                </a>
              )}
              {refugio.emailContacto && (
                <a
                  href={`mailto:${refugio.emailContacto}?subject=${encodeURIComponent(`Adopción de ${mascota.nombre}`)}&body=${mensaje}`}
                  className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-muted"
                >
                  Enviar correo
                </a>
              )}
            </div>
            {(refugio.telefono || refugio.redesSociales) && (
              <p className="mt-3 text-sm text-ink-muted">
                {refugio.telefono && <>Tel. {refugio.telefono}</>}
                {refugio.telefono && refugio.redesSociales && ' · '}
                {refugio.redesSociales}
              </p>
            )}
          </Card>
        </div>
      </div>
    </article>
  )
}
