# TECH_STACK.md — Stack Tecnológico

## CalendApp

**Versión:** 1.1  
**Fecha:** Abril 2026  
**Cambio v1.1:** Eliminado nginx interno. Fastify sirve el frontend compilado y los assets estáticos.
**Cambio v1.2:** Actualización de dependencias - React 19.1, Tailwind CSS 4.x, Fastify 5.x, Prisma 7.x, TypeScript 6.x, ESLint 10.x.

---

## Resumen ejecutivo

Stack orientado a self-hosting sencillo (Docker Compose), con tecnologías estables, bien documentadas y open source. Prioriza la capacidad de edición visual avanzada en el navegador y la generación de PDFs de alta calidad para impresión.

---

## 1. Frontend

### Framework principal: **React 19.1 + Vite 5.x**

- **Por qué React:** Ecosistema maduro, excelente soporte para aplicaciones con estado complejo (el editor canvas), amplia disponibilidad de librerías compatibles.
- **Por qué Vite:** Build tool rápido, HMR (hot reload) eficiente, configuración mínima.

### Editor visual de canvas: **Fabric.js 7.x**

- Librería de canvas HTML5 con soporte nativo para:
  - Objetos posicionables, redimensionables y rotables (imágenes, texto, formas)
  - Control de capas (Z-index)
  - Grupos de objetos
  - Serialización/deserialización del estado del canvas en JSON
  - Eventos de ratón, zoom, pan
- Es la pieza central del editor de zona superior y del grid personalizable.
- **Alternativa evaluada:** Konva.js — Fabric.js tiene mejor soporte de texto y efectos de imagen.

### Estilos: **Tailwind CSS 4.x**

- Utility-first, ideal para construir UI coherente rápidamente.
- Sin conflicto con el canvas de Fabric.js (que vive en su propio elemento).

### Componentes UI: **shadcn/ui**

- Componentes accesibles, bien diseñados, basados en Radix UI.
- No es una librería de npm, los componentes se copian al proyecto (sin lock-in).
- Ideal para paneles, modales, selectores de color, sliders, etc.

### Internacionalización: **i18next 26.x + react-i18next 15.x**

- Estándar de facto para i18n en React.
- Soporte de plurales, interpolación, namespaces.
- Ficheros de traducción en JSON.
- Detección automática de idioma del navegador, con override por preferencia del usuario.

### Gestión de estado: **Zustand 5.x**

- Estado global ligero y sin boilerplate (frente a Redux).
- Ideal para: estado del canvas activo, proyecto seleccionado, usuario autenticado, preferencias.

### Peticiones HTTP: **TanStack Query (React Query) 5.x + Axios 1.x**

- React Query para cache, invalidación y sincronización de datos del servidor.
- Axios para configuración centralizada de peticiones (interceptores de auto-refresh de tokens).
- Interceptor de respuesta: si recibe 401, llama a `/auth/refresh` y reintenta automáticamente.

### Selector de color: **react-colorful 5.x**

- Ligero, sin dependencias, accesible.

### Gestión de fuentes: **@fontsource** (fuentes self-hosted)

- Fuentes populares (Google Fonts) servidas desde el propio servidor.
- Sin dependencias de red externa.
- Fuentes iniciales sugeridas: Inter, Playfair Display, Lato, Montserrat, Dancing Script, Pacifico, Roboto Slab.

---

## 2. Backend

### Runtime y framework: **Node.js 20 LTS + Fastify 5.x**

- **Por qué Node.js:** Mismo lenguaje que el frontend (TypeScript compartible), ecosistema enorme.
- **Por qué Fastify:** Más rápido que Express, schema validation nativa con JSON Schema, soporte de plugins excelente.

### Lenguaje: **TypeScript 6.x** (frontend y backend)

- Tipos compartidos entre frontend y backend (monorepo o tipos exportados).
- Mejor mantenibilidad a largo plazo.

### ORM: **Prisma 7.x**

- Schema declarativo, migraciones automáticas.
- Generación de tipos TypeScript desde el schema de base de datos.
- Soporte de PostgreSQL.

### Autenticación: **JWT + bcrypt 6.x**

- Tokens JWT almacenados en httpOnly cookies (no localStorage → más seguro).
- Refresh token de larga duración para "recordarme".
- bcrypt para hashing de contraseñas.

### Generación de PDF/PNG: **Puppeteer**

- Chrome headless renderiza la página del mes tal como la ve el usuario.
- Captura PNG a alta resolución (deviceScaleFactor para 300 DPI equivalente).
- Genera PDF multipágina con las dimensiones exactas A4.
- **Alternativa evaluada:** jsPDF + html2canvas — menor calidad de renderizado; Puppeteer produce resultados más fieles al diseño.

### Validación: **Zod 4.x**

- Schemas de validación compartibles entre frontend y backend.
- Integración nativa con Fastify vía fastify-zod o similar.

---

## 3. Base de datos

### **PostgreSQL 16**

- Base de datos relacional robusta, perfecta para la estructura del proyecto.
- Excelente soporte JSON para guardar el estado del canvas (JSON de Fabric.js).
- Self-hosteable sin problemas en Docker.

### Esquema principal (ver ARCHITECTURE.md para el diagrama completo):

```
users → projects → calendar_months → day_cells
                                   → canvas_state (JSON)
projects → templates
users → assets (imágenes/stickers)
assets → asset_folders
events → (recurrentes y puntuales, vinculados a usuario)
holidays → (tabla estática por año y comunidad autónoma)
```

---

## 4. Almacenamiento de archivos

### **Sistema de archivos local (volumen Docker montado)**

