import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CampoSelect, CampoTexto } from '@/components/ui/Campo'
import { Cargando } from '@/components/ui/Cargando'
import { ingresar, registrar, rutaInicial, type DatosRegistro } from '@/features/auth/services/auth'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'
import { mensajeError } from '@/lib/errores'
import type { TipoCuenta } from '@/types'

type Modo = 'ingresar' | 'registro'

export function IngresarPage() {
  const { perfil, cargando } = useAuth()
  const ubicacion = useLocation()
  const [modo, setModo] = useState<Modo>('ingresar')

  if (cargando) return <Cargando texto="Verificando sesión…" />

  // Con sesión activa no tiene sentido mostrar el formulario.
  if (perfil) {
    const desde = (ubicacion.state as { desde?: string } | null)?.desde
    return <Navigate to={desde ?? rutaInicial(perfil.rol)} replace />
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-ink">
          {modo === 'ingresar' ? 'Ingresa a Dogtor' : 'Crea tu cuenta'}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {modo === 'ingresar'
            ? 'Agenda citas, consulta a tus mascotas o administra tu refugio.'
            : 'Para propietarios de mascotas y refugios de adopción.'}
        </p>
      </div>

      <div role="tablist" className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-surface p-1 ring-1 ring-line">
        {(['ingresar', 'registro'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={modo === m}
            onClick={() => setModo(m)}
            className={cn(
              'rounded-md py-2 text-sm font-medium transition-colors',
              modo === m ? 'bg-brand-600 text-white' : 'text-ink-muted hover:text-ink',
            )}
          >
            {m === 'ingresar' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        ))}
      </div>

      <Card>{modo === 'ingresar' ? <FormIngreso /> : <FormRegistro alTerminar={() => setModo('ingresar')} />}</Card>
    </div>
  )
}

function FormIngreso() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      await ingresar(email.trim(), password)
      // La redirección la hace IngresarPage cuando el perfil termina de cargar.
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      {error && <Aviso tipo="error">{error}</Aviso>}
      <CampoTexto
        etiqueta="Correo electrónico"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <CampoTexto
        etiqueta="Contraseña"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  )
}

const VACIO: DatosRegistro = {
  nombre: '',
  apellido: '',
  telefono: '',
  email: '',
  password: '',
  tipoCuenta: 'propietario',
  aceptaDatos: false,
}

function FormRegistro({ alTerminar }: { alTerminar: () => void }) {
  const [datos, setDatos] = useState<DatosRegistro>(VACIO)
  const [confirmacion, setConfirmacion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendienteCorreo, setPendienteCorreo] = useState(false)

  const cambiar = <K extends keyof DatosRegistro>(campo: K, valor: DatosRegistro[K]) =>
    setDatos((d) => ({ ...d, [campo]: valor }))

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (datos.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (datos.password !== confirmacion) return setError('Las contraseñas no coinciden.')
    if (!datos.aceptaDatos) return setError('Debes aceptar la política de tratamiento de datos.')

    setEnviando(true)
    try {
      const conSesion = await registrar({ ...datos, email: datos.email.trim() })
      // Si hay sesión, IngresarPage redirige sola al cargar el perfil.
      if (!conSesion) setPendienteCorreo(true)
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  if (pendienteCorreo) {
    return (
      <div className="space-y-4">
        <Aviso tipo="exito" titulo="Revisa tu correo">
          Te enviamos un enlace a <strong>{datos.email}</strong> para confirmar la cuenta. Después
          de confirmarla podrás ingresar.
        </Aviso>
        <Button variante="secundario" className="w-full" onClick={alTerminar}>
          Volver a ingresar
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      {error && <Aviso tipo="error">{error}</Aviso>}
      <CampoSelect
        etiqueta="Tipo de cuenta"
        value={datos.tipoCuenta}
        onChange={(e) => cambiar('tipoCuenta', e.target.value as TipoCuenta)}
        opciones={[
          { valor: 'propietario', etiqueta: 'Propietario de mascota' },
          { valor: 'refugio', etiqueta: 'Refugio o fundación de adopción' },
        ]}
        ayuda={
          datos.tipoCuenta === 'refugio'
            ? 'Tu refugio quedará pendiente de aprobación antes de poder publicar mascotas.'
            : 'Podrás registrar tus mascotas y agendar citas en línea.'
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto
          etiqueta="Nombre"
          required
          autoComplete="given-name"
          value={datos.nombre}
          onChange={(e) => cambiar('nombre', e.target.value)}
        />
        <CampoTexto
          etiqueta="Apellido"
          required
          autoComplete="family-name"
          value={datos.apellido}
          onChange={(e) => cambiar('apellido', e.target.value)}
        />
      </div>
      <CampoTexto
        etiqueta="Teléfono"
        type="tel"
        autoComplete="tel"
        value={datos.telefono}
        onChange={(e) => cambiar('telefono', e.target.value)}
      />
      <CampoTexto
        etiqueta="Correo electrónico"
        type="email"
        required
        autoComplete="email"
        value={datos.email}
        onChange={(e) => cambiar('email', e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto
          etiqueta="Contraseña"
          type="password"
          required
          autoComplete="new-password"
          ayuda="Mínimo 8 caracteres."
          value={datos.password}
          onChange={(e) => cambiar('password', e.target.value)}
        />
        <CampoTexto
          etiqueta="Confirmar contraseña"
          type="password"
          required
          autoComplete="new-password"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
        />
      </div>
      <label className="flex items-start gap-2.5 text-sm text-ink-muted">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-brand-600"
          checked={datos.aceptaDatos}
          onChange={(e) => cambiar('aceptaDatos', e.target.checked)}
        />
        <span>
          Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de 2012 (Habeas
          Data) para la prestación de los servicios de Dogtor.
        </span>
      </label>
      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
      </Button>
    </form>
  )
}
