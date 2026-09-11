import { ModuloEnConstruccion } from '@/components/ui/ModuloEnConstruccion'

export function AdopcionAdminPage() {
  return (
    <ModuloEnConstruccion
      titulo="Adopción (refugios)"
      descripcion="Publicación y seguimiento de mascotas disponibles para adopción."
      requerimientos={[
        'REQ-ADO-01 Publicar mascota con foto y estado',
        'REQ-ADO-02 Marcar como adoptada',
        'REQ-ADO-03 Aprobación previa del refugio',
        'REQ-ADO-05 Estado "en proceso de adopción"',
      ]}
    />
  )
}
