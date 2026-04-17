---
description: 'Use when writing or modifying Fastify routes, backend API handlers, authentication logic, or server configuration in Kalenda.'
applyTo: 'apps/backend/src/**'
---

# Kalenda Backend — Fastify & API Conventions

## Route Structure

- All routes are registered under the `/api` prefix
- Protected routes use `{ preHandler: fastify.authenticate }`
- Admin-only routes add `{ preHandler: fastify.requireAdmin }`
- Auth decorators: `fastify.authenticate`, `fastify.requireAdmin`, `fastify.generateTokens`

## Zod Validation

Fastify 5's built-in `schema` option is NOT compatible with Zod. Always validate manually:

```ts
const parsed = createEventSchema.safeParse(request.body)
if (!parsed.success) {
  return reply.code(400).send({
    error: 'VALIDATION_ERROR',
    message: parsed.error.issues.map((i) => i.message).join(', '),
  })
}
```

- Import schemas from `@kalenda/shared`
- Separate `create` (required fields) and `update` (optional fields) schemas

## Ownership Pattern

Before any mutation (update, delete), verify the resource belongs to the requesting user:

```ts
const resource = await prisma.event.findFirst({
  where: { id: request.params.id, userId: request.user!.id },
})
if (!resource) {
  return reply.code(404).send({ error: 'NOT_FOUND', message: 'Resource not found' })
}
```

## Error Responses

- 400: `{ error: 'VALIDATION_ERROR', message }` — bad input
- 401: `{ error: 'UNAUTHORIZED', message }` — missing/invalid token
- 403: `{ error: 'FORBIDDEN', message }` — insufficient permissions
- 404: `{ error: 'NOT_FOUND', message }` — resource not found
- 409: `{ error: 'CONFLICT', message }` — duplicate/conflict

## dotenv

- Always load `.env` with explicit path: `path.resolve(__dirname, '..', '.env')`
- Do NOT use `import 'dotenv/config'` — cwd may differ when tsx runs from monorepo root

## Static Files

- `@fastify/static` registered FIRST for uploads dir (owns `decorateReply`)
- SECOND registration for frontend dist uses `decorateReply: false`
- Uploads path: `path.join(__dirname, '../uploads')` from server.ts

## Rate Limiting

Three tiers defined in `config.ts`:

- `default`: 100 req/min
- `strict`: 30 req/min (exports, renders)
- `login`: 5 req/min

## Export & Render Pipeline

- Puppeteer runs in a separate Docker container (`kalenda-puppeteer`, port 4000)
- `lib/renderer.ts` orchestrates the export: creates render tokens → Puppeteer captures pages → merges into PDF via `pdf-lib`
- Render tokens are short-lived JWTs that grant Puppeteer access to `/api/render/*` endpoints without user session
- `RenderMonthPage` and `RenderCoverPage` are public frontend pages consumed by Puppeteer — not user-facing
- A4 base dimensions: 794×1123px at 96 DPI; DPI scaling via `deviceScaleFactor`
- Export jobs track progress per-page via `ExportJob` model (PENDING → PROCESSING → COMPLETED/FAILED)

## File Uploads

- `@fastify/multipart` for file handling, 10MB limit
- MIME type validation on upload
- Sharp generates 300px thumbnails automatically
- Assets stored in `apps/backend/uploads/`, thumbnails in `uploads/thumbs/`