- Las imágenes y stickers subidos se guardan en un directorio del servidor.
- Estructura: `/data/assets/{user_id}/{folder_id}/{filename}`
- Servidas por `@fastify/static` como archivos estáticos.
- **Por qué no MinIO/S3:** Innecesario para uso personal/familiar. Añade complejidad sin beneficio real a esta escala.
- Backup: volumen Docker incluido en el backup del servidor.

### Procesamiento de imágenes: **Sharp**

- Generación de miniaturas para la biblioteca.
- Conversión de formatos.
- Optimización de tamaño antes de guardar.
- Nativo de Node.js, muy performante.

---

## 5. Infraestructura y despliegue

### **Docker Compose**

Todos los servicios en contenedores, orquestados con un único `docker-compose.yml`.

```
┌─────────────────────────────────────┐
│         docker-compose.yml          │
│                                     │
│  ┌──────────────────────────────┐   │
│  │  backend (Fastify) :3000     │   │
│  │  • SPA React (build estático)│   │
│  │  • API REST /api/*           │   │
│  │  • Assets /uploads/*         │   │
│  │  • Exports /exports/*        │   │
│  └──────────┬───────────────────┘   │
│             │                       │
│  ┌──────────▼──────┐  ┌──────────┐  │
│  │   postgres      │  │puppeteer │  │
│  │   (solo red     │  │(solo red │  │
│  │    interna)     │  │ interna) │  │
│  └─────────────────┘  └──────────┘  │
└─────────────────────────────────────┘
         │ puerto 3000
         ▼
  Reverse proxy externo
  (ya existente en el servidor)
```

El build del frontend (Vite) se genera durante el build de la imagen del backend (multi-stage Dockerfile) y se copia a `apps/backend/public/`. Fastify lo sirve con `@fastify/static`.

**Sin nginx interno** — el reverse proxy externo ya existente en el servidor gestiona SSL y enrutamiento. Añadir nginx dentro del compose sería redundante a esta escala.

### Plugins Fastify relevantes

| Plugin               | Función                                       |
| -------------------- | --------------------------------------------- |
| `@fastify/static`    | Sirve el build de React y los assets subidos  |
| `@fastify/helmet`    | Security headers (CSP, X-Frame-Options, etc.) |
| `@fastify/cors`      | CORS restringido al origen del reverse proxy  |
| `@fastify/multipart` | Subida de archivos                            |
| `@fastify/cookie`    | Gestión de cookies httpOnly para JWT          |

### Puppeteer como servicio separado

- El renderizado de PDF es costoso. Se separa en su propio contenedor para no bloquear el backend.
- Backend envía trabajo a Puppeteer vía HTTP interno.
- Puppeteer puede escalar independientemente si fuera necesario.

---

## 6. Herramientas de desarrollo

| Herramienta             | Uso                                                 |
| ----------------------- | --------------------------------------------------- |
| **pnpm**                | Gestor de paquetes (más rápido y eficiente que npm) |
| **ESLint + Prettier**   | Linting y formateo de código                        |
| **Husky + lint-staged** | Pre-commit hooks para calidad de código             |
| **Vitest**              | Tests unitarios (frontend y backend)                |
| **Playwright**          | Tests end-to-end (flujos críticos)                  |
| **ts-node / tsx**       | Ejecución de TypeScript en desarrollo               |

---

## 7. Monorepo

### Estructura con **pnpm workspaces**

```
calendapp/
├── apps/
│   ├── frontend/          # React + Vite
│   └── backend/           # Fastify
├── packages/
│   └── shared/            # Tipos TypeScript y schemas Zod compartidos
├── docker/
│   └── puppeteer/
├── docker-compose.yml
├── docker-compose.dev.yml
└── pnpm-workspace.yaml
```

---

## 8. Tabla de decisiones

| Decisión                | Elegido                  | Descartado           | Motivo                                                                  |
| ----------------------- | ------------------------ | -------------------- | ----------------------------------------------------------------------- |
| Canvas editor           | Fabric.js                | Konva.js             | Mejor soporte de texto, efectos, serialización JSON                     |
| Grid del calendario     | React/HTML + CSS         | Fabric.js            | Es una tabla estructurada; HTML más simple, accesible y personalizable  |
| Decoraciones sobre grid | Canvas Fabric.js overlay | CSS posicionado      | Canvas permite posicionamiento libre y arrastre natural                 |
| Modo de edición         | Toggle grid/decorar      | Detección automática | Evita conflictos de pointer-events entre capas                          |
| PDF generation          | Puppeteer                | jsPDF, PDFKit        | Renderizado fiel al diseño visual, soporte de CSS                       |
| Backend framework       | Fastify                  | Express, NestJS      | Más rápido, validation nativa, menos boilerplate que Nest               |
| Base de datos           | PostgreSQL               | SQLite, MySQL        | Robustez, JSON nativo, mejor para multiusuario                          |
| Estado global           | Zustand                  | Redux, Jotai         | Menos boilerplate, suficiente para esta escala                          |
| HTTP client             | Axios + React Query      | fetch + React Query  | Interceptor de auto-refresh de tokens más limpio                        |
| File storage            | Local (volumen)          | MinIO, S3            | Self-hosted familiar, simplicidad, escala suficiente                    |
| File serving            | @fastify/static          | nginx interno        | Reverse proxy ya existente; añadir nginx sería redundante a esta escala |
| Auth                    | JWT + cookies            | NextAuth, Passport   | Control total, sin dependencias de terceros                             |
| Monorepo                | pnpm workspaces          | Turborepo, Nx        | Simplicidad para un proyecto de esta escala                             |
