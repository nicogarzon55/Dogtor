import type { Rol } from '@/types'

/**
 * Qué rol entra a qué módulo. Lo usan el router (protección de rutas) y el menú
 * lateral (solo muestra lo permitido). La autorización definitiva la hacen las
 * políticas RLS en Supabase; esto es para no mostrar pantallas inútiles.
 */

const CLINICA: Rol[] = ['admin_clinica', 'admin_sistema']

export const MODULOS_APP: Array<{ ruta: string; etiqueta: string; roles: Rol[]; exacto?: boolean }> = [
  {
    ruta: '/app',
    etiqueta: 'Panel',
    exacto: true,
    roles: ['propietario', 'doctor', 'admin_clinica', 'admin_refugio', 'admin_sistema'],
  },
  {
    ruta: '/app/citas',
    etiqueta: 'Citas',
    roles: ['propietario', 'doctor', ...CLINICA],
  },
  {
    ruta: '/app/historias-clinicas',
    etiqueta: 'Historias clínicas',
    roles: ['propietario', 'doctor', ...CLINICA],
  },
  { ruta: '/app/doctores', etiqueta: 'Doctores y turnos', roles: ['doctor', ...CLINICA] },
  { ruta: '/app/inventario', etiqueta: 'Inventario', roles: CLINICA },
  { ruta: '/app/ventas', etiqueta: 'Ventas', roles: CLINICA },
  { ruta: '/app/recordatorios', etiqueta: 'Recordatorios', roles: ['propietario', ...CLINICA] },
  { ruta: '/app/adopcion', etiqueta: 'Adopción', roles: ['admin_refugio', 'admin_sistema'] },
]

export function rolesDe(ruta: string): Rol[] {
  return MODULOS_APP.find((m) => m.ruta === ruta)?.roles ?? []
}
