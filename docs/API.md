# API Contract

Base URL: /api
Authentication: JWT via httpOnly cookies
Format: JSON

## Authentication
- POST /auth/login
- GET /auth/registration-status
- POST /auth/register
- POST /auth/logout
- POST /auth/refresh
- GET /auth/me

`POST /auth/register` creates a standard `USER` only when `ALLOW_USER_REGISTRATION=true`
and an administrator has already been bootstrapped. The registration `name` is the user's
display name; users sign in with the registered `email`. Administrator accounts are created
through the required `ADMIN_EMAIL` and `ADMIN_PASSWORD` bootstrap variables.

## Users
- GET /users (admin)
- POST /users (admin)
- PATCH /users/:id
- PATCH /users/:id/status (admin)
- PATCH /users/:id/role (admin)
- DELETE /users/:id (admin)
- PATCH /users/:id also allows the authenticated user to update their own name, language and
  password. Password changes require the current password.

## Projects
- GET /projects
- POST /projects
- GET /projects/:id
- PATCH /projects/:id
- POST /projects/:id/duplicate
- DELETE /projects/:id
- GET /projects/:id/covers
- PUT /projects/:id/covers

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
- GET/POST/PUT/DELETE /events
- POST /events/import (multipart field `file`, `.ics` or `text/calendar`)

`/events/import` accepts calendar files exported from Google Calendar or other
iCalendar-compatible applications. It imports `SUMMARY`, `DTSTART`, `UID` and the
supported `RRULE` frequencies (YEARLY, MONTHLY and WEEKLY). Re-importing the same
UID skips the duplicate. OAuth connection, live synchronization, attendees,
notifications, and unsupported `EXDATE`/`RDATE` or complex recurrence rules are
outside this endpoint's scope and are reported as import errors.
- GET /holidays
- GET /holidays/autonomies
- GET/POST/DELETE /templates

## Export
- POST /exports
- GET /exports/:id
- GET /exports/:id/download
- GET /exports
- DELETE /exports/:id

## Rendering and previews
- GET /preview-tokens/:projectId
- GET /render-data/:monthId
- GET /render-data/cover/:projectId

The render-data endpoints use a short-lived token issued by
`/preview-tokens/:projectId` and are intended for the Puppeteer renderer.

## Health
- GET /health

With the `/api` base URL, the full endpoint is `/api/health`. It returns the service
status and a timestamp.

## Error model

```json
{ "error": "ERROR_CODE", "message": "Readable message" }
```
