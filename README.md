# Dogtor

Sistema web de gestión veterinaria y adopción de mascotas.

Dogtor reúne en una sola plataforma la gestión clínica, administrativa y comercial de las
clínicas veterinarias pequeñas y medianas, e incluye un módulo para que refugios y
fundaciones publiquen las mascotas que tienen en adopción.

Proyecto académico de la asignatura **Gerencia de Proyectos**, Facultad de Ingeniería,
Diseño e Innovación — Politécnico Grancolombiano.

- Johan Nicolás Garzón Moncada — Gerente de proyecto y desarrollador
- Juan Camilo Bejarano Chacón — Desarrollador

## Módulos del MVP

| Módulo               | Qué resuelve                                                          |
| -------------------- | --------------------------------------------------------------------- |
| Historias clínicas   | Ficha única por mascota: vacunas, diagnósticos, tratamientos, alergias |
| Agendamiento         | Citas en línea con disponibilidad de doctores en tiempo real           |
| Doctores y turnos    | Perfiles, especialidades y sedes con urgencias 24 horas                |
| Inventario           | Existencias, kardex y alertas de stock y vencimiento                   |
| Ventas               | Venta de productos con trazabilidad hacia el historial clínico         |
| Recordatorios        | Avisos automáticos de citas, vacunas y controles                       |
| Adopción             | Publicación y seguimiento de mascotas de refugios y fundaciones        |

## Estructura del repositorio

```
dogtor-web/   Aplicación web (React + TypeScript + Vite)
diseno/       Tableros de identidad visual y sistema de color
```

El frontend tiene su propia documentación en [`dogtor-web/README.md`](dogtor-web/README.md):
puesta en marcha, estructura por módulos, rutas y sistema de diseño.

## Estado

Esqueleto navegable con la identidad visual definida. Los módulos están enrutados y
documentan los requerimientos que les corresponden; la implementación funcional y el
backend (API REST) están en desarrollo.
