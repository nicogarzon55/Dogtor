import { ModuloEnConstruccion } from '@/components/ui/ModuloEnConstruccion'

export function VentasPage() {
  return (
    <ModuloEnConstruccion
      titulo="Ventas"
      descripcion="Venta de productos con trazabilidad hacia el historial clínico y el inventario."
      requerimientos={[
        'REQ-VEN-01 Venta asociada a mascota',
        'REQ-VEN-02 Comprobante de venta',
        'REQ-VEN-03 Descuentos por rol autorizado',
        'REQ-VEN-04 Historial de compras',
        'REQ-VEN-05 Descuento automático de inventario',
        'REQ-VEN-06 Reporte de ventas por periodo',
      ]}
    />
  )
}
