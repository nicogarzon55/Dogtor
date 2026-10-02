import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

const control =
  'w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-brand-600 focus:outline-none disabled:bg-surface-muted disabled:text-ink-muted'

interface Envoltura {
  etiqueta: string
  ayuda?: ReactNode
  error?: string
  className?: string
}

function Marco({
  id,
  etiqueta,
  ayuda,
  error,
  className,
  requerido,
  children,
}: Envoltura & { id: string; requerido?: boolean; children: ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {etiqueta}
        {requerido && <span className="text-danger"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-ayuda`} className="text-xs text-danger">
          {error}
        </p>
      ) : (
        ayuda && (
          <p id={`${id}-ayuda`} className="text-xs text-ink-muted">
            {ayuda}
          </p>
        )
      )}
    </div>
  )
}

export function CampoTexto({
  etiqueta,
  ayuda,
  error,
  className,
  ...props
}: Envoltura & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <Marco id={id} etiqueta={etiqueta} ayuda={ayuda} error={error} className={className} requerido={props.required}>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={ayuda || error ? `${id}-ayuda` : undefined}
        className={cn(control, 'h-10')}
        {...props}
      />
    </Marco>
  )
}

interface Opcion {
  valor: string
  etiqueta: string
}

export function CampoSelect({
  etiqueta,
  ayuda,
  error,
  className,
  opciones,
  vacio,
  ...props
}: Envoltura &
  SelectHTMLAttributes<HTMLSelectElement> & {
    opciones: Opcion[]
    /** Texto de la primera opción vacía; si se omite no se agrega. */
    vacio?: string
  }) {
  const id = useId()
  return (
    <Marco id={id} etiqueta={etiqueta} ayuda={ayuda} error={error} className={className} requerido={props.required}>
      <select id={id} aria-invalid={Boolean(error)} className={cn(control, 'h-10 pr-8')} {...props}>
        {vacio !== undefined && <option value="">{vacio}</option>}
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </Marco>
  )
}

export function CampoArea({
  etiqueta,
  ayuda,
  error,
  className,
  ...props
}: Envoltura & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <Marco id={id} etiqueta={etiqueta} ayuda={ayuda} error={error} className={className} requerido={props.required}>
      <textarea id={id} rows={3} className={cn(control, 'py-2')} {...props} />
    </Marco>
  )
}
