import { ModuloEnConstruccion } from '@/components/ui/ModuloEnConstruccion'

export function CitasPage() {
  return (
    <ModuloEnConstruccion
      titulo="Agendamiento de citas"
      descripcion="Agenda en línea con disponibilidad de doctores en tiempo real."
      requerimientos={[
        'REQ-AGC-01 Disponibilidad en tiempo real',
        'REQ-AGC-02 Bloqueo de cruces de agenda',
        'REQ-AGC-03 Confirmación a propietario y doctor',
        'REQ-AGC-04 Cancelación y reprogramación',
        'REQ-AGC-05 Filtro por especialidad',
        'REQ-AGC-06 Lista de espera',
        'REQ-AGC-07 Motivo de consulta',
        'REQ-AGC-08 Historial de citas',
      ]}
    />
  )
}
