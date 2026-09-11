import { createBrowserRouter } from 'react-router-dom'

import { DashboardPage } from '@/app/DashboardPage'
import { HomePage } from '@/app/HomePage'
import { AppLayout } from '@/components/layout/AppLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AdopcionAdminPage } from '@/features/adopcion/pages/AdopcionAdminPage'
import { CatalogoAdopcionPage } from '@/features/adopcion/pages/CatalogoAdopcionPage'
import { IngresarPage } from '@/features/auth/pages/IngresarPage'
import { CitasPage } from '@/features/citas/pages/CitasPage'
import { DoctoresPage } from '@/features/doctores/pages/DoctoresPage'
import { HistoriasClinicasPage } from '@/features/historias-clinicas/pages/HistoriasClinicasPage'
import { InventarioPage } from '@/features/inventario/pages/InventarioPage'
import { RecordatoriosPage } from '@/features/recordatorios/pages/RecordatoriosPage'
import { VentasPage } from '@/features/ventas/pages/VentasPage'

export const router = createBrowserRouter([
  {
    // Zona publica: landing, catalogo de adopcion e ingreso.
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/adopcion', element: <CatalogoAdopcionPage /> },
      { path: '/ingresar', element: <IngresarPage /> },
    ],
  },
  {
    // Zona autenticada: modulos de gestion de la clinica.
    path: '/app',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'historias-clinicas', element: <HistoriasClinicasPage /> },
      { path: 'citas', element: <CitasPage /> },
      { path: 'doctores', element: <DoctoresPage /> },
      { path: 'inventario', element: <InventarioPage /> },
      { path: 'ventas', element: <VentasPage /> },
      { path: 'recordatorios', element: <RecordatoriosPage /> },
      { path: 'adopcion', element: <AdopcionAdminPage /> },
    ],
  },
])
