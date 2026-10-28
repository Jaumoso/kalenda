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
curl -fsSL https://raw.githubusercontent.com/Jaumoso/kalenda/v0.1.10/docker-compose.yml \
  -o docker-compose.yml
```

To follow a different release, replace `v0.1.10` in the URL and in `APP_TAG` below.

### 2. Create the environment file

The production Compose file intentionally refuses to start without explicit database,
administrator and signing secrets. Create a `.env` file next to `docker-compose.yml`:

```bash
cat > .env <<EOF
APP_TAG=v0.1.10
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
performing maintenance. The production Compose stack includes an internal backup service.
It creates one compressed archive per interval containing a PostgreSQL dump and the contents
of `./data`. Configure the interval and retention in `.env`:

```dotenv
BACKUP_INTERVAL_SECONDS=86400
BACKUP_RETENTION_DAYS=30
```

Archives are written to `./backups`. They are intentionally excluded from Git and should
also be copied to storage outside the server. A manual PostgreSQL dump can be created with:

```bash
docker compose exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > kalenda.sql
```

To restore a backup, stop the application services first, extract the archive to a
temporary directory, restore the database dump, and replace the contents of `./data`:

```bash
docker compose stop backend puppeteer
mkdir -p /tmp/kalenda-restore
tar -xzf backups/kalenda-YYYYMMDDTHHMMSSZ.tar.gz -C /tmp/kalenda-restore
docker compose exec -T postgres \
  pg_restore --clean --if-exists --no-owner --dbname="$POSTGRES_DB" \
  < /tmp/kalenda-restore/database.dump
tar -xf /tmp/kalenda-restore/data.tar -C ./data
docker compose start backend puppeteer
```

Replace the timestamp in the example with the archive being restored and verify the
application before removing the previous `./data` contents. Test restores periodically;
a backup that has never been restored is not a verified recovery plan.

The Compose stack is suitable for a private or internal installation. For internet-facing
use, put it behind a reverse proxy with HTTPS, restrict access to the Docker host, and
copy `./backups` to independent storage, and do not expose the PostgreSQL, Puppeteer or
backup service publicly.

## User guide and operations

- [Basic user guide](docs/USER_GUIDE.md)
- [Operations runbook](docs/OPERATIONS.md)

## Development

The development workflow is intended primarily for the project maintainer. It uses the
repository source code, a local PostgreSQL container and the development seed data.

### Requirements

- Node.js 20 LTS
- pnpm 12
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

### End-to-end tests

Install Chromium once, start the development stack, seed its database and run Playwright:

```bash
pnpm exec playwright install chromium
docker compose -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.dev.yml exec -T backend pnpm db:seed
pnpm e2e
```

The suite expects the frontend at `http://127.0.0.1:5173`. Set `E2E_BASE_URL` to test
another environment. Stop the stack with `docker compose -f docker-compose.dev.yml down`.

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
- Stable releases use Semantic Versioning (`MAJOR.MINOR.PATCH`) and tags in the form
  `vX.Y.Z`. They must be created from `main`.
- Development releases use an explicit prerelease suffix, such as `v0.1.9-dev.1`, and must
  be created from `dev`.
- Every push to `dev` publishes development images with the mutable `dev` tag and an immutable
  `dev-<short-sha>` tag. These images are intended for server validation and never update
  `latest`.
- Published releases and their notes are available in the
  [GitHub Releases](https://github.com/Jaumoso/kalenda/releases) section.
- Release commits are signed and authored by the project maintainer. Dependabot may author
  security-only dependency update commits.

To prepare a stable release from a clean `main` branch:

```bash
./scripts/bump.sh patch
git push
git push origin v0.1.10
./scripts/create-release.sh v0.1.10
```

For a development prerelease, use a clean `dev` branch and an explicit prerelease label:

```bash
./scripts/bump.sh patch --prerelease dev.1
git push
git push origin v0.1.9-dev.1
./scripts/create-release.sh v0.1.9-dev.1 --prerelease
```

The bump script updates all workspace package versions, creates the signed release commit
and tag, and rejects release attempts from feature branches or unmarked releases from
`dev`. The release script validates that the tag belongs to the correct branch, extracts
the highlights from `CHANGELOG.md`, lists the associated pull requests and commits, and
always uses the title `Kalenda vX.Y.Z`. A tag push also runs
`.github/workflows/create-release.yml`, so releases are created consistently without
manually composing release notes.

To test the latest code merged into `dev` without creating a release, set this in the server's
`.env` file and pull the images:

```dotenv
APP_TAG=dev
```

For a reproducible test, use the `dev-<short-sha>` tag shown in the GitHub Actions run that
published the images. Stable releases from `main` continue to use their `vX.Y.Z` tag and
`latest`; those tags are never written by pushes to `dev`.

## License

MIT License. See [LICENSE](LICENSE).
