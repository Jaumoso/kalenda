# System Architecture

## Overview

Kalenda uses a containerized architecture with an external reverse proxy for TLS and routing.
The backend serves both API endpoints and the compiled SPA in production.

## Runtime topology

- backend (Fastify) on :3000
  - Serves SPA static assets
  - Serves /api/\*
  - Serves uploads and exports
- postgres on :5432
- puppeteer service on :4000 for rendering jobs

## Development vs Production

| Area             | Development             | Production                     |
| ---------------- | ----------------------- | ------------------------------ |
| Frontend         | Vite dev server (:5173) | Compiled SPA served by backend |
| API              | backend :3000           | backend :3000                  |
| Compose behavior | local image build       | GHCR prebuilt images           |

## Data model (high level)

- users
- projects
- calendar_months
- day_cells
- assets
- asset_folders
- events
- holidays
- templates
- export_jobs

## Deployment model

Production compose uses prebuilt images:

- ghcr.io/<owner>/kalenda-backend:<tag>
- ghcr.io/<owner>/kalenda-puppeteer:<tag>

Images are published by GitHub Actions with separate stable and development channels:

- Stable releases from `main` use `vX.Y.Z` and `latest`.
- Every push to `dev` uses `dev` and an immutable `dev-<short-sha>` tag.
- Prereleases such as `vX.Y.Z-rc.1` must point to a commit contained in `dev`.

The `dev` channel never updates `latest`, so development images can be tested on a server
without changing the production image channel.

The backend production image uses a pruned `pnpm deploy --prod` runtime and generates the
Prisma client inside that runtime. The Puppeteer image remains comparatively large because
Chromium and its Alpine runtime dependencies are required for pixel-accurate rendering.

## Security

- httpOnly JWT cookies
- CORS and helmet headers
- Role-based access control
- Rate limiting on authentication and API routes
