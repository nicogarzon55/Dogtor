import { useCallback, useEffect, useState } from 'react'

import { mensajeError } from '@/lib/errores'

interface Estado<T> {
  clave: string
  datos?: T
  error?: string
}

/**
 * Ejecuta una consulta asíncrona cada vez que cambia `clave` y descarta
 * respuestas viejas (si el usuario cambia un filtro rápido, gana la última).
 *
 * Mientras recarga con la misma clave conserva los datos anteriores, para que
 * la lista no parpadee después de una acción.
 */
export function useConsulta<T>(consulta: () => Promise<T>, clave: string) {
  const [estado, setEstado] = useState<Estado<T>>({ clave: '' })
  const [version, setVersion] = useState(0)
  const claveActual = `${clave}#${version}`

  useEffect(() => {
    let vigente = true
    consulta()
      .then((datos) => vigente && setEstado({ clave: claveActual, datos }))
      .catch((err) => vigente && setEstado({ clave: claveActual, error: mensajeError(err) }))
    return () => {
      vigente = false
    }
    // La consulta se identifica por su clave; no se re-ejecuta por identidad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveActual])

  const alDia = estado.clave === claveActual
  const mismaBase = estado.clave.startsWith(`${clave}#`)

  return {
    datos: alDia || mismaBase ? estado.datos : undefined,
    error: alDia ? estado.error : undefined,
    cargando: !alDia,
    recargar: useCallback(() => setVersion((v) => v + 1), []),
  }
}
