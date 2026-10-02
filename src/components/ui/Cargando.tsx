export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-8 text-sm text-ink-muted">
      <span className="size-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      {texto}
    </div>
  )
}
