import { Card } from '@/components/ui/Card'
import { Logo } from '@/components/ui/Logo'

/** Se muestra cuando falta el .env.local con los datos de Supabase. */
export function ConfiguracionPendiente() {
  return (
    <div className="grid min-h-screen place-items-center p-5">
      <Card className="max-w-lg">
        <div className="flex items-center gap-2.5">
          <Logo tamano={34} />
          <h1 className="text-xl font-semibold text-ink">Falta configurar Supabase</h1>
        </div>
        <p className="mt-3 text-sm text-ink-muted">
          Copia <code className="font-mono text-ink">.env.example</code> como{' '}
          <code className="font-mono text-ink">.env.local</code>, pon la URL del proyecto y la
          llave publicable, y reinicia <code className="font-mono text-ink">npm run dev</code>.
        </p>
      </Card>
    </div>
  )
}
