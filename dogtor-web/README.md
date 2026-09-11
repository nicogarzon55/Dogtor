# Dogtor · Frontend

Aplicación web responsiva de **Dogtor**, sistema de gestión veterinaria y adopción de
mascotas. Consume la API REST del backend mediante mensajes JSON sobre HTTPS.

Proyecto académico — Gerencia de Proyectos, Politécnico Grancolombiano.

## Stack

| Pieza      | Tecnología            |
| ---------- | --------------------- |
| Build      | Vite 8                |
| UI         | React 19 + TypeScript |
| Estilos    | Tailwind CSS v4       |
| Enrutado   | React Router 7        |
| Tipografía | Outfit + Figtree      |
| Linter     | oxlint                |

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # ajustar VITE_API_URL
npm run dev
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
├── hooks/                Hooks reutilizables entre módulos
├── lib/                  Cliente HTTP (api.ts) y utilidades
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
| `/ingresar`                | Público  | Autenticación               |
| `/app`                     | Privado  | Panel / indicadores         |
| `/app/historias-clinicas`  | Privado  | Historias clínicas          |
| `/app/citas`               | Privado  | Agendamiento de citas       |
| `/app/doctores`            | Privado  | Doctores, turnos y urgencias |
| `/app/inventario`          | Privado  | Inventario y alertas        |
| `/app/ventas`              | Privado  | Ventas                      |
| `/app/recordatorios`       | Privado  | Recordatorios automáticos   |
| `/app/adopcion`            | Privado  | Gestión de refugios         |

> El control de acceso por rol todavía no está implementado: las rutas bajo `/app` son
> accesibles sin autenticación hasta que se desarrolle el módulo de `auth`.

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

## Estado

Esqueleto navegable. Cada módulo muestra la lista de requerimientos que le corresponden
del Documento de Requerimientos de Software v1.0; se van reemplazando por la
implementación real a medida que avanza el cronograma.
