import { ModuloEnConstruccion } from '@/components/ui/ModuloEnConstruccion'

export function HistoriasClinicasPage() {
  return (
    <ModuloEnConstruccion
      titulo="Historias clínicas"
      descripcion="Ficha única por mascota con vacunas, diagnósticos, tratamientos, cirugías y alergias."
      requerimientos={[
        'REQ-HCL-01 Ficha única por mascota',
        'REQ-HCL-02 Registro de eventos clínicos',
        'REQ-HCL-03 Validación mascota/propietario',
        'REQ-HCL-04 Historial cronológico filtrable',
        'REQ-HCL-05 Adjuntos PDF e imagen',
        'REQ-HCL-06 Alerta de alergias',
        'REQ-HCL-07 Edición solo para doctores',
        'REQ-HCL-08 Exportación a PDF',
      ]}
    />
  )
}
