import { verificar } from '@/lib/errores'
import { supabase } from '@/lib/supabase'
import type {
  DatosMascotaAdopcion,
  DatosRefugio,
  FiltrosCatalogo,
  ID,
  MascotaAdopcion,
  MascotaAdopcionConRefugio,
  Refugio,
} from '@/types'

/* ------------------------------ Conversión ------------------------------- */

const COLUMNAS_MASCOTA =
  'id, refugio_id, nombre, especie, edad_meses, tamano, sexo, ciudad, descripcion, estado_salud, foto_url, estado, publicada_en, adoptada_en'

const COLUMNAS_REFUGIO =
  'id, perfil_id, nombre, ciudad, descripcion, telefono, email_contacto, redes_sociales, aprobado, creado_en'

type Fila = Record<string, unknown>

function aMascota(f: Fila): MascotaAdopcion {
  return {
    id: f.id as ID,
    refugioId: f.refugio_id as ID,
    nombre: f.nombre as string,
    especie: f.especie as MascotaAdopcion['especie'],
    edadMeses: f.edad_meses as number,
    tamano: f.tamano as MascotaAdopcion['tamano'],
    sexo: f.sexo as MascotaAdopcion['sexo'],
    ciudad: f.ciudad as string,
    descripcion: f.descripcion as string,
    estadoSalud: f.estado_salud as string,
    fotoUrl: (f.foto_url as string | null) ?? null,
    estado: f.estado as MascotaAdopcion['estado'],
    publicadaEn: f.publicada_en as string,
    adoptadaEn: (f.adoptada_en as string | null) ?? null,
  }
}

function aRefugio(f: Fila): Refugio {
  return {
    id: f.id as ID,
    perfilId: (f.perfil_id as ID | null) ?? null,
    nombre: f.nombre as string,
    ciudad: f.ciudad as string,
    descripcion: f.descripcion as string,
    telefono: (f.telefono as string | null) ?? null,
    emailContacto: (f.email_contacto as string | null) ?? null,
    redesSociales: (f.redes_sociales as string | null) ?? null,
    aprobado: f.aprobado as boolean,
    creadoEn: f.creado_en as string,
  }
}

function filaMascota(d: Partial<DatosMascotaAdopcion>) {
  return {
    nombre: d.nombre,
    especie: d.especie,
    edad_meses: d.edadMeses,
    tamano: d.tamano,
    sexo: d.sexo,
    ciudad: d.ciudad,
    descripcion: d.descripcion,
    estado_salud: d.estadoSalud,
    foto_url: d.fotoUrl,
    estado: d.estado,
  }
}

function filaRefugio(d: DatosRefugio) {
  return {
    nombre: d.nombre,
    ciudad: d.ciudad,
    descripcion: d.descripcion,
    telefono: d.telefono || null,
    email_contacto: d.emailContacto || null,
    redes_sociales: d.redesSociales || null,
  }
}

/* --------------------------- Catálogo público ---------------------------- */

/** Rangos de edad en meses del filtro del catálogo (REQ-ADO-04). */
export const RANGOS_EDAD: Record<NonNullable<FiltrosCatalogo['edad']>, { etiqueta: string; min: number; max?: number }> = {
  cachorro: { etiqueta: 'Cachorro (menos de 1 año)', min: 0, max: 11 },
  joven: { etiqueta: 'Joven (1 a 3 años)', min: 12, max: 35 },
  adulto: { etiqueta: 'Adulto (3 a 8 años)', min: 36, max: 95 },
  senior: { etiqueta: 'Senior (8 años o más)', min: 96 },
}

/**
 * REQ-ADO-01/04/05: mascotas disponibles o en proceso, con filtros
 * combinables. La política RLS ya oculta las adoptadas y las de refugios no
 * aprobados; el filtro de estado aquí es solo para que la consulta use el índice.
 */
export async function listarCatalogo(filtros: FiltrosCatalogo): Promise<MascotaAdopcion[]> {
  let consulta = supabase
    .from('mascotas_adopcion')
    .select(COLUMNAS_MASCOTA)
    .in('estado', ['disponible', 'en_proceso'])
    .order('estado', { ascending: true })
    .order('publicada_en', { ascending: false })

  if (filtros.especie) consulta = consulta.eq('especie', filtros.especie)
  if (filtros.tamano) consulta = consulta.eq('tamano', filtros.tamano)
  if (filtros.sexo) consulta = consulta.eq('sexo', filtros.sexo)
  if (filtros.ciudad) consulta = consulta.eq('ciudad', filtros.ciudad)
  if (filtros.edad) {
    const rango = RANGOS_EDAD[filtros.edad]
    consulta = consulta.gte('edad_meses', rango.min)
    if (rango.max !== undefined) consulta = consulta.lte('edad_meses', rango.max)
  }

  return (verificar(await consulta) ?? []).map(aMascota)
}

