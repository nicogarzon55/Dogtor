import type { ReactElement } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { DashboardPage } from '@/app/DashboardPage'
import { HomePage } from '@/app/HomePage'
import { rolesDe } from '@/app/permisos'
import { AppLayout } from '@/components/layout/AppLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AdopcionAdminPage } from '@/features/adopcion/pages/AdopcionAdminPage'
import { CatalogoAdopcionPage } from '@/features/adopcion/pages/CatalogoAdopcionPage'
import { DetalleMascotaAdopcionPage } from '@/features/adopcion/pages/DetalleMascotaAdopcionPage'
import { RequiereAuth } from '@/features/auth/components/RequiereAuth'
import { IngresarPage } from '@/features/auth/pages/IngresarPage'
import { CitasPage } from '@/features/citas/pages/CitasPage'
import { DoctoresPage } from '@/features/doctores/pages/DoctoresPage'
import { HistoriasClinicasPage } from '@/features/historias-clinicas/pages/HistoriasClinicasPage'
import { InventarioPage } from '@/features/inventario/pages/InventarioPage'
import { RecordatoriosPage } from '@/features/recordatorios/pages/RecordatoriosPage'
import { VentasPage } from '@/features/ventas/pages/VentasPage'

/** Envuelve una ruta del panel con la verificación de rol definida en permisos.ts. */
const conRol = (ruta: string, element: ReactElement) => ({
  element: <RequiereAuth roles={rolesDe(`/app/${ruta}`)} />,
  children: [{ path: ruta, element }],
})

export const router = createBrowserRouter([
  {
    // Zona pública: landing, catálogo de adopción e ingreso.
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/adopcion', element: <CatalogoAdopcionPage /> },
      { path: '/adopcion/:id', element: <DetalleMascotaAdopcionPage /> },
      { path: '/ingresar', element: <IngresarPage /> },
    ],
  },
  {
    // Zona autenticada: requiere sesión; cada módulo además exige su rol.
    path: '/app',
    element: <RequiereAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          conRol('citas', <CitasPage />),
          conRol('historias-clinicas', <HistoriasClinicasPage />),
          conRol('doctores', <DoctoresPage />),
          conRol('inventario', <InventarioPage />),
          conRol('ventas', <VentasPage />),
          conRol('recordatorios', <RecordatoriosPage />),
          conRol('adopcion', <AdopcionAdminPage />),
        ],
      },
    ],
  },
])
