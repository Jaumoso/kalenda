<p align="center">
  <img src="docs/kalenda_logo.svg" alt="Kalenda" width="500" />
</p>

<p align="center">
  Self-hosted calendar design and export application.
</p>

Kalenda lets you create fully customizable wall calendars with photos, stickers, text and
visual styles. A project contains the twelve months of a calendar and can be exported as
production-ready PDF or PNG files.

## Use Kalenda with Docker Compose

This is the recommended path if you only want to use Kalenda. You do not need Node.js, pnpm
or the source code: Docker downloads the published application images and runs the required
services.

### Requirements

- Docker Engine with Docker Compose v2 (`docker compose`)
- A machine with enough disk space for the database, uploaded assets and exports
- Port `3000` available for the web application

### 1. Download the Compose file

Create a directory for the installation and download the Compose file from the release you
want to run:

```bash
mkdir kalenda
cd kalenda
curl -fsSL https://raw.githubusercontent.com/Jaumoso/kalenda/v0.1.8/docker-compose.yml \
  -o docker-compose.yml
```

To follow a different release, replace `v0.1.8` in the URL and in `APP_TAG` below.

### 2. Create the environment file

The production Compose file intentionally refuses to start without explicit database,
administrator and signing secrets. Create a `.env` file next to `docker-compose.yml`:

```bash
cat > .env <<EOF
APP_TAG=v0.1.8
POSTGRES_DB=kalenda
POSTGRES_USER=kalenda
POSTGRES_PASSWORD=$(openssl rand -hex 32)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=$(openssl rand -base64 24)
COOKIE_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
EOF

chmod 600 .env
```

Change `ADMIN_EMAIL` if required and keep the generated `ADMIN_PASSWORD`: it is the initial
administrator password. The `.env` file contains secrets and must not be committed or shared.

### 3. Start Kalenda

```bash
mkdir -p data
docker compose pull
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the administrator
credentials from `.env`. The first startup may take a little longer while PostgreSQL
initializes and the application applies its migrations.

Check the service health with:

```bash
curl http://localhost:3000/api/health
```

A healthy installation returns a JSON response with `"status":"ok"`.

### Manage the installation

```bash
# See service status
docker compose ps

# Follow application logs
docker compose logs -f backend

# Stop services without deleting data
docker compose down

# Start them again
docker compose up -d

# Update to the version selected in .env
docker compose pull
docker compose up -d
```

`docker compose down` preserves the named PostgreSQL volume and the `./data` directory.
Do not use `docker compose down -v` unless you intentionally want to delete the database.

### Persisted data and backups

Kalenda stores PostgreSQL data in the Docker volume `kalenda_postgres_data`, and uploaded
assets and generated exports under `./data`. Back up both before moving the installation or
performing maintenance. A PostgreSQL dump can be created with:

```bash
docker compose exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > kalenda.sql
```

The Compose stack is suitable for a private or internal installation. For internet-facing
use, put it behind a reverse proxy with HTTPS, restrict access to the Docker host, and
configure automated backups. Do not expose the PostgreSQL or Puppeteer service publicly.

## Development

The development workflow is intended primarily for the project maintainer. It uses the
repository source code, a local PostgreSQL container and the development seed data.

### Requirements

- Node.js 20 LTS
- pnpm 8
- Docker Engine with Docker Compose v2

### Start the development environment

```bash
pnpm install
docker compose -f docker-compose.dev.yml up -d postgres

pnpm --filter @kalenda/backend db:generate
pnpm --filter @kalenda/backend db:migrate
pnpm --filter @kalenda/backend db:seed

pnpm dev
```

Development URLs:

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend health: [http://localhost:3000/api/health](http://localhost:3000/api/health)

### Development credentials

The development seed creates:

- Admin: `admin@kalenda.app` / `admin123`
- User: `user@kalenda.app` / `user123`

These credentials are for local development only. Never use them in a Compose or production
installation.

### Useful development commands

```bash
# Run all development services
pnpm dev

# Validate the workspace
pnpm lint
pnpm build
pnpm test

# Regenerate Prisma Client
pnpm --filter @kalenda/backend db:generate
```

## Technology stack

- React 19, Vite 6, Tailwind CSS 4 and Fabric.js
- Fastify 5, Prisma 7 and PostgreSQL 16
- TypeScript 6, Zod, Zustand, TanStack Query and i18next
- Sharp and Puppeteer for image processing and exports
- Docker Compose, pnpm workspaces, ESLint, Prettier and Vitest

## Repository structure

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

## Releases and branches

- `main` is the stable branch.
- `dev` contains the next development changes.
- Releases use Semantic Versioning (`MAJOR.MINOR.PATCH`) and tags in the form `vX.Y.Z`.
- Published releases and their notes are available in the
  [GitHub Releases](https://github.com/Jaumoso/kalenda/releases) section.
- Release commits are signed and authored by the project maintainer. Dependabot may author
  security-only dependency update commits.

To prepare a release from a clean development branch:

```bash
./scripts/bump.sh patch
```

The script updates all workspace package versions, creates the signed release commit and
tag, and prints the commands needed to publish them.

## License

MIT License. See [LICENSE](LICENSE).
