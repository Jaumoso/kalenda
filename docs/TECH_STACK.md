# Technical Stack

## Frontend

- React 19
- Vite 5
- Tailwind CSS 4
- TypeScript 6
- Zustand
- TanStack Query
- Fabric.js
- i18next

## Backend

- Node.js 20 LTS
- Fastify 5
- Prisma 7 + PostgreSQL 16
- Zod
- JWT + bcrypt
- Sharp
- Puppeteer

## Infrastructure

- Docker Compose
- GHCR image distribution
- External reverse proxy for TLS

## Engineering Tooling

- pnpm workspaces
- ESLint + Prettier
- Husky + lint-staged
- Vitest (unit)
- Playwright (planned e2e expansion)

## Key decisions

- Fastify over heavier frameworks for performance and simplicity
- PostgreSQL for relational integrity + JSON support
- Puppeteer for pixel-accurate export rendering
- Local volume storage for operational simplicity in self-hosted environments
