# Changelog

All notable changes to Kalenda are documented here.

The project follows [Semantic Versioning](https://semver.org/).

## [0.1.8] - 2026-10-27

### Security

- Declared Fabric.js `^7.4.0` directly in the frontend manifest so Dependabot can verify the patched version and no longer reports the two Fabric.js XSS advisories.

### Maintenance

- Revalidated the workspace with dependency audits, lint, build and tests.

## [0.1.7] - 2026-10-27

### Security

- Updated Fastify, Sharp, Fast-URI, Axios, Vite, Vitest, React Router, Zod and related dependencies.
- Added pnpm overrides for vulnerable transitive dependencies, including Hono, brace-expansion, nanoid, deepmerge-ts, mysql2, busboy, source-map-js and follow-redirects.
- Removed all known vulnerabilities reported by `pnpm audit`, including development dependencies.

### Maintenance

- Updated Prisma packages to 7.10.1 and regenerated the Prisma client.
- Updated the backend TypeScript runner to use a patched esbuild release.
- Verified the workspace with lint, build and test commands.

## [0.1.6] - 2026-10-27

### Security

- Required production secrets and administrator credentials instead of allowing insecure defaults.
- Added explicit production configuration failures for missing secrets.
- Hardened authentication, rendering and export token handling.

### Maintenance

- Corrected the roadmap to reflect the implemented project state and remaining work.
- Documented the `dev` branch and Semantic Versioning workflow.
- Fixed existing lint issues across the shared, backend and frontend packages.

[0.1.7]: https://github.com/Jaumoso/kalenda/releases/tag/v0.1.7
[0.1.8]: https://github.com/Jaumoso/kalenda/releases/tag/v0.1.8
[0.1.6]: https://github.com/Jaumoso/kalenda/releases/tag/v0.1.6
