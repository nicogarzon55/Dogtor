# Dogtor · Frontend

Aplicación web responsiva de **Dogtor**, sistema de gestión veterinaria y adopción de
mascotas. Los datos viven en **Supabase** (PostgreSQL + Auth + Storage), que expone la base
como una API REST con mensajes JSON sobre HTTPS.

Proyecto académico — Gerencia de Proyectos, Politécnico Grancolombiano.

## Stack

| Pieza      | Tecnología            |
| ---------- | --------------------- |
| Build      | Vite 8                |
| UI         | React 19 + TypeScript |
| Estilos    | Tailwind CSS v4       |
| Enrutado   | React Router 7        |
| Backend    | Supabase (Postgres, Auth, Storage, RLS) |
| Tipografía | Outfit + Figtree      |
| Linter     | oxlint                |

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # URL del proyecto y llave PUBLICABLE de Supabase
npm run dev
```

> La llave `sb_secret_...` nunca va en el frontend ni en el repositorio: salta todas las
> reglas de seguridad. En `.env.local` solo va la `sb_publishable_...`.

### Base de datos

Los scripts están en `supabase/migrations/` y se ejecutan en orden en el SQL Editor de
Supabase (en el proyecto de Dogtor ya están aplicados):

| Archivo              | Contenido                                                          |
| -------------------- | ------------------------------------------------------------------ |
| `001_init.sql`       | Tablas, tipos, reglas de negocio (triggers/funciones) y RLS por rol |
| `002_storage.sql`    | Bucket público `adopcion` para fotos                                |
| `003_seed.sql`       | Datos de prueba: 2 sedes, 5 doctores con turnos, 1 refugio y 6 mascotas |
| `004_hardening.sql`  | Ajustes del asesor de seguridad de Supabase                         |

Las reglas importantes viven en la base de datos, no en el navegador:

- **Sin cruces de agenda (REQ-AGC-02):** restricción `EXCLUDE` sobre el rango de la cita por
  doctor y por mascota. Aunque dos personas reserven la misma franja al tiempo, solo una entra.
- **Franjas disponibles (REQ-AGC-01):** función `franjas_disponibles(doctor, fecha)` que arma
  franjas de 30 min desde los turnos y descuenta citas activas y bloqueos.
- **Cancelar / reprogramar (REQ-AGC-04):** funciones `cancelar_cita` y `reprogramar_cita` que
  exigen la antelación mínima de la sede al propietario.
- **Refugios aprobados (REQ-ADO-03):** solo el `admin_sistema` puede aprobar; un refugio sin
  aprobar no puede publicar ni aparece en el catálogo.
- **Roles:** nadie puede cambiarse el rol a sí mismo.

### Roles y cómo asignarlos

El registro público solo crea cuentas de **propietario** o **refugio**. Los demás roles se
asignan desde el SQL Editor:

```sql
-- Volver administrador del sistema (aprueba refugios, ve todo)
update perfiles set rol = 'admin_sistema'
where id = (select id from auth.users where email = 'correo@ejemplo.com');

-- Personal de la clínica: 'admin_clinica' o 'doctor'
update perfiles set rol = 'doctor'
where id = (select id from auth.users where email = 'doctora@ejemplo.com');

