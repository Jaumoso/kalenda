# ARCHITECTURE.md — Arquitectura del sistema

## CalendApp

**Versión:** 1.1  
**Fecha:** Abril 2026  
**Cambio v1.1:** Eliminado nginx interno. El backend (Fastify) sirve todo en un único puerto expuesto. El reverse proxy SSL es externo al compose (ya existente en el servidor).

---

## 1. Vista general del sistema

```
┌──────────────────────────────────────────────────────────────────────┐
│                            SERVIDOR UBUNTU                           │
│                                                                      │
│  ┌─────────────────────────────────┐                                 │
│  │   Reverse proxy externo         │  (Nginx/Traefik/Caddy ya        │
│  │   (SSL, dominio, enrutamiento)  │   existente en el servidor)     │
│  └───────────────┬─────────────────┘                                 │
│                  │ HTTP → puerto expuesto                             │
│  ┌───────────────▼──────────────────────────────────────────────┐    │
│  │                     Docker Compose                           │    │
│  │                                                              │    │
│  │   ┌──────────────────────────────────────────────────────┐   │    │
│  │   │              Backend (Fastify) :3000                  │   │    │
│  │   │                                                       │   │    │
│  │   │  • Sirve SPA (build React) via @fastify/static        │   │    │
│  │   │  • API REST en /api/*                                 │   │    │
│  │   │  • Sirve assets en /uploads/* via @fastify/static     │   │    │
│  │   │  • Sirve exports en /exports/* via @fastify/static    │   │    │
│  │   └──────────────┬──────────────────┬────────────────────┘   │    │
│  │                  │                  │                          │    │
│  │   ┌──────────────▼──────┐  ┌────────▼─────────────────────┐  │    │
│  │   │   PostgreSQL :5432  │  │   Puppeteer Service          │  │    │
│  │   │   (Prisma ORM)      │  │   (PDF/PNG export)           │  │    │
│  │   └─────────────────────┘  └──────────────────────────────┘  │    │
│  │                                                              │    │
│  │   ┌──────────────────────────────────────────────────────┐   │    │
│  │   │  Volumen: /data/  (assets, exports, postgres)        │   │    │
│  │   └──────────────────────────────────────────────────────┘   │    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
        ▲
        │  LAN o HTTPS (vía reverse proxy externo)
        │
┌───────┴──────────┐
│  Navegador       │
│  (Chrome/Firefox)│
│  Usuario / Admin │
└──────────────────┘
```

### Por qué no hay nginx dentro del compose

El servidor ya dispone de un reverse proxy externo que gestiona SSL y enrutamiento. Añadir nginx interno sería duplicar responsabilidades sin ningún beneficio a esta escala de uso. Fastify con `@fastify/static` sirve el frontend compilado y los assets con rendimiento más que suficiente para uso doméstico/familiar.

---

## 2. Diagrama de componentes del Frontend

