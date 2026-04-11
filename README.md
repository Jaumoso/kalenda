# Caledit

Aplicación web auto-hospedada para crear calendarios de pared personalizables. Diseña calendarios de 12 meses con imágenes, stickers, texto y colores personalizados, y exporta en PDF/PNG listo para imprimir.

## 🚀 Inicio rápido

### Configuración inicial

```bash
# Instalar dependencias
pnpm install

# Configurar base de datos (requiere Docker)
docker compose -f docker-compose.dev.yml up -d postgres

# Generar cliente Prisma
cd apps/backend && pnpm db:generate

# Crear migraciones
pnpm db:migrate

# Ejecutar seed para crear usuarios de prueba
pnpm db:seed

# Iniciar desarrollo
pnpm dev
```

### Credenciales de prueba

- **Admin**: admin@calendapp.com / admin123
- **Usuario**: user@calendapp.com / user123

### Endpoints de API

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/refresh` - Refrescar token
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/register` - Registrar usuario (solo admin)
- `GET /api/users` - Listar usuarios (solo admin)

## Stack Tecnológico

### Frontend

- **React 19.1** — Framework principal
- **Vite 5.x** — Build tool y dev server
- **Tailwind CSS 4.x** — Estilos utility-first
- **TypeScript 6.x** — Tipado estático
- **Zustand 5.x** — Gestión de estado global
- **TanStack Query 5.x** — Consultas y cache de API
- **i18next 26.x** — Internacionalización
- **Fabric.js 7.x** — Editor visual de canvas
- **shadcn/ui** — Componentes UI accesibles
- **react-colorful 5.x** — Selectores de color
- **@fontsource** — Fuentes self-hosted

### Backend

- **Node.js 20 LTS** — Runtime
- **Fastify 5.x** — Framework web
- **Prisma 7.x** — ORM y migraciones
- **PostgreSQL 16** — Base de datos
- **Zod 4.x** — Validación de esquemas
- **JWT** — Autenticación (cookies httpOnly)
- **bcrypt 6.x** — Hashing de contraseñas
- **Sharp 0.34.x** — Procesamiento de imágenes
- **Puppeteer** — Generación de PDF/PNG

### Infraestructura

- **Docker Compose** — Orquestación de contenedores
- **pnpm** — Gestor de paquetes para monorepo
- **ESLint 10.x + Prettier** — Linting y formateo
- **Husky + lint-staged** — Pre-commit hooks
- **Vitest 4.x** — Tests unitarios

## Estructura del Monorepo

```
calendapp/
├── apps/
│   ├── frontend/          # React + Vite
│   └── backend/           # Fastify + Prisma
├── packages/
│   └── shared/            # Tipos y esquemas compartidos
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── puppeteer/
├── docs/                  # Documentación del proyecto
├── docker-compose.yml     # Producción
├── docker-compose.dev.yml # Desarrollo
├── pnpm-workspace.yaml    # Configuración monorepo
└── package.json           # Scripts raíz
```

## Instalación y Desarrollo

### Prerrequisitos

- Node.js 20 LTS
- pnpm 8+
- Docker y Docker Compose

### Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd calendapp

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp apps/backend/.env.example apps/backend/.env
# Editar .env con tus valores

# Levantar base de datos
docker-compose up -d postgres

# Ejecutar migraciones
cd apps/backend
pnpm prisma migrate dev

# Levantar en desarrollo
cd ../..
docker-compose -f docker-compose.dev.yml up
```

### Desarrollo

```bash
# Frontend
cd apps/frontend
pnpm dev

# Backend
cd apps/backend
pnpm dev

# Tests
pnpm test

# Build producción
pnpm build
```

## Despliegue

### Producción

```bash
# Build y despliegue
docker-compose up -d

# La app estará disponible en http://localhost:3000
```

### Self-hosted

- Configurar reverse proxy externo (Nginx/Traefik/Caddy) para SSL
- Montar volumen `/data/` para persistencia de assets y DB
- Configurar backups automáticos

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añade nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto es software propietario para uso familiar/personal.

## Estado del Proyecto

- ✅ **Fase 0: Setup e infraestructura** — Completada
  - Monorepo configurado con pnpm workspaces
  - Dependencias instaladas y builds funcionando
  - Frontend: React 19.1 + Vite + Tailwind CSS v3
  - Backend: Fastify + TypeScript ES2022
  - Paquete shared con tipos y esquemas
- 🔄 Fase 1: Autenticación y usuarios ✅ COMPLETADA
- ⏳ Fase 2: Gestión de proyectos
- ⏳ Fase 3: Biblioteca de assets
- ⏳ Fase 4: Editor de mes (grid)
- ⏳ Fase 5: Festivos y eventos
- ⏳ Fase 6: Editor canvas superior
- ⏳ Fase 7: Exportación PDF/PNG
- ⏳ Fase 8: Pulido y producción
