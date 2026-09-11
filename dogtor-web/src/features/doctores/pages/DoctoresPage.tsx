import { ModuloEnConstruccion } from '@/components/ui/ModuloEnConstruccion'

export function DoctoresPage() {
  return (
    <ModuloEnConstruccion
      titulo="Doctores y turnos"
      descripcion="Perfiles, especialidades, turnos y disponibilidad de urgencias 24 horas."
      requerimientos={[
        'REQ-DOC-01 Perfil con especialidad y sede',
        'REQ-DOC-02 Turnos por día de la semana',
        'REQ-DOC-03 Sedes con urgencias 24h',
        'REQ-DOC-04 Urgencias disponibles en tiempo real',
        'REQ-DOC-05 Bloqueo de disponibilidad',
        'REQ-DOC-06 Notificación de citas afectadas',
      ]}
    />
  )
}