-- Vincular ese usuario a su ficha de doctor para que vea su agenda
update doctores set perfil_id = (select id from auth.users where email = 'doctora@ejemplo.com')
where tarjeta_profesional = 'MV-10234';
```

La aplicación queda en <http://localhost:5173>.

### Scripts

| Comando           | Qué hace                                      |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Servidor de desarrollo con recarga en caliente |
| `npm run build`   | Verifica tipos y genera el build de producción |
| `npm run preview` | Sirve el build de producción                   |
| `npm run lint`    | Analiza el código con oxlint                   |

## Estructura

```
src/
├── app/                  Router, landing y panel principal
├── components/
│   ├── layout/           AppLayout (privado) y PublicLayout (público)
│   └── ui/               Componentes base: Button, Card, PageHeader…
├── features/             Un módulo por funcionalidad del MVP
│   ├── auth/
│   ├── historias-clinicas/
│   ├── citas/
│   ├── doctores/
│   ├── inventario/
│   ├── ventas/
│   ├── recordatorios/
│   └── adopcion/
│       ├── components/   Componentes propios del módulo
│       ├── pages/        Vistas enrutadas
│       └── services/     Llamadas a la API del módulo
├── hooks/                useAuth, useConsulta
├── lib/                  Cliente Supabase, errores, formato de fechas y etiquetas
└── types/                Modelo de dominio compartido
```

Cada módulo es independiente (requerimiento no funcional de mantenibilidad): un cambio
en inventario no debe obligar a tocar adopción ni el módulo clínico. Los módulos comparten
únicamente `components/ui`, `lib` y `types`.

El alias `@/` apunta a `src/`, así que los imports quedan
`import { Button } from '@/components/ui/Button'`.

## Rutas

| Ruta                       | Acceso   | Módulo                      |
| -------------------------- | -------- | --------------------------- |
| `/`                        | Público  | Landing                     |
| `/adopcion`                | Público  | Catálogo de adopción        |
| `/adopcion/:id`            | Público  | Ficha y contacto del refugio |
| `/ingresar`                | Público  | Autenticación               |
| `/app`                     | Privado  | Panel / indicadores         |
| `/app/historias-clinicas`  | Privado  | Historias clínicas          |
| `/app/citas`               | Privado  | Agendamiento de citas       |
| `/app/doctores`            | Privado  | Doctores, turnos y urgencias |
| `/app/inventario`          | Privado  | Inventario y alertas        |
| `/app/ventas`              | Privado  | Ventas                      |
| `/app/recordatorios`       | Privado  | Recordatorios automáticos   |
| `/app/adopcion`            | Privado  | Gestión de refugios         |

Las rutas bajo `/app` exigen sesión y cada módulo exige su rol (ver `src/app/permisos.ts`);
el menú lateral solo muestra los módulos del rol. La protección real está en las políticas
RLS: aunque alguien manipule el frontend, la base de datos no le entrega datos ajenos.

## Sistema de diseño

Los colores, la tipografía y las superficies viven como tokens en `src/index.css`, dentro
del bloque `@theme`. Ningún componente escribe un color literal: todos usan los tokens
(`bg-brand-600`, `text-ink`, `border-line`, …), así que cambiar la identidad visual del
sistema es cambiar ese bloque y nada más.

La paleta es **Verde clínico**, alineada con el logo: el `brand-600` (`#1f6e6e`) es el teal
del círculo y el `accent-300` (`#e9c34a`) es el dorado del collar. El acento está reservado
al módulo de adopción. El color de éxito es verde y no teal, a propósito, para que un
mensaje de confirmación no se confunda con el color de marca.

Contrastes verificados: blanco sobre `brand-600` 6,1:1 · blanco sobre `accent-600` 5,4:1 ·
`ink` sobre el fondo 15,5:1. Los tres pasan AA.

Tipografía: **Outfit** para títulos (`--font-display`, aplicada a `h1` y `h2`) y **Figtree**
para el resto, ambas desde Google Fonts en `index.html`.

### El logo

El isotipo se sirve desde `public/logo.png` y se usa a través de
`src/components/ui/Logo.tsx`, que además es el favicon y el icono de la pantalla de inicio.
Si ese archivo falta, el componente cae a un monograma para no renderizar una imagen rota.

## Estado (iteración 1 · ~30 %)

| Módulo        | Estado | Qué hay |
| ------------- | ------ | ------- |
| Autenticación | Hecho  | Registro (propietario/refugio) con Habeas Data, ingreso, sesión persistente, rutas por rol |
| Adopción      | Hecho  | Catálogo público con filtros combinables, ficha con contacto (WhatsApp/correo), panel del refugio (registro, publicar con foto, editar, cambiar estado, eliminar), aprobación de refugios |
| Citas         | Avanzado | Registro de mascotas, agendamiento en 3 pasos con franjas reales, filtro por especialidad, cancelar/reprogramar, historial, agenda diaria del personal con "marcar atendida" |
| Panel         | Hecho  | Indicadores reales por rol |
| Historias clínicas, Doctores, Inventario, Ventas, Recordatorios | Pendiente | Muestran la lista de requerimientos por implementar |

Pendiente en citas: lista de espera (REQ-AGC-06) y confirmación por correo (REQ-AGC-03),
que necesitan una Edge Function de Supabase para enviar correos.
