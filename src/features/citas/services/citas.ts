import { verificar } from '@/lib/errores'
import { supabase } from '@/lib/supabase'
import type {
  CitaDetalle,
  DatosMascota,
  DoctorConSede,
  Especialidad,
  FranjaDisponible,
  ID,
  Mascota,
  NuevaCita,
} from '@/types'

type Fila = Record<string, unknown>

/* -------------------------------- Mascotas ------------------------------- */

const COLUMNAS_MASCOTA = 'id, propietario_id, nombre, especie, raza, sexo, fecha_nacimiento, peso'

function aMascota(f: Fila): Mascota {
  return {
    id: f.id as ID,
    propietarioId: f.propietario_id as ID,
    nombre: f.nombre as string,
    especie: f.especie as Mascota['especie'],
    raza: (f.raza as string | null) ?? undefined,
    sexo: f.sexo as Mascota['sexo'],
    fechaNacimiento: (f.fecha_nacimiento as string | null) ?? undefined,
    peso: f.peso === null ? undefined : Number(f.peso),
  }
}

export async function listarMisMascotas(propietarioId: ID): Promise<Mascota[]> {
  const filas = verificar(
    await supabase.from('mascotas').select(COLUMNAS_MASCOTA).eq('propietario_id', propietarioId).order('nombre'),
  )
  return (filas ?? []).map(aMascota)
}

export async function registrarMascota(propietarioId: ID, d: DatosMascota): Promise<Mascota> {
  const fila = verificar(
    await supabase
      .from('mascotas')
      .insert({
        propietario_id: propietarioId,
        nombre: d.nombre,
        especie: d.especie,
        raza: d.raza || null,
        sexo: d.sexo,
        fecha_nacimiento: d.fechaNacimiento || null,
        peso: d.peso ?? null,
      })
      .select(COLUMNAS_MASCOTA)
      .single(),
  )
  return aMascota(fila)
}

/* -------------------------------- Doctores ------------------------------- */

/** REQ-AGC-05: doctores activos, opcionalmente filtrados por especialidad. */
export async function listarDoctores(especialidad?: Especialidad): Promise<DoctorConSede[]> {
  let consulta = supabase
    .from('doctores')
    .select('id, perfil_id, nombre_completo, especialidad, tarjeta_profesional, sede_id, activo, sede:sedes (id, nombre, direccion, urgencias_24h)')
    .eq('activo', true)
    .order('nombre_completo')
  if (especialidad) consulta = consulta.eq('especialidad', especialidad)

  return (verificar(await consulta) ?? []).map((f) => {
    const s = f.sede as unknown as Fila
    return {
      id: f.id,
      usuarioId: f.perfil_id,
      nombreCompleto: f.nombre_completo,
      especialidad: f.especialidad as Especialidad,
      tarjetaProfesional: f.tarjeta_profesional,
      sedeId: f.sede_id,
      activo: f.activo,
      sede: {
        id: s.id as ID,
        nombre: s.nombre as string,
        direccion: s.direccion as string,
        urgencias24h: s.urgencias_24h as boolean,
      },
    }
  })
}

/* --------------------------------- Agenda -------------------------------- */

/** REQ-AGC-01: franjas libres calculadas en la base de datos. */
export async function franjasDisponibles(doctorId: ID, fecha: string): Promise<FranjaDisponible[]> {
  const filas = verificar(
    await supabase.rpc('franjas_disponibles', { p_doctor_id: doctorId, p_fecha: fecha }),
  ) as Array<{ inicio: string; fin: string }> | null
  return filas ?? []
}

/**
 * Agenda la cita. La base de datos completa propietario, sede y hora de fin, y
 * rechaza cruces (REQ-AGC-02) aunque dos personas reserven a la vez.
 */
export async function agendarCita(c: NuevaCita): Promise<ID> {
  const fila = verificar(
    await supabase
      .from('citas')
      .insert({
        mascota_id: c.mascotaId,
        doctor_id: c.doctorId,
        inicio: c.inicio,
        // propietario_id, sede_id y fin los completa el trigger validar_cita.
        tipo_consulta: c.tipoConsulta,
        motivo: c.motivo.trim(),
      })
      .select('id')
      .single(),
  )
  return fila.id as ID
}

const SELECT_CITA = `
  id, mascota_id, propietario_id, doctor_id, sede_id, inicio, fin, tipo_consulta, motivo, estado,
  mascota:mascotas (nombre),
  doctor:doctores (nombre_completo, especialidad),
  sede:sedes (nombre),
  propietario:perfiles (nombre, apellido)
`

function aCita(f: Fila): CitaDetalle {
  const mascota = f.mascota as Fila | null
  const doctor = f.doctor as Fila | null
  const sede = f.sede as Fila | null
  const propietario = f.propietario as Fila | null
  return {
    id: f.id as ID,
    mascotaId: f.mascota_id as ID,
    propietarioId: f.propietario_id as ID,
    doctorId: f.doctor_id as ID,
    sedeId: f.sede_id as ID,
    inicio: f.inicio as string,
    fin: f.fin as string,
    tipoConsulta: f.tipo_consulta as CitaDetalle['tipoConsulta'],
    motivo: f.motivo as string,
    estado: f.estado as CitaDetalle['estado'],
    mascotaNombre: (mascota?.nombre as string) ?? '—',
    doctorNombre: (doctor?.nombre_completo as string) ?? '—',
    especialidad: doctor?.especialidad as CitaDetalle['especialidad'],
    sedeNombre: (sede?.nombre as string) ?? '—',
    propietarioNombre: propietario ? `${propietario.nombre} ${propietario.apellido}`.trim() : undefined,
  }
}

/** REQ-AGC-08: historial del propietario (la RLS ya limita a sus citas). */
export async function listarCitasPropietario(propietarioId: ID): Promise<CitaDetalle[]> {
  const filas = verificar(
    await supabase
      .from('citas')
      .select(SELECT_CITA)
      .eq('propietario_id', propietarioId)
      .order('inicio', { ascending: false }),
  )
  return (filas ?? []).map(aCita)
}

/** Agenda de un día para el personal de la clínica (o del doctor). */
export async function listarAgendaDia(fecha: string, doctorId?: ID): Promise<CitaDetalle[]> {
  // Límites del día en hora de Bogotá (UTC-5, sin horario de verano).
  const desde = `${fecha}T00:00:00-05:00`
  const hasta = `${fecha}T23:59:59-05:00`
  let consulta = supabase
    .from('citas')
    .select(SELECT_CITA)
    .gte('inicio', desde)
    .lte('inicio', hasta)
    .order('inicio')
  if (doctorId) consulta = consulta.eq('doctor_id', doctorId)
  return (verificar(await consulta) ?? []).map(aCita)
}

/** REQ-AGC-04 */
export async function cancelarCita(id: ID) {
  verificar(await supabase.rpc('cancelar_cita', { p_cita_id: id }))
}

/** REQ-AGC-04 */
export async function reprogramarCita(id: ID, nuevoInicio: string) {
  verificar(await supabase.rpc('reprogramar_cita', { p_cita_id: id, p_nuevo_inicio: nuevoInicio }))
}

export async function marcarAtendida(id: ID) {
  verificar(await supabase.from('citas').update({ estado: 'atendida' }).eq('id', id))
}