/** Ciudades con mascotas publicadas, para el filtro. */
export async function listarCiudadesCatalogo(): Promise<string[]> {
  const filas = verificar(
    await supabase.from('mascotas_adopcion').select('ciudad').in('estado', ['disponible', 'en_proceso']),
  )
  return [...new Set((filas ?? []).map((f) => f.ciudad as string))].sort((a, b) => a.localeCompare(b, 'es'))
}

export async function obtenerMascotaPublica(id: ID): Promise<MascotaAdopcionConRefugio | null> {
  const fila = verificar(
    await supabase
      .from('mascotas_adopcion')
      .select(`${COLUMNAS_MASCOTA}, refugio:refugios (id, nombre, ciudad, telefono, email_contacto, redes_sociales)`)
      .eq('id', id)
      .maybeSingle(),
  )
  if (!fila) return null
  const r = fila.refugio as unknown as Fila
  return {
    ...aMascota(fila),
    refugio: {
      id: r.id as ID,
      nombre: r.nombre as string,
      ciudad: r.ciudad as string,
      telefono: (r.telefono as string | null) ?? null,
      emailContacto: (r.email_contacto as string | null) ?? null,
      redesSociales: (r.redes_sociales as string | null) ?? null,
    },
  }
}

/* ------------------------------ Refugio ---------------------------------- */

export async function obtenerMiRefugio(perfilId: ID): Promise<Refugio | null> {
  const fila = verificar(
    await supabase.from('refugios').select(COLUMNAS_REFUGIO).eq('perfil_id', perfilId).maybeSingle(),
  )
  return fila ? aRefugio(fila) : null
}

export async function crearRefugio(perfilId: ID, datos: DatosRefugio): Promise<Refugio> {
  const fila = verificar(
    await supabase
      .from('refugios')
      .insert({ ...filaRefugio(datos), perfil_id: perfilId })
      .select(COLUMNAS_REFUGIO)
      .single(),
  )
  return aRefugio(fila)
}

export async function actualizarRefugio(id: ID, datos: DatosRefugio): Promise<Refugio> {
  const fila = verificar(
    await supabase.from('refugios').update(filaRefugio(datos)).eq('id', id).select(COLUMNAS_REFUGIO).single(),
  )
  return aRefugio(fila)
}

/** Para el administrador del sistema (REQ-ADO-03). */
export async function listarRefugios(): Promise<Refugio[]> {
  const filas = verificar(
    await supabase.from('refugios').select(COLUMNAS_REFUGIO).order('aprobado').order('creado_en', { ascending: false }),
  )
  return (filas ?? []).map(aRefugio)
}

export async function cambiarAprobacionRefugio(id: ID, aprobado: boolean) {
  verificar(await supabase.from('refugios').update({ aprobado }).eq('id', id))
}

/* -------------------------- Mascotas del refugio ------------------------- */

export async function listarMascotasRefugio(refugioId: ID): Promise<MascotaAdopcion[]> {
  const filas = verificar(
    await supabase
      .from('mascotas_adopcion')
      .select(COLUMNAS_MASCOTA)
      .eq('refugio_id', refugioId)
      .order('publicada_en', { ascending: false }),
  )
  return (filas ?? []).map(aMascota)
}

export async function publicarMascota(refugioId: ID, datos: DatosMascotaAdopcion): Promise<MascotaAdopcion> {
  const fila = verificar(
    await supabase
      .from('mascotas_adopcion')
      .insert({ ...filaMascota(datos), refugio_id: refugioId })
      .select(COLUMNAS_MASCOTA)
      .single(),
  )
  return aMascota(fila)
}

export async function actualizarMascota(id: ID, datos: Partial<DatosMascotaAdopcion>): Promise<MascotaAdopcion> {
  const fila = verificar(
    await supabase.from('mascotas_adopcion').update(filaMascota(datos)).eq('id', id).select(COLUMNAS_MASCOTA).single(),
  )
  return aMascota(fila)
}

export async function eliminarMascota(id: ID) {
  verificar(await supabase.from('mascotas_adopcion').delete().eq('id', id))
}

/**
 * Sube la foto al bucket público `adopcion`, dentro de la carpeta del usuario
 * (la política de Storage solo permite escribir en adopcion/<uid>/...).
 */
export async function subirFoto(perfilId: ID, archivo: File): Promise<string> {
  const extension = archivo.name.split('.').pop()?.toLowerCase() || 'jpg'
  const ruta = `${perfilId}/${crypto.randomUUID()}.${extension}`
  verificar(
    await supabase.storage.from('adopcion').upload(ruta, archivo, {
      contentType: archivo.type,
      upsert: false,
    }),
  )
  return supabase.storage.from('adopcion').getPublicUrl(ruta).data.publicUrl
}
