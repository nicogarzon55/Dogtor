import { ModuloEnConstruccion } from '@/components/ui/ModuloEnConstruccion'

export function RecordatoriosPage() {
  return (
    <ModuloEnConstruccion
      titulo="Recordatorios"
      descripcion="Avisos automáticos de citas, refuerzos de vacunas y controles periódicos."
      requerimientos={[
        'REQ-REC-01 Recordatorio 24h antes de la cita',
        'REQ-REC-02 Refuerzo de vacuna con 7 días',
        'REQ-REC-03 Controles del plan de tratamiento',
        'REQ-REC-04 Canal de notificación preferido',
        'REQ-REC-05 Histórico de envíos',
      ]}
    />
  )
}
