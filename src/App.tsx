import { RouterProvider } from 'react-router-dom'

import { router } from '@/app/router'
import { ConfiguracionPendiente } from '@/components/layout/ConfiguracionPendiente'
import { ProveedorAuth } from '@/features/auth/components/ProveedorAuth'
import { supabaseConfigurado } from '@/lib/supabase'

export default function App() {
  if (!supabaseConfigurado) return <ConfiguracionPendiente />

  return (
    <ProveedorAuth>
      <RouterProvider router={router} />
    </ProveedorAuth>
  )
}
