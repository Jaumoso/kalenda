# Kalenda

Kalenda is a self-hosted web application for designing fully customizable wall calendars.
Create 12-month calendars with photos, stickers, text, and visual styles, then export production-ready PDF/PNG files.

## Quick Start

### Initial setup

```bash
pnpm install

docker compose -f docker-compose.dev.yml up -d postgres

cd apps/backend && pnpm db:generate
pnpm db:migrate
pnpm db:seed

pnpm dev
```

### Demo credentials

- Admin: admin@kalenda.app / admin123
- User: user@kalenda.app / user123

### API endpoints

- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- GET /api/auth/me
- POST /api/users (admin)
- GET /api/users (admin)

## Technology Stack

### Frontend

- React 19
- Vite 5
- Tailwind CSS 4
- TypeScript 6
- Zustand 5
- TanStack Query 5
- i18next
- Fabric.js

### Backend

- Node.js 20 LTS
- Fastify 5
- Prisma 7
- PostgreSQL 16
- Zod
- JWT (httpOnly cookies)
- Sharp
- Puppeteer

### Tooling

- Docker Compose
- pnpm workspaces
- ESLint + Prettier
- Husky + lint-staged
- Vitest

## Monorepo Structure

```text
kalenda/
├── apps/
│   ├── frontend/
│   └── backend/
├── packages/
│   └── shared/
├── docker/
├── docs/
├── docker-compose.yml
├── docker-compose.dev.yml
└── pnpm-workspace.yaml
```

## Development

```bash
# Frontend
cd apps/frontend
pnpm dev

# Backend
cd apps/backend
pnpm dev

# Tests
pnpm test

# Production build
pnpm build
```

## Deployment

### Production

```bash
# Images are published via GitHub Actions:
# .github/workflows/docker-release.yml

export GHCR_OWNER=YOUR_GITHUB_USER_OR_ORG
export APP_TAG=v1.0.0

export POSTGRES_DB=kalenda
export POSTGRES_USER=kalenda
export POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD

docker compose pull
docker compose up -d
```

### Self-hosted checklist

- Configure an external reverse proxy (Nginx/Traefik/Caddy) with TLS
- Persist ./data volume
- Configure automated backups

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push your branch
5. Open a Pull Request

## License

MIT License. See LICENSE.

## Project Status

- Phase 0: Completed
- Phase 1: Completed
- Phase 2: Completed
- Phase 3: Completed
- Phase 4+: In progress
