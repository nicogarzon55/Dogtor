import { ModuloEnConstruccion } from '@/components/ui/ModuloEnConstruccion'

export function CatalogoAdopcionPage() {
  return (
    <ModuloEnConstruccion
      titulo="Catálogo de adopción"
      descripcion="Vista pública de las mascotas disponibles, filtrable por especie, edad, tamaño y ciudad."
      requerimientos={[
        'REQ-ADO-01 Catálogo público',
        'REQ-ADO-04 Filtros combinables',
        'REQ-ADO-05 Etiqueta "En proceso"',
      ]}
    />
  )
}
