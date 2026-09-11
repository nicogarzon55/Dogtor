import { ModuloEnConstruccion } from '@/components/ui/ModuloEnConstruccion'

export function InventarioPage() {
  return (
    <ModuloEnConstruccion
      titulo="Inventario"
      descripcion="Existencias de medicamentos y productos, kardex y alertas automáticas."
      requerimientos={[
        'REQ-INV-01 Alerta de stock mínimo',
        'REQ-INV-02 Alerta de vencimiento (30 días)',
        'REQ-INV-03 Descuento automático de stock',
        'REQ-INV-04 Entradas con proveedor y lote',
        'REQ-INV-05 Kardex de movimientos',
        'REQ-INV-06 Clasificación por categoría',
        'REQ-INV-07 Reporte de alertas',
      ]}
    />
  )
}
