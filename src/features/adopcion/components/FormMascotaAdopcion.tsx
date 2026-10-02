import { useState, type FormEvent } from 'react'

import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { CampoArea, CampoSelect, CampoTexto } from '@/components/ui/Campo'
import { FotoMascota } from '@/features/adopcion/components/FotoMascota'
import { subirFoto } from '@/features/adopcion/services/adopcion'
import { mensajeError } from '@/lib/errores'
import {
  ETIQUETA_ESPECIE,
  ETIQUETA_ESTADO_ADOPCION,
  ETIQUETA_SEXO,
  ETIQUETA_TAMANO,
  opciones,
} from '@/lib/formato'
import type { DatosMascotaAdopcion, Especie, EstadoAdopcion, ID, Sexo, Tamano } from '@/types'

const MAX_BYTES = 5 * 1024 * 1024

export function FormMascotaAdopcion({
  perfilId,
  ciudadPorDefecto,
  inicial,
  alGuardar,
  alCancelar,
}: {
  perfilId: ID
  ciudadPorDefecto: string
  inicial?: DatosMascotaAdopcion
  alGuardar: (datos: DatosMascotaAdopcion) => Promise<void>
  alCancelar: () => void
}) {
  const [datos, setDatos] = useState<DatosMascotaAdopcion>(
    inicial ?? {
      nombre: '',
      especie: 'perro',
      edadMeses: 12,
      tamano: 'mediano',
      sexo: 'hembra',
      ciudad: ciudadPorDefecto,
      descripcion: '',
      estadoSalud: '',
      fotoUrl: null,
      estado: 'disponible',
    },
  )
  // La edad se captura en años y meses porque es como la piensa el refugio.
  const [anios, setAnios] = useState(Math.floor(datos.edadMeses / 12))
  const [meses, setMeses] = useState(datos.edadMeses % 12)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(datos.fotoUrl)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cambiar = <K extends keyof DatosMascotaAdopcion>(campo: K, valor: DatosMascotaAdopcion[K]) =>
    setDatos((d) => ({ ...d, [campo]: valor }))

  function elegirFoto(f: File | undefined) {
    if (!f) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      return setError('La foto debe ser JPG, PNG o WEBP.')
    }
    if (f.size > MAX_BYTES) return setError('La foto no puede pesar más de 5 MB.')
    setError(null)
    setArchivo(f)
    setVistaPrevia(URL.createObjectURL(f))
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      const fotoUrl = archivo ? await subirFoto(perfilId, archivo) : datos.fotoUrl
      await alGuardar({ ...datos, edadMeses: anios * 12 + meses, fotoUrl })
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      {error && <Aviso tipo="error">{error}</Aviso>}

      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <div className="space-y-2">
          <div className="overflow-hidden rounded-lg border border-line">
            <FotoMascota url={vistaPrevia} nombre={datos.nombre || 'Mascota'} especie={datos.especie} />
          </div>
          <label className="block cursor-pointer text-center text-sm font-medium text-brand-700 hover:underline">
            {vistaPrevia ? 'Cambiar foto' : 'Subir foto'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => elegirFoto(e.target.files?.[0])}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto etiqueta="Nombre" required value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />
          <CampoSelect
            etiqueta="Especie"
            value={datos.especie}
            onChange={(e) => cambiar('especie', e.target.value as Especie)}
            opciones={opciones(ETIQUETA_ESPECIE)}
          />
          <div className="grid grid-cols-2 gap-2">
            <CampoTexto etiqueta="Años" type="number" min={0} max={30} value={anios} onChange={(e) => setAnios(Number(e.target.value))} />
            <CampoTexto etiqueta="Meses" type="number" min={0} max={11} value={meses} onChange={(e) => setMeses(Number(e.target.value))} />
          </div>
          <CampoSelect
            etiqueta="Sexo"
            value={datos.sexo}
            onChange={(e) => cambiar('sexo', e.target.value as Sexo)}
            opciones={opciones(ETIQUETA_SEXO)}
          />
          <CampoSelect
            etiqueta="Tamaño"
            value={datos.tamano}
            onChange={(e) => cambiar('tamano', e.target.value as Tamano)}
            opciones={opciones(ETIQUETA_TAMANO)}
          />
          <CampoTexto etiqueta="Ciudad" required value={datos.ciudad} onChange={(e) => cambiar('ciudad', e.target.value)} />
        </div>
      </div>

      <CampoArea
        etiqueta="Descripción"
        placeholder="Personalidad, con quién convive bien, qué hogar necesita…"
        value={datos.descripcion}
        onChange={(e) => cambiar('descripcion', e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto
          etiqueta="Estado de salud"
          placeholder="Vacunas, esterilización, tratamientos…"
          value={datos.estadoSalud}
          onChange={(e) => cambiar('estadoSalud', e.target.value)}
        />
        <CampoSelect
          etiqueta="Estado de la publicación"
          value={datos.estado}
          onChange={(e) => cambiar('estado', e.target.value as EstadoAdopcion)}
          opciones={opciones(ETIQUETA_ESTADO_ADOPCION)}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : inicial ? 'Guardar cambios' : 'Publicar mascota'}
        </Button>
        <Button type="button" variante="secundario" onClick={alCancelar} disabled={guardando}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