```
Frontend React App
│
├── Router (React Router v6)
│   ├── /login                    → LoginPage
│   ├── /                         → DashboardPage (lista de proyectos)
│   ├── /projects/:id             → ProjectOverviewPage (vista 12 meses)
│   ├── /projects/:id/month/:m    → MonthEditorPage ← PÁGINA PRINCIPAL
│   ├── /library                  → AssetLibraryPage
│   ├── /events                   → EventsPage
│   └── /admin                    → AdminPage (solo rol admin)
│
├── Stores (Zustand)
│   ├── authStore                 → usuario, token, rol
│   ├── projectStore              → proyecto activo, meses
│   ├── editorStore               → estado del canvas activo, herramienta seleccionada
│   └── uiStore                   → idioma, preferencias visuales
│
├── MonthEditorPage (página más compleja)
│   │
│   │  Arquitectura de capas de la página A4:
│   │  ┌──────────────────────────────────┐
│   │  │  Capa 3: DecorationOverlay      │ ← Canvas Fabric.js transparente
│   │  │  (stickers, decoraciones libres  │   sobre TODA la página A4
│   │  │   pueden ir encima del grid)     │
│   │  ├──────────────────────────────────┤
│   │  │  Capa 2: CalendarGrid           │ ← Componentes React/HTML + CSS
│   │  │  (tabla de días, editable)       │   Tipografía, colores, bordes dinámicos
│   │  ├──────────────────────────────────┤
│   │  │  Capa 1: CanvasTopZone          │ ← Canvas Fabric.js
│   │  │  (fotos, collage, texto libre)  │   Imágenes arrastrables, efectos
│   │  └──────────────────────────────────┘
│   │
│   │  Toggle de modo: "Editar grid" ↔ "Decorar"
│   │  - Modo grid: pointer-events en grid, overlay no intercepta
│   │  - Modo decorar: pointer-events en overlay, grid no intercepta
│   │
│   ├── CanvasTopZone             → Fabric.js canvas (zona imagen/collage)
│   ├── CalendarGrid              → Componente React/HTML (grid de días)
│   ├── DecorationOverlay         → Fabric.js canvas transparente (stickers/decoración sobre toda la página)
│   ├── EditorModeToggle          → Toggle modo grid / modo decoración
│   ├── LayerPanel                → Lista de capas del canvas con controles
│   ├── PropertiesPanel           → Panel contextual según elemento seleccionado
│   │   ├── ImageProperties       → Efectos, opacidad, posición X/Y/Z
│   │   ├── TextProperties        → Fuente, tamaño, color, alineación
│   │   ├── StickerProperties     → Tamaño, posición, rotación
│   │   └── GridProperties        → Colores tabla, bordes, tipografía números
│   ├── AssetPicker               → Modal para seleccionar asset de biblioteca
│   ├── StickerPicker             → Panel de stickers y emojis
│   ├── ColorPicker               → react-colorful con opacidad
│   ├── FontSelector              → Lista de fuentes disponibles con preview
│   └── ExportPanel               → Opciones de exportación PNG/PDF
│
└── Shared Components
    ├── Navbar                    → Navegación + selector de idioma + usuario
    ├── Sidebar                   → Navegación lateral contextual
    ├── Modal                     → Wrapper genérico de modales (shadcn Dialog)
    └── Toast                     → Notificaciones (shadcn Sonner)
```

---

## 3. Diagrama de base de datos (ERD)

```
┌──────────────┐       ┌─────────────────┐       ┌──────────────────┐
│    users     │       │    projects      │       │ calendar_months  │
├──────────────┤       ├─────────────────┤       ├──────────────────┤
│ id (PK)      │──┐    │ id (PK)         │──┐    │ id (PK)          │
│ email        │  │    │ user_id (FK)    │◀─┘    │ project_id (FK)  │◀─┐
│ password     │  └───▶│ name            │    ┌─▶│ month (1-12)     │  │
│ name         │       │ year            │    │  │ year             │  │
│ role         │       │ status          │    │  │ canvas_top_json  │  │ (JSON Fabric.js zona superior)
│ language     │       │ week_starts_on  │    │  │ grid_config_json │  │ (JSON config grid)
│ is_active    │       │ autonomy_code   │    │  │ overlay_json     │  │ (JSON Fabric.js decoración)
│ created_at   │       │ template_id(FK) │    │  │ is_customized    │  │
│ updated_at   │       │ created_at      │    │  │ created_at       │  │
└──────────────┘       │ updated_at      │────┘  │ updated_at       │  │
                        └─────────────────┘       └──────────────────┘  │
                                                                         │
┌──────────────────────────────────────────────────────────────────────┘
│
│   ┌──────────────┐       ┌─────────────────┐
│   │   day_cells  │       │   templates     │
│   ├──────────────┤       ├─────────────────┤
└──▶│ id (PK)      │       │ id (PK)         │
    │ month_id(FK) │       │ user_id (FK)    │
    │ day_number   │       │ name            │
    │ content_json │       │ config_json     │ (colores, fuentes, etc.)
    │ bg_color     │       │ is_default      │
    │ has_event    │       │ created_at      │
    │ has_holiday  │       └─────────────────┘
    └──────────────┘

┌──────────────┐       ┌─────────────────┐       ┌──────────────────┐
│ asset_folders│       │     assets      │       │     events       │
├──────────────┤       ├─────────────────┤       ├──────────────────┤
│ id (PK)      │──┐    │ id (PK)         │       │ id (PK)          │
│ user_id (FK) │  │    │ user_id (FK)    │       │ user_id (FK)     │
│ name         │  └───▶│ folder_id (FK)  │       │ name             │
│ parent_id    │       │ filename        │       │ day              │
│ created_at   │       │ original_name   │       │ month            │
└──────────────┘       │ mime_type       │       │ year (NULL=recur)│
                        │ size_bytes      │       │ type             │
                        │ width           │       │ (birthday/anniv/ │
                        │ height          │       │  saint/custom)   │
                        │ thumb_path      │       │ color            │
                        │ type            │       │ icon             │
                        │ (image/sticker) │       │ is_recurring     │
                        │ created_at      │       │ created_at       │
                        └─────────────────┘       └──────────────────┘

┌──────────────────┐
│    holidays      │
├──────────────────┤
│ id (PK)          │
│ year             │
│ month            │
│ day              │
│ name_es          │
│ name_en          │
│ scope            │
│ (national/       │
│  autonomy)       │
│ autonomy_code    │
└──────────────────┘
```

