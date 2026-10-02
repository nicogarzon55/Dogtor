/**
 * Formato de fechas y etiquetas legibles. Toda la operación es en Bogotá, así
 * que las horas se muestran siempre en America/Bogota sin importar el
 * dispositivo.
 */

import type {
  Especialidad,
  Especie,
  EstadoAdopcion,
  EstadoCita,
  Rol,
  Sexo,
  Tamano,
  TipoConsulta,
} from '@/types'

export const ZONA_HORARIA = 'America/Bogota'

const fechaLarga = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA_HORARIA,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const hora = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA_HORARIA,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})
const fechaCorta = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA_HORARIA,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export const formatoFechaLarga = (iso: string) => fechaLarga.format(new Date(iso))
export const formatoHora = (iso: string) => hora.format(new Date(iso))
export const formatoFechaCorta = (iso: string) => fechaCorta.format(new Date(iso))
export const formatoFechaHora = (iso: string) =>
  `${formatoFechaLarga(iso)} · ${formatoHora(iso)}`

/** Fecha de hoy en Bogotá como YYYY-MM-DD (valor de un <input type="date">). */
export function hoyBogota(desplazamientoDias = 0): string {
  const fecha = new Date(Date.now() + desplazamientoDias * 86_400_000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(fecha)
}

export function formatoEdad(meses: number): string {
  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`
  const anios = Math.floor(meses / 12)
  return `${anios} ${anios === 1 ? 'año' : 'años'}`
}

export const ETIQUETA_ESPECIE: Record<Especie, string> = {
  perro: 'Perro',
  gato: 'Gato',
  ave: 'Ave',
  roedor: 'Roedor',
  otro: 'Otro',
}

export const ETIQUETA_SEXO: Record<Sexo, string> = { macho: 'Macho', hembra: 'Hembra' }

export const ETIQUETA_TAMANO: Record<Tamano, string> = {
  pequeno: 'Pequeño',
  mediano: 'Mediano',
  grande: 'Grande',
}

export const ETIQUETA_ESTADO_ADOPCION: Record<EstadoAdopcion, string> = {
  disponible: 'Disponible',
  en_proceso: 'En proceso',
  adoptada: 'Adoptada',
}

export const ETIQUETA_ESPECIALIDAD: Record<Especialidad, string> = {
  medicina_general: 'Medicina general',
  cirugia: 'Cirugía',
  dermatologia: 'Dermatología',
  odontologia: 'Odontología',
  urgencias: 'Urgencias',
}

export const ETIQUETA_TIPO_CONSULTA: Record<TipoConsulta, string> = {
  control: 'Control',
  vacunacion: 'Vacunación',
  urgencia: 'Urgencia',
  cirugia: 'Cirugía',
}

export const ETIQUETA_ESTADO_CITA: Record<EstadoCita, string> = {
  programada: 'Programada',
  reprogramada: 'Reprogramada',
  atendida: 'Atendida',
  cancelada: 'Cancelada',
}

export const ETIQUETA_ROL: Record<Rol, string> = {
  propietario: 'Propietario',
  doctor: 'Doctor',
  admin_clinica: 'Administración clínica',
  admin_refugio: 'Refugio',
  adoptante: 'Adoptante',
  admin_sistema: 'Administrador del sistema',
}

/** Convierte un Record de etiquetas en opciones para un <select>. */
export function opciones<T extends string>(etiquetas: Record<T, string>) {
  return (Object.entries(etiquetas) as Array<[T, string]>).map(([valor, etiqueta]) => ({
    valor,
    etiqueta,
  }))
}
