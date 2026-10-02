/**
 * Traduce los errores de Supabase/Postgres a mensajes para el usuario.
 * Las reglas de negocio se validan en la base de datos (triggers y
 * restricciones), así que aquí solo se les da un texto legible.
 */

interface ErrorConCodigo {
  code?: string
  message?: string
}

const POR_CODIGO: Record<string, string> = {
  // exclusion_violation: restricción sin_cruce_doctor / sin_cruce_mascota
  '23P01': 'Esa franja acaba de ser tomada. Elige otro horario.',
  '23505': 'Ya existe un registro con esos datos.',
  '23514': 'Algún dato no cumple las reglas del formulario.',
  '42501': 'No tienes permiso para realizar esta acción.',
}

const POR_MENSAJE: Array<[RegExp, string]> = [
  [/Invalid login credentials/i, 'Correo o contraseña incorrectos.'],
  [/Email not confirmed/i, 'Debes confirmar tu correo antes de ingresar.'],
  [/User already registered/i, 'Ya existe una cuenta con ese correo.'],
  [/Password should be at least/i, 'La contraseña debe tener al menos 6 caracteres.'],
  [/row-level security/i, 'No tienes permiso para realizar esta acción.'],
  [/rate limit/i, 'Demasiados intentos. Espera unos minutos.'],
]

export function mensajeError(error: unknown): string {
  if (!error) return 'Ocurrió un error inesperado.'

  const e = error as ErrorConCodigo
  if (e.code && POR_CODIGO[e.code]) return POR_CODIGO[e.code]

  const mensaje = e.message ?? String(error)
  for (const [patron, texto] of POR_MENSAJE) {
    if (patron.test(mensaje)) return texto
  }

  // Los RAISE EXCEPTION de nuestras funciones ya vienen en español (P0001).
  if (e.code === 'P0001') return mensaje

  return mensaje || 'Ocurrió un error inesperado.'
}

/** Tipo de `data` en la rama exitosa de una respuesta de Supabase. */
type DatosDe<R> = R extends { error: null; data: infer D } ? D : never

/**
 * Lanza si la respuesta de Supabase trae error; si no, devuelve `data` con el
 * tipo de la rama exitosa. Con `.maybeSingle()` ese tipo ya incluye null.
 */
export function verificar<R extends { data: unknown; error: unknown }>(respuesta: R): DatosDe<R> {
  if (respuesta.error) throw respuesta.error
  return respuesta.data as DatosDe<R>
}
