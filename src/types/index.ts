/**
 * Modelo de dominio de Dogtor.
 * Refleja las entidades descritas en el Documento de Requerimientos v1.0.
 * En la base de datos los nombres van en snake_case; cada `services/` del
 * módulo convierte las filas a estos tipos en camelCase.
 * Las fechas viajan como ISO 8601 (string) porque la API REST intercambia JSON.
 */

export type ID = string

/* ------------------------------- Usuarios -------------------------------- */

/** Clases de usuario definidas en el documento de requerimientos. */
export type Rol =
  | 'propietario'
  | 'doctor'
  | 'admin_clinica'
  | 'admin_refugio'
  | 'adoptante'
  | 'admin_sistema'

/** Perfil del usuario autenticado (tabla perfiles, 1:1 con auth.users). */
export interface Perfil {
  id: ID
  nombre: string
  apellido: string
  email: string
  telefono?: string
  rol: Rol
}

/** Tipos de cuenta que se pueden crear desde el registro público. */
export type TipoCuenta = 'propietario' | 'refugio'

/* -------------------------------- Clinica -------------------------------- */

export interface Sede {
  id: ID
  nombre: string
  direccion: string
  ciudad: string
  telefono: string
  /** REQ-DOC-03: sedes con atencion de urgencias las 24 horas. */
  urgencias24h: boolean
  /** REQ-AGC-04: antelacion minima (en horas) para cancelar o reprogramar. */
  antelacionMinimaCancelacionHoras: number
}

export type Especialidad =
  | 'medicina_general'
  | 'cirugia'
  | 'dermatologia'
  | 'odontologia'
  | 'urgencias'

export interface Doctor {
  id: ID
  usuarioId: ID
  nombreCompleto: string
  especialidad: Especialidad
  /** REQ-DOC-01: obligatorio junto con la sede. */
  tarjetaProfesional: string
  sedeId: ID
  activo: boolean
}

/** Doctor con su sede, tal como se muestra al agendar. */
export interface DoctorConSede extends Doctor {
  sede: Pick<Sede, 'id' | 'nombre' | 'direccion' | 'urgencias24h'>
}

/** REQ-DOC-02: turnos por dia de la semana (0 = domingo ... 6 = sabado). */
export interface Turno {
  id: ID
  doctorId: ID
  diaSemana: 0 | 1 | 2 | 3 | 4 | 5 | 6
  horaInicio: string
  horaFin: string
}

/** REQ-DOC-05: bloqueo por vacaciones, incapacidad o permiso. */
export interface BloqueoDisponibilidad {
  id: ID
  doctorId: ID
  desde: string
  hasta: string
  motivo: 'vacaciones' | 'incapacidad' | 'permiso' | 'otro'
}

/* -------------------------- Mascotas y propietarios ----------------------- */

export type Especie = 'perro' | 'gato' | 'ave' | 'roedor' | 'otro'
export type Sexo = 'macho' | 'hembra'
export type Tamano = 'pequeno' | 'mediano' | 'grande'

export interface Propietario {
  id: ID
  usuarioId: ID
  documento: string
  nombreCompleto: string
  telefono: string
  email: string
}

export interface Mascota {
  id: ID
  propietarioId: ID
  nombre: string
  especie: Especie
  raza?: string
  sexo: Sexo
  fechaNacimiento?: string
  peso?: number
}

export type DatosMascota = Omit<Mascota, 'id' | 'propietarioId'>

/* --------------------------- Historias clinicas --------------------------- */

export type TipoEventoClinico =
  | 'vacuna'
  | 'diagnostico'
  | 'tratamiento'
  | 'cirugia'
  | 'alergia'
  | 'venta'

export interface Adjunto {
  id: ID
  nombre: string
  url: string
  tipo: 'pdf' | 'imagen'
}

/** REQ-HCL-01: una ficha activa por mascota. */
export interface HistoriaClinica {
  id: ID
  mascotaId: ID
  propietarioId: ID
  creadaEn: string
  eventos: EventoClinico[]
}

/** REQ-HCL-02: todo evento guarda fecha, tipo y doctor responsable. */
export interface EventoClinico {
  id: ID
  historiaClinicaId: ID
  tipo: TipoEventoClinico
  fecha: string
  doctorId: ID
  descripcion: string
  /** REQ-HCL-05: resultados de laboratorio, imagenes, formulas. */
  adjuntos: Adjunto[]
  /** Solo para tipo vacuna: permite calcular el refuerzo (REQ-REC-02). */
  proximaDosis?: string
  /** Solo para tipo venta: enlaza con el modulo de ventas (REQ-VEN-01). */
  ventaId?: ID
}

/* ---------------------------------- Citas --------------------------------- */

export type TipoConsulta = 'control' | 'vacunacion' | 'urgencia' | 'cirugia'
export type EstadoCita = 'programada' | 'atendida' | 'cancelada' | 'reprogramada'

export interface Cita {
  id: ID
  mascotaId: ID
  propietarioId: ID
  doctorId: ID
  sedeId: ID
  inicio: string
  fin: string
  tipoConsulta: TipoConsulta
  /** REQ-AGC-07: motivo visible para el doctor antes de la atencion. */
  motivo: string
  estado: EstadoCita
}

