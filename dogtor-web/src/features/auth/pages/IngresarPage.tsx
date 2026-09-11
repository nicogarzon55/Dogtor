import { ModuloEnConstruccion } from '@/components/ui/ModuloEnConstruccion'

export function IngresarPage() {
  return (
    <ModuloEnConstruccion
      titulo="Ingresar"
      descripcion="Autenticación y control de acceso por rol (propietario, doctor, administrador, refugio)."
      requerimientos={[
        'Cifrado de contraseñas',
        'Acceso a historias clínicas restringido por rol',
        'Sesión persistente en la plataforma',
      ]}
    />
  )
}
