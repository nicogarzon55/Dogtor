import { useState, type FormEvent } from 'react'

import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { CampoArea, CampoTexto } from '@/components/ui/Campo'
import { mensajeError } from '@/lib/errores'
import type { DatosRefugio } from '@/types'

const VACIO: DatosRefugio = {
  nombre: '',
  ciudad: 'Bogotá',
  descripcion: '',
  telefono: '',
  emailContacto: '',
  redesSociales: '',
}

export function FormRefugio({
  inicial,
  textoBoton,
  alGuardar,
}: {
  inicial?: DatosRefugio
  textoBoton: string
  alGuardar: (datos: DatosRefugio) => Promise<void>
}) {
  const [datos, setDatos] = useState<DatosRefugio>(inicial ?? VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cambiar = (campo: keyof DatosRefugio, valor: string) => setDatos((d) => ({ ...d, [campo]: valor }))

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!datos.telefono && !datos.emailContacto) {
      return setError('Indica al menos un teléfono o un correo para que los adoptantes te contacten.')
    }
    setGuardando(true)
    setError(null)
    try {
      await alGuardar(datos)
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      {error && <Aviso tipo="error">{error}</Aviso>}
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto etiqueta="Nombre del refugio o fundación" required value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />
        <CampoTexto etiqueta="Ciudad" required value={datos.ciudad} onChange={(e) => cambiar('ciudad', e.target.value)} />
      </div>
      <CampoArea
        etiqueta="Descripción"
        placeholder="¿Qué hace tu refugio? ¿Qué animales rescatan?"
        value={datos.descripcion}
        onChange={(e) => cambiar('descripcion', e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <CampoTexto
          etiqueta="Teléfono / WhatsApp"
          type="tel"
          value={datos.telefono ?? ''}
          onChange={(e) => cambiar('telefono', e.target.value)}
        />
        <CampoTexto
          etiqueta="Correo de contacto"
          type="email"
          value={datos.emailContacto ?? ''}
          onChange={(e) => cambiar('emailContacto', e.target.value)}
        />
        <CampoTexto
          etiqueta="Redes sociales"
          placeholder="@mirefugio"
          value={datos.redesSociales ?? ''}
          onChange={(e) => cambiar('redesSociales', e.target.value)}
        />
      </div>
      <Button type="submit" disabled={guardando}>
        {guardando ? 'Guardando…' : textoBoton}
      </Button>
    </form>
  )
}
