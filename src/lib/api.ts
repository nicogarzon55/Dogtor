/**
 * Cliente HTTP genérico para una API REST propia.
 * En la iteración 1 los datos van por Supabase (src/lib/supabase.ts); este
 * cliente se conserva por si más adelante se agrega un backend propio.
 */

const BASE_URL = 'http://localhost:8080/api'

export class ApiError extends Error {
  readonly status: number
  readonly detalle?: unknown

  constructor(message: string, status: number, detalle?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detalle = detalle
  }
}

type Opciones = Omit<RequestInit, 'body'> & { body?: unknown }

async function request<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { body, headers, ...resto } = opciones

  const respuesta = await fetch(`${BASE_URL}${ruta}`, {
    ...resto,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
  })

  if (!respuesta.ok) {
    const detalle = await respuesta.json().catch(() => undefined)
    throw new ApiError(
      `Error ${respuesta.status} al consultar ${ruta}`,
      respuesta.status,
      detalle,
    )
  }

  if (respuesta.status === 204) return undefined as T

  return (await respuesta.json()) as T
}

export const api = {
  get: <T>(ruta: string) => request<T>(ruta),
  post: <T>(ruta: string, body: unknown) => request<T>(ruta, { method: 'POST', body }),
  put: <T>(ruta: string, body: unknown) => request<T>(ruta, { method: 'PUT', body }),
  patch: <T>(ruta: string, body: unknown) => request<T>(ruta, { method: 'PATCH', body }),
  delete: <T>(ruta: string) => request<T>(ruta, { method: 'DELETE' }),
}
