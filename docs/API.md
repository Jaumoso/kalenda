# API.md — Contrato de la API REST

## CalendApp

**Versión:** 1.1  
**Fecha:** Abril 2026  
**Base URL:** `https://{servidor}/api`  
**Autenticación:** JWT en httpOnly cookies (automático en todas las peticiones)  
**Formato:** JSON en request y response  
**Convención de errores:** `{ "error": "CÓDIGO", "message": "Descripción legible" }`

---

## Convenciones generales

- Todas las rutas protegidas requieren autenticación (cookie `accessToken` válida)
- Las rutas marcadas con `[ADMIN]` requieren rol `ADMIN`
- Paginación: `?page=1&limit=20` donde aplique
- Fechas en formato ISO 8601: `2026-01-15T10:30:00Z`
- IDs como CUID

---

## 1. Autenticación

### POST `/auth/login`

Iniciar sesión.

**Request:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña",
  "rememberMe": true
}
```

**Response 200:**

```json
{
  "user": {
    "id": "uuid",
    "name": "Nombre",
    "email": "usuario@ejemplo.com",
    "role": "USER",
    "language": "es"
  }
}
```

Además: `Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict; Path=/`  
Además: `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh`

**Errores:** `401 INVALID_CREDENTIALS`

---

### POST `/auth/logout`

Cerrar sesión. Limpia cookies.

**Response 200:** `{ "ok": true }`

---

### POST `/auth/refresh`

Obtener nuevo accessToken usando refreshToken (automático vía interceptor).

**Response 200:** Nuevo accessToken en cookie.  
**Errores:** `401 REFRESH_TOKEN_EXPIRED` → el usuario debe hacer login de nuevo.

---

### GET `/auth/me`

Obtener datos del usuario autenticado actual.

**Response 200:**

```json
{
  "id": "uuid",
  "name": "Nombre",
  "email": "usuario@ejemplo.com",
  "role": "user",
  "language": "es",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

---

## 2. Usuarios

### GET `/users` `[ADMIN]`

Listar todos los usuarios.

**Response 200:**

```json
{
  "users": [
    {
      "id": "cuid",
      "name": "...",
      "email": "...",
      "role": "USER",
      "language": "es",
      "isActive": true,
      "createdAt": "..."
    }
  ]
}
```

---

### POST `/users` `[ADMIN]`

Crear nuevo usuario.

**Request:**

```json
{
  "name": "Nombre",
  "email": "email@ejemplo.com",
  "password": "contraseña",
  "role": "USER"
}
```

**Response 201:**

```json
{ "id": "cuid", "name": "Nombre", "email": "...", "role": "USER", "language": "es" }
```

**Errores:** `409 EMAIL_ALREADY_EXISTS`

---

### PATCH `/users/:id` `[ADMIN o propio usuario]`

Actualizar usuario (nombre, idioma, contraseña).

**Request (campos opcionales):**

```json
{
  "name": "Nuevo nombre",
  "language": "en",
  "currentPassword": "actual",
  "newPassword": "nueva"
}
```

**Response 200:** Usuario actualizado.  
**Errores:** `403 WRONG_CURRENT_PASSWORD`, `404 NOT_FOUND`

---

### PATCH `/users/:id/status` `[ADMIN]`

Activar o desactivar un usuario.

**Request:** `{ "active": false }`  
**Response 200:** `{ "ok": true }`

---

### PATCH `/users/:id/role` `[ADMIN]`

Cambiar rol de un usuario.

**Request:** `{ "role": "ADMIN" }`  
**Response 200:** Usuario actualizado.

---

### DELETE `/users/:id` `[ADMIN]`

Eliminar un usuario (no se puede eliminar a uno mismo).

**Response 204:** Sin contenido.

---

## 3. Proyectos

### GET `/projects`

Listar proyectos del usuario autenticado.

**Query params:** `?status=draft|in_progress|completed`, `?year=2026`

**Response 200:**

```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Calendario 2026",
      "year": 2026,
      "status": "in_progress",
      "completedMonths": 7,
      "thumbnailUrl": "/assets/.../thumb.jpg",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### POST `/projects`

Crear nuevo proyecto.

**Request:**

```json
{
  "name": "Calendario 2026",
  "year": 2026,
  "templateId": "uuid-opcional"
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "name": "Calendario 2026",
  "year": 2026,
  "status": "draft",
  "months": [
    /* 12 objetos month vacíos */
  ]
}
```

---

### GET `/projects/:id`

Obtener detalle de un proyecto con sus meses.

**Response 200:**

```json
{
  "id": "uuid",
  "name": "Calendario 2026",
  "year": 2026,
  "status": "in_progress",
  "templateId": "uuid",
  "autonomyCode": "VC",
  "weekStartsOn": "monday",
  "months": [
    { "id": "uuid", "monthNumber": 1, "isCustomized": true, "thumbnailUrl": "..." },
    ...
  ]
}
```

---

### PATCH `/projects/:id`

Actualizar metadatos del proyecto.

**Request (campos opcionales):**

```json
{
  "name": "Nuevo nombre",
  "status": "completed",
  "templateId": "uuid",
  "autonomyCode": "MD",
  "weekStartsOn": "sunday"
}
```

**Response 200:** Proyecto actualizado.

---

### POST `/projects/:id/duplicate`

Duplicar un proyecto.

**Request:** `{ "name": "Calendario 2027" }`  
**Response 201:** Nuevo proyecto.

---

### DELETE `/projects/:id`

Eliminar un proyecto y sus datos (los assets de biblioteca se conservan).

**Response 204:** Sin contenido.

---

## 4. Meses del calendario

### GET `/projects/:id/months/:month`

Obtener el estado completo de un mes para cargar en el editor.

**Params:** `:month` = 1-12

**Response 200:**

```json
{
  "id": "uuid",
  "projectId": "uuid",
  "monthNumber": 1,
  "year": 2026,
  "canvasTopJson": {
    /* estado serializado de Fabric.js */
  },
  "gridConfigJson": {
    "tableBgColor": "#FFFFFF",
    "tableBgOpacity": 0.9,
    "borderColor": "#CCCCCC",
    "borderWidth": 1,
    "borderStyle": "solid",
    "numberFont": "Playfair Display",
    "numberSize": 16,
    "numberColor": "#1A1A1A",
    "numberWeight": "normal",
    "numberPosition": "top-left",
    "weekendBgColor": "#FFF5F5",
    "weekStartsOn": "monday"
  },
  "dayCells": [
    {
      "dayNumber": 15,
      "bgColor": "#FFF9E6",
      "contentJson": {
        "imageAssetId": "uuid",
        "stickerAssetId": null,
        "emoji": "🎂",
        "text": "Cumpleaños Ana"
      },
      "hasEvent": true,
      "hasHoliday": false
    }
  ],
  "holidays": [{ "day": 1, "name": "Año Nuevo", "scope": "national" }],
  "events": [
    { "day": 15, "name": "Cumpleaños Ana", "type": "birthday", "color": "#FF69B4", "icon": "🎂" }
  ],
  "isCustomized": true
}
```

---

### PUT `/projects/:id/months/:month`

Guardar el estado completo de un mes (auto-save o guardado manual).

**Request:**

```json
{
  "canvasTopJson": {
    /* estado Fabric.js */
  },
  "gridConfigJson": {
    /* configuración del grid */
  },
  "dayCells": [
    /* array de celdas modificadas */
  ]
}
```

**Response 200:** `{ "ok": true, "savedAt": "2026-01-15T14:32:00Z" }`

---

### POST `/projects/:id/months/:month/apply-to-all`

Aplicar la configuración visual de este mes (grid config) a todos los demás.

**Response 200:** `{ "ok": true, "updatedMonths": [1,2,3,...,12] }`

---

## 5. Assets (Biblioteca)

### GET `/assets`

Listar assets del usuario.

**Query params:** `?folderId=uuid`, `?type=image|sticker`, `?q=nombre`

**Response 200:**

```json
{
  "assets": [
    {
      "id": "uuid",
      "filename": "foto_verano.jpg",
      "originalName": "DSC_0123.jpg",
      "url": "/uploads/user-id/folder-id/foto_verano.jpg",
      "thumbUrl": "/uploads/user-id/thumbs/foto_verano_thumb.jpg",
      "type": "image",
      "width": 3840,
      "height": 2160,
      "sizeBytes": 4200000,
      "folderId": "uuid",
      "createdAt": "..."
    }
  ],
  "total": 42
}
```

---

### POST `/assets/upload`

Subir uno o más assets. Multipart form data.

**Form fields:**

- `files`: uno o más archivos
- `folderId`: UUID de carpeta (opcional)
- `type`: `image` | `sticker`

**Response 201:**

```json
{
  "uploaded": [{ "id": "uuid", "filename": "...", "url": "...", "thumbUrl": "..." }],
  "errors": []
}
```

**Errores:** `413 FILE_TOO_LARGE`, `415 UNSUPPORTED_FORMAT`

---

### DELETE `/assets/:id`

Eliminar un asset. Falla si el asset está siendo usado en algún mes.

**Response 204:** Sin contenido.  
**Errores:** `409 ASSET_IN_USE`

---

### GET `/assets/folders`

Listar carpetas del usuario.

**Response 200:**

```json
{
  "folders": [{ "id": "uuid", "name": "Fotos 2025", "parentId": null, "assetCount": 24 }]
}
```

---

### POST `/assets/folders`

Crear carpeta.

**Request:** `{ "name": "Fotos 2026", "parentId": "uuid-opcional" }`  
**Response 201:** `{ "id": "uuid", "name": "Fotos 2026" }`

---

### PATCH `/assets/folders/:id`

Renombrar carpeta.

**Request:** `{ "name": "Nuevo nombre" }`  
**Response 200:** Carpeta actualizada.

---

### DELETE `/assets/folders/:id`

Eliminar carpeta (debe estar vacía).

**Response 204:** Sin contenido.  
**Errores:** `409 FOLDER_NOT_EMPTY`

---

## 6. Eventos personalizados

### GET `/events`

Listar todos los eventos del usuario (recurrentes y puntuales).

**Response 200:**

```json
{
  "events": [
    {
      "id": "uuid",
      "name": "Cumpleaños Ana",
      "day": 15,
      "month": 1,
      "year": null,
      "type": "birthday",
      "color": "#FF69B4",
      "icon": "🎂",
      "isRecurring": true
    }
  ]
}
```

---

### POST `/events`

Crear evento.

**Request:**

```json
{
  "name": "Cumpleaños Ana",
  "day": 15,
  "month": 1,
  "year": null,
  "type": "birthday",
  "color": "#FF69B4",
  "icon": "🎂",
  "isRecurring": true
}
```

**Response 201:** Evento creado.

---

### PATCH `/events/:id`

Actualizar evento.

**Response 200:** Evento actualizado.

---

### DELETE `/events/:id`

Eliminar evento.

**Response 204:** Sin contenido.

---

## 7. Festivos

### GET `/holidays`

Obtener festivos para un año y comunidad autónoma.

**Query params:** `?year=2026&autonomyCode=VC`

**Response 200:**

```json
{
  "holidays": [
    {
      "day": 1,
      "month": 1,
      "nameEs": "Año Nuevo",
      "nameEn": "New Year's Day",
      "scope": "national"
    },
    {
      "day": 9,
      "month": 10,
      "nameEs": "Día de la Comunitat Valenciana",
      "nameEn": "Valencia Day",
      "scope": "autonomy",
      "autonomyCode": "VC"
    }
  ]
}
```

---

### GET `/holidays/autonomies`

Listar comunidades autónomas disponibles.

**Response 200:**

```json
{
  "autonomies": [
    { "code": "VC", "nameEs": "Comunitat Valenciana", "nameEn": "Valencian Community" },
    { "code": "MD", "nameEs": "Comunidad de Madrid", "nameEn": "Community of Madrid" }
    // ... resto de comunidades
  ]
}
```

---

## 8. Santos

### GET `/saints`

Obtener santos para un mes concreto.

**Query params:** `?month=1`

**Response 200:**

```json
{
  "saints": [
    { "day": 1, "month": 1, "names": ["María", "Manuel"] },
    { "day": 2, "month": 1, "names": ["Basilio"] }
  ]
}
```

---

## 9. Plantillas

### GET `/templates`

Listar plantillas del usuario.

**Response 200:**

```json
{
  "templates": [
    { "id": "uuid", "name": "Estilo verano", "isDefault": false, "configJson": {...} }
  ]
}
```

---

### POST `/templates`

Guardar configuración actual como plantilla.

**Request:** `{ "name": "Mi plantilla", "configJson": { /* grid config + estilos */ } }`  
**Response 201:** Plantilla creada.

---

### DELETE `/templates/:id`

Eliminar plantilla.

**Response 204:** Sin contenido.

---

## 10. Exportación

### POST `/exports`

Solicitar exportación de uno o varios meses.

**Request:**

```json
{
  "projectId": "uuid",
  "months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  "formats": ["pdf", "png"],
  "options": {
    "includebindingGuide": true,
    "filename": "Calendario_2026"
  }
}
```

**Response 202 (Accepted):**

```json
{
  "jobId": "uuid",
  "estimatedSeconds": 30,
  "statusUrl": "/api/v1/exports/uuid/status"
}
```

---

### GET `/exports/:jobId/status`

Consultar estado del trabajo de exportación (polling).

**Response 200:**

```json
{
  "jobId": "uuid",
  "status": "processing",
  "progress": 4,
  "total": 12,
  "message": "Generando mes 4 de 12..."
}
```

```json
{
  "jobId": "uuid",
  "status": "completed",
  "files": [
    {
      "name": "Calendario_2026.pdf",
      "url": "/exports/uuid/Calendario_2026.pdf",
      "sizeBytes": 24000000
    },
    { "name": "Enero_2026.png", "url": "/exports/uuid/Enero_2026.png" }
  ]
}
```

**Status posibles:** `queued` | `processing` | `completed` | `failed`

---

## 11. Códigos de error comunes

| Código HTTP | Código interno             | Descripción                                   |
| ----------- | -------------------------- | --------------------------------------------- |
| 400         | VALIDATION_ERROR           | Datos de entrada inválidos                    |
| 401         | UNAUTHORIZED               | No autenticado                                |
| 401         | TOKEN_EXPIRED              | Token expirado (el cliente debe refrescar)    |
| 403         | FORBIDDEN                  | Sin permisos para esta acción                 |
| 404         | NOT_FOUND                  | Recurso no encontrado                         |
| 409         | CONFLICT                   | Conflicto (email duplicado, asset en uso...)  |
| 413         | FILE_TOO_LARGE             | Archivo supera el límite                      |
| 415         | UNSUPPORTED_FORMAT         | Formato de archivo no soportado               |
| 500         | INTERNAL_ERROR             | Error interno del servidor                    |
| 503         | EXPORT_SERVICE_UNAVAILABLE | El servicio de exportación no está disponible |