---

## 4. Flujo del editor — Cómo funciona el canvas

```
Usuario abre mes X del proyecto Y
         │
         ▼
Frontend solicita GET /api/projects/:id/months/:m
         │
         ▼
Backend devuelve:
  - canvas_top_json (estado Fabric.js de zona superior)
  - grid_config_json (colores, fuentes, bordes del grid)
  - overlay_json (estado Fabric.js de la capa de decoración)
  - day_cells[] (contenido de cada día)
  - events[] del mes (festivos + eventos personalizados)
         │
         ▼
Frontend inicializa:
  - Fabric.js canvas #1 con canvas_top_json (zona imagen/collage)
  - CalendarGrid (React/HTML) con grid_config_json + day_cells
  - Fabric.js canvas #2 con overlay_json (capa decoración transparente)
         │
         ▼
Toggle de modo en el editor:
  - "Editar grid" → pointer-events en CalendarGrid, overlay inerte
  - "Decorar" → pointer-events en overlay Fabric.js, grid inerte
  - Zona superior siempre editable en su propio canvas
         │
         ▼
Usuario edita (arrastra elemento, cambia color, sube imagen...)
Cambios se acumulan en editorStore (Zustand)
         │
         ▼
Auto-save cada 30 segundos O al hacer clic en "Guardar"
  PUT /api/projects/:id/months/:m
  Body: { canvas_top_json, grid_config_json, overlay_json, day_cells[] }
         │
         ▼
Backend persiste en PostgreSQL
```

---

## 5. Flujo de exportación PDF/PNG

```
Usuario pulsa "Exportar"
         │
         ▼
Frontend → POST /api/exports
  Body: { project_id, months: [1..12] | month_number, format: 'pdf'|'png' }
         │
         ▼
Backend (Fastify):
  1. Genera URL de renderizado interno para cada mes
  2. Envía trabajo a Puppeteer Service vía HTTP
         │
         ▼
Puppeteer Service:
  1. Abre URL interna de cada mes en Chrome headless
  2. Espera a que Fabric.js renderice completamente
  3. Captura PNG a alta resolución (deviceScaleFactor: 3.125 → ~300DPI en A4)
  4. Para PDF: combina todas las páginas con puppeteer PDF
  5. Guarda en /data/exports/{job_id}/
         │
         ▼
Backend responde con:
  - job_id para polling de estado
  - (o WebSocket para notificación en tiempo real)
         │
         ▼
Frontend descarga el archivo cuando está listo
  GET /exports/{job_id}/calendar.pdf
```

---

## 6. Flujo de autenticación

```
POST /api/auth/login
  { email, password }
         │
         ▼
Backend:
  1. Busca usuario en BD
  2. Compara password con bcrypt.compare()
  3. Si OK → genera accessToken (15min) + refreshToken (30 días)
  4. Set-Cookie: accessToken (httpOnly, Secure, SameSite=Strict)
  5. Set-Cookie: refreshToken (httpOnly, Secure, SameSite=Strict)
         │
         ▼
Frontend recibe cookies automáticamente (sin JS access → seguro)
Cada petición incluye cookies automáticamente
         │
         ▼
Cuando accessToken expira:
  Frontend recibe 401
  Interceptor Axios llama a POST /api/auth/refresh
  Backend valida refreshToken → emite nuevo accessToken
  Petición original se reintenta automáticamente
```

