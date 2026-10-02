import { verificar } from '@/lib/errores'
import { supabase } from '@/lib/supabase'
import type { Perfil, Rol, TipoCuenta } from '@/types'

export interface DatosRegistro {
  nombre: string
  apellido: string
  telefono: string
  email: string
  password: string
  tipoCuenta: TipoCuenta
  aceptaDatos: boolean
}

export async function ingresar(email: string, password: string) {
  verificar(await supabase.auth.signInWithPassword({ email, password }))
}

/**
 * Crea la cuenta. Supabase cifra la contraseña (bcrypt) y el trigger
 * `crear_perfil_nuevo_usuario` arma el perfil con el rol según el tipo de
 * cuenta. Devuelve false si el proyecto exige confirmar el correo.
 */
export async function registrar(datos: DatosRegistro): Promise<boolean> {
  const { session } = verificar(
    await supabase.auth.signUp({
      email: datos.email,
      password: datos.password,
      options: {
        emailRedirectTo: `${window.location.origin}/ingresar`,
        data: {
          nombre: datos.nombre,
          apellido: datos.apellido,
          telefono: datos.telefono,
          tipo_cuenta: datos.tipoCuenta,
          acepta_datos: datos.aceptaDatos,
        },
      },
    }),
  )
  return session !== null
}

export async function salir() {
  await supabase.auth.signOut()
}

export async function obtenerPerfil(id: string, email: string): Promise<Perfil | null> {
  const fila = verificar(
    await supabase
      .from('perfiles')
      .select('id, nombre, apellido, telefono, rol')
      .eq('id', id)
      .maybeSingle(),
  )
  if (!fila) return null
  return {
    id: fila.id,
    nombre: fila.nombre,
    apellido: fila.apellido,
    telefono: fila.telefono ?? undefined,
    rol: fila.rol as Rol,
    email,
  }
}

/** Ruta de inicio de cada rol después de ingresar. */
export function rutaInicial(rol: Rol): string {
  return rol === 'admin_refugio' ? '/app/adopcion' : '/app'
}
