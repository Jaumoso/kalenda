# API Contract

Base URL: /api
Authentication: JWT via httpOnly cookies
Format: JSON

## Authentication
- POST /auth/login
- POST /auth/logout
- POST /auth/refresh
- GET /auth/me

## Users
- GET /users (admin)
- POST /users (admin)
- PATCH /users/:id
- PATCH /users/:id/status (admin)
- PATCH /users/:id/role (admin)
- DELETE /users/:id (admin)

## Projects
- GET /projects
- POST /projects
- GET /projects/:id
- PATCH /projects/:id
- POST /projects/:id/duplicate
- DELETE /projects/:id

## Months
- GET /projects/:id/months/:month
- PUT /projects/:id/months/:month
- POST /projects/:id/months/:month/apply-to-all

## Assets and Folders
- GET /assets
- POST /assets/upload
- DELETE /assets/:id
- PATCH /assets/:id
- GET /folders
- POST /folders
- PATCH /folders/:id
- DELETE /folders/:id

## Events, Holidays, Templates
- GET/POST/PATCH/DELETE /events
- GET /holidays
- GET /holidays/autonomies
- GET/POST/DELETE /templates

## Export
- POST /exports
- GET /exports/:id
- GET /exports/:id/download
- GET /exports
- DELETE /exports/:id

## Error model

```json
{ "error": "ERROR_CODE", "message": "Readable message" }
```