/** Cita con los nombres que se muestran en listas e historial (REQ-AGC-08). */
export interface CitaDetalle extends Cita {
  mascotaNombre: string
  doctorNombre: string
  especialidad: Especialidad
  sedeNombre: string
  propietarioNombre?: string
}

/** Franja ofrecida al propietario al agendar (REQ-AGC-01). */
export interface FranjaDisponible {
  inicio: string
  fin: string
}

/** Datos que el propietario envía al agendar. */
export interface NuevaCita {
  mascotaId: ID
  doctorId: ID
  inicio: string
  tipoConsulta: TipoConsulta
  motivo: string
}

/* -------------------------------- Inventario ------------------------------ */

export type CategoriaProducto =
  | 'medicamento'
  | 'alimento'
  | 'accesorio'
  | 'insumo_medico'

export interface Producto {
  id: ID
  nombre: string
  categoria: CategoriaProducto
  precioUnitario: number
  stock: number
  /** REQ-INV-01: umbral que dispara la alerta de desabastecimiento. */
  stockMinimo: number
  sedeId: ID
}

/** REQ-INV-04: entrada de inventario asociada a un proveedor. */
export interface Lote {
  id: ID
  productoId: ID
  proveedorId: ID
  numeroLote: string
  cantidad: number
  fechaVencimiento: string
}

/** REQ-INV-05: kardex de movimientos con trazabilidad de usuario y fecha. */
export interface MovimientoInventario {
  id: ID
  productoId: ID
  tipo: 'entrada' | 'salida'
  cantidad: number
  fecha: string
  usuarioId: ID
  /** Venta o consulta que origino la salida. */
  referencia?: string
}

export interface Proveedor {
  id: ID
  nombre: string
  nit: string
  contacto?: string
}

export type TipoAlertaInventario = 'stock_bajo' | 'proximo_vencimiento'

export interface AlertaInventario {
  id: ID
  productoId: ID
  tipo: TipoAlertaInventario
  mensaje: string
  generadaEn: string
}

/* ---------------------------------- Ventas -------------------------------- */

export interface ItemVenta {
  productoId: ID
  nombreProducto: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface Venta {
  id: ID
  fecha: string
  items: ItemVenta[]
  subtotal: number
  /** REQ-VEN-03: solo aplicable por usuarios con rol autorizado. */
  descuento: number
  descuentoAplicadoPor?: ID
  total: number
  propietarioId?: ID
  /** REQ-VEN-01: asociacion opcional al historial clinico. */
  mascotaId?: ID
  registradaPor: ID
}

/* ------------------------------ Recordatorios ----------------------------- */

export type TipoRecordatorio = 'cita' | 'vacuna' | 'control'
export type CanalNotificacion = 'email' | 'plataforma'
export type EstadoEntrega = 'pendiente' | 'enviado' | 'fallido'

export interface Recordatorio {
  id: ID
  tipo: TipoRecordatorio
  propietarioId: ID
  mascotaId: ID
  canal: CanalNotificacion
  fechaProgramada: string
  fechaEnvio?: string
  estado: EstadoEntrega
  mensaje: string
}

/* -------------------------------- Adopcion -------------------------------- */

export type EstadoAdopcion = 'disponible' | 'en_proceso' | 'adoptada'

/** REQ-ADO-03: un refugio debe ser aprobado antes de poder publicar. */
export interface Refugio {
  id: ID
  perfilId: ID | null
  nombre: string
  ciudad: string
  descripcion: string
  telefono: string | null
  emailContacto: string | null
  redesSociales: string | null
  aprobado: boolean
  creadoEn: string
}

export type DatosRefugio = Pick<
  Refugio,
  'nombre' | 'ciudad' | 'descripcion' | 'telefono' | 'emailContacto' | 'redesSociales'
>

export interface MascotaAdopcion {
  id: ID
  refugioId: ID
  nombre: string
  especie: Especie
  edadMeses: number
  tamano: Tamano
  sexo: Sexo
  ciudad: string
  descripcion: string
  estadoSalud: string
  fotoUrl: string | null
  estado: EstadoAdopcion
  publicadaEn: string
  adoptadaEn: string | null
}

/** Ficha pública: incluye el contacto del refugio (el adoptante lo contacta). */
export interface MascotaAdopcionConRefugio extends MascotaAdopcion {
  refugio: Pick<Refugio, 'id' | 'nombre' | 'ciudad' | 'telefono' | 'emailContacto' | 'redesSociales'>
}

export type DatosMascotaAdopcion = Omit<
  MascotaAdopcion,
  'id' | 'refugioId' | 'publicadaEn' | 'adoptadaEn'
>

/** REQ-ADO-04: filtros combinables del catálogo. */
export interface FiltrosCatalogo {
  especie?: Especie
  tamano?: Tamano
  sexo?: Sexo
  ciudad?: string
  /** Rango de edad en meses. */
  edad?: 'cachorro' | 'joven' | 'adulto' | 'senior'
}

/* --------------------------- Respuestas de la API ------------------------- */

export interface RespuestaPaginada<T> {
  datos: T[]
  pagina: number
  porPagina: number
  total: number
}