---

## 7. Estructura de directorios del servidor

```
/opt/calendapp/
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env                          # Variables de entorno (no en git)
└── data/
    ├── postgres/                 # Datos PostgreSQL (volumen)
    ├── assets/
    │   ├── {user_id}/
    │   │   ├── {folder_id}/
    │   │   │   ├── imagen.jpg
    │   │   │   └── sticker.png
    │   │   └── thumbs/           # Miniaturas generadas por Sharp
    └── exports/
        └── {job_id}/
            ├── calendar.pdf
            └── month_01.png ... month_12.png
```

---

## 8. Configuración Docker Compose (esquema)

El frontend (build de Vite) se copia dentro de la imagen del backend durante el build. Fastify lo sirve como estáticos. Un único contenedor expone un único puerto.

```yaml
# docker-compose.yml (estructura, sin valores reales)

services:
  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
      # El Dockerfile hace primero el build del frontend (Vite)
      # y copia el resultado a apps/backend/public/
      # Fastify sirve ese directorio con @fastify/static
    ports:
      - '3000:3000' # Solo puerto expuesto — el reverse proxy externo apunta aquí
    environment:
      - DATABASE_URL
      - JWT_SECRET
      - PUPPETEER_SERVICE_URL
      - ASSETS_DIR=/data/assets
      - EXPORTS_DIR=/data/exports
    volumes:
      - ./data/assets:/data/assets
      - ./data/exports:/data/exports
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  puppeteer:
    build: ./docker/puppeteer
    environment:
      - BACKEND_INTERNAL_URL=http://backend:3000
    volumes:
      - ./data/exports:/data/exports
    depends_on: [backend]
    restart: unless-stopped
    # Dockerfile usa usuario no-root para evitar --no-sandbox

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB
      - POSTGRES_USER
      - POSTGRES_PASSWORD
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U $$POSTGRES_USER']
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

# Sin sección volumes: — los volúmenes son bind mounts directos a ./data/
# para facilitar backups (rsync sobre la carpeta data/)
```

### Dockerfile multi-stage del backend (esquema)

```dockerfile
# Stage 1: build del frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY apps/frontend/ ./apps/frontend/
COPY packages/shared/ ./packages/shared/
COPY pnpm-workspace.yaml package.json ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm --filter frontend build
# Resultado en apps/frontend/dist/

# Stage 2: build del backend + copia del frontend compilado
FROM node:20-alpine AS backend
WORKDIR /app
COPY apps/backend/ ./apps/backend/
COPY packages/shared/ ./packages/shared/
COPY pnpm-workspace.yaml package.json ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod
COPY --from=frontend-build /app/apps/frontend/dist ./apps/backend/public
# Fastify sirve ./public como raíz estática
EXPOSE 3000
CMD ["node", "apps/backend/dist/index.js"]
```

---

## 9. Consideraciones de seguridad

| Área               | Medida                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------- |
| Autenticación      | JWT en httpOnly cookies, no localStorage                                                |
| Contraseñas        | bcrypt con salt rounds ≥ 12                                                             |
| Uploads            | Validación de MIME type real (magic bytes), no solo extensión                           |
| Uploads            | Límite de tamaño por archivo (ej. 20MB) y por usuario                                   |
| SQL Injection      | Imposible con Prisma (queries parametrizadas)                                           |
| XSS                | React escapa HTML por defecto; CSP + security headers vía `@fastify/helmet`             |
| CORS               | `@fastify/cors` restringido al origen del reverse proxy externo                         |
| Puppeteer          | Contenedor sin privilegios extra, sin acceso a red externa; usuario no-root             |
| Assets estáticos   | `@fastify/static` con `send` — solo lectura, sin ejecución                              |
| Red interna Docker | Puppeteer y Postgres no exponen puertos al host; solo backend es accesible externamente |

### Cabeceras de seguridad (`@fastify/helmet`)

```
Content-Security-Policy: default-src 'self'; img-src 'self' data: blob:
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

La política CSP admite `blob:` e `data:` en `img-src` porque Fabric.js genera URLs de datos para las imágenes del canvas.
