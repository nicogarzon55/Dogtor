import { useState, type FormEvent } from 'react'

import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { CampoSelect, CampoTexto } from '@/components/ui/Campo'
import { registrarMascota } from '@/features/citas/services/citas'
import { mensajeError } from '@/lib/errores'
import { ETIQUETA_ESPECIE, ETIQUETA_SEXO, hoyBogota, opciones } from '@/lib/formato'
import type { DatosMascota, Especie, ID, Mascota, Sexo } from '@/types'

/** Registro rápido de una mascota del propietario. */
export function FormMascota({
  propietarioId,
  alGuardar,
  alCancelar,
}: {
  propietarioId: ID
  alGuardar: (m: Mascota) => void
  alCancelar?: () => void
}) {
  const [datos, setDatos] = useState<DatosMascota>({ nombre: '', especie: 'perro', sexo: 'macho', raza: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cambiar = <K extends keyof DatosMascota>(campo: K, valor: DatosMascota[K]) =>
    setDatos((d) => ({ ...d, [campo]: valor }))

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      alGuardar(await registrarMascota(propietarioId, datos))
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      {error && <Aviso tipo="error">{error}</Aviso>}
      <div className="grid gap-4 sm:grid-cols-3">
        <CampoTexto etiqueta="Nombre" required value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />
        <CampoSelect
          etiqueta="Especie"
          value={datos.especie}
          onChange={(e) => cambiar('especie', e.target.value as Especie)}
          opciones={opciones(ETIQUETA_ESPECIE)}
        />
        <CampoSelect
          etiqueta="Sexo"
          value={datos.sexo}
          onChange={(e) => cambiar('sexo', e.target.value as Sexo)}
          opciones={opciones(ETIQUETA_SEXO)}
        />
        <CampoTexto etiqueta="Raza" value={datos.raza ?? ''} onChange={(e) => cambiar('raza', e.target.value)} />
        <CampoTexto
          etiqueta="Fecha de nacimiento"
          type="date"
          max={hoyBogota()}
          value={datos.fechaNacimiento ?? ''}
          onChange={(e) => cambiar('fechaNacimiento', e.target.value || undefined)}
        />
        <CampoTexto
          etiqueta="Peso (kg)"
          type="number"
          min={0.1}
          step={0.1}
          value={datos.peso ?? ''}
          onChange={(e) => cambiar('peso', e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Registrar mascota'}
        </Button>
        {alCancelar && (
          <Button type="button" variante="secundario" onClick={alCancelar}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}
