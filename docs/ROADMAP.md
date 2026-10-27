# ROADMAP.md — Plan de desarrollo

## Kalenda

**Versión:** 1.0  
**Fecha:** Abril 2026

---

## Estado actual

Las fases 0 a 5, 6a, 6b, 7, 8 y la implementación base de la 9 están funcionalmente construidas. La base de calidad y releases ya está operativa: CI para PRs y ramas principales, auditorías de dependencias, tests unitarios obligatorios y smoke tests de Docker Compose. El trabajo pendiente se concentra en:

1. Endurecimiento del despliegue de producción: secretos obligatorios, aislamiento de servicios, healthchecks, migraciones y backups.
2. Fiabilidad de exportaciones: recuperación y reintentos de trabajos interrumpidos.
3. Efectos de imagen en el editor.
4. Tests E2E, documentación de usuario y validación con el usuario principal.

Las casillas marcadas como completadas reflejan funcionalidad presente en el código; las tareas de endurecimiento y validación permanecen abiertas aunque el flujo principal ya funcione.

---

## Filosofía de desarrollo

- **MVP primero:** Construir lo mínimo que permita crear y exportar un calendario completo, aunque con menos opciones de personalización. Añadir funcionalidades iterativamente.
- **Vertical slices:** Cada fase entrega valor real y usable, no capas horizontales de tecnología.
- **Feedback continuo:** El usuario principal prueba en cuanto hay algo funcional.

---

## Fases de desarrollo

---

## Fase 0 — Setup e infraestructura

**Duración estimada:** 1-2 días  
**Objetivo:** Tener el esqueleto funcionando en el servidor.

### Tareas:

- [x] Inicializar monorepo con pnpm workspaces
- [x] Configurar TypeScript en frontend (Vite + React) y backend (Fastify)
- [x] Configurar Tailwind CSS y sistema de estilos de la aplicación
- [x] Configurar Prisma + schema inicial de base de datos
- [x] Crear docker-compose.yml y docker-compose.dev.yml
- [x] Configurar ESLint + Prettier
- [ ] Deploy del esqueleto vacío en el servidor Ubuntu
- [ ] Verificar que nginx sirve el frontend y proxea `/api/*` al backend
- [x] Crear paquete `shared/` con tipos TypeScript base

**Entregable:** `https://kalenda.tuservidor.com` muestra "Hola mundo" en producción.

---

## Fase 1 — Autenticación y gestión de usuarios

**Duración estimada:** 2-3 días  
**Objetivo:** Login funcional, dos usuarios (user + admin).

### Tareas:

- [x] Schema Prisma: tabla `users`
- [x] Backend: POST `/auth/login`, POST `/auth/logout`, POST `/auth/refresh`, GET `/auth/me`
- [x] Backend: middleware de autenticación JWT
- [x] Backend: CRUD básico de usuarios (solo admin)
- [x] Frontend: pantalla de Login con i18next (ES/EN)
- [x] Frontend: authStore (Zustand)
- [x] Frontend: rutas protegidas (redirect a login si no autenticado)
- [x] Frontend: página de admin → gestión de usuarios
- [x] Crear usuarios iniciales mediante seed de desarrollo y seed de producción

**Entregable:** Login y logout funcionando.

---

## Fase 2 — Gestión de proyectos (Dashboard)

**Duración estimada:** 2-3 días  
**Objetivo:** Crear, listar y organizar proyectos de calendario.

### Tareas:

- [x] Schema Prisma: tablas `projects`, `calendar_months`
- [x] Backend: CRUD de proyectos (`/projects`)
- [x] Backend: al crear proyecto, generar automáticamente 12 registros `calendar_months`
- [x] Backend: duplicar proyecto
- [x] Frontend: Dashboard con tarjetas de proyectos
- [x] Frontend: modal "Nuevo proyecto"
- [x] Frontend: Vista general de proyecto (12 meses en grid)
- [x] Frontend: estado visual de cada mes (vacío/con contenido/personalizado)

**Entregable:** Se pueden crear y organizar proyectos. La vista de 12 meses es navegable.

---

## Fase 3 — Biblioteca de assets

**Duración estimada:** 3-4 días  
**Objetivo:** Subir imágenes y stickers que persisten en el servidor.

### Tareas:

- [x] Schema Prisma: tablas `assets`, `asset_folders`
- [x] Backend: subida de archivos con validación (MIME, tamaño)
- [x] Backend: procesamiento con Sharp (miniaturas, optimización)
- [x] Backend: CRUD de carpetas y assets
- [x] Backend: servicio de `/uploads/` desde el backend; integración directa con Nginx queda pendiente de validar en producción
- [x] Frontend: página de Biblioteca (grid de imágenes, árbol de carpetas)
- [x] Frontend: subida drag & drop con barra de progreso
- [x] Frontend: búsqueda y filtrado

**Entregable:** Puede subir todas sus fotos una vez y acceder a ellas siempre.

---

## Fase 4 — Editor de mes: zona inferior (Grid)

**Duración estimada:** 5-7 días  
**Objetivo:** El grid del calendario es editable visualmente.

### Tareas:

- [x] Schema Prisma: actualizar `calendar_months` con `gridConfigJson`, `dayCells`
- [x] Backend: GET/PUT del mes (cargar y guardar estado)
- [x] Frontend: MonthEditorPage con layout básico (zonas superior/inferior)
- [x] Frontend: componente CalendarGrid (renderizado del mes correcto con días correctos)
- [x] Frontend: lógica de días (Gregoriano, primer día semana configurable)
- [x] Frontend: panel de propiedades del Grid (colores, bordes, fuentes)
- [x] Frontend: FontSelector con preview de fuentes (Fontsource)
- [x] Frontend: ColorPicker (react-colorful)
- [x] Frontend: posición del número en la celda (9 posiciones)
- [x] Frontend: modal de celda (color fondo, texto básico)
- [x] Frontend: auto-save cada 30 segundos
- [x] Frontend: botón Guardar manual

**Entregable:** Se puede personalizar el grid del calendario con colores, fuentes y bordes.

---

## Fase 5 — Festivos y eventos

**Duración estimada:** 3-4 días  
**Objetivo:** Festivos automáticos y eventos personalizados en el grid.

### Tareas:

- [x] Schema Prisma: tablas `holidays`, `events`
- [x] Importar base de datos de festivos nacionales ES (2025-2030) y por CCAA
- [x] Importar calendario de santos español
- [x] Backend: `/holidays`, `/saints`, `/events` (CRUD)
- [x] Backend: al cargar un mes, inyectar festivos y eventos en la respuesta
- [x] Frontend: página de gestión de eventos personalizados
- [x] Frontend: indicación visual de festivos en celdas (color diferente)
- [x] Frontend: indicación visual de eventos en celdas (icono + color)
- [x] Frontend: selector de CCAA en configuración del proyecto
- [x] Frontend: mostrar santo del día en celda
- [x] Frontend: modal de celda ampliado → ver y añadir eventos del día

**Entregable:** Los festivos aparecen automáticamente. Cumpleaños y aniversarios se pueden añadir.

---

## Fase 6 — Editor de mes: zona superior (Canvas Fabric.js)

**Duración estimada:** 7-10 días  
**Objetivo:** Editor visual completo para la zona de imagen/collage.

### Tareas:

- [x] Integrar Fabric.js en la zona superior del editor
- [x] Cargar/guardar estado del canvas (JSON) en el backend
- [x] Herramienta: selección y movimiento de elementos
- [x] Herramienta: añadir imagen desde biblioteca → objeto Fabric.js posicionable
- [x] Herramienta: control X/Y numérico + arrastre
- [x] Herramienta: redimensionar manteniendo proporciones
- [x] Herramienta: control de capa Z (traer al frente, enviar al fondo)
- [x] Panel de capas (lista de objetos del canvas)
- [ ] Herramienta: efectos de imagen (opacidad, brillo, contraste, escala de grises, sepia)
- [x] Herramienta: añadir texto decorativo libre con control de fuente/tamaño/color
- [x] Herramienta: fondo de zona (color, degradado, imagen)
- [x] Herramienta: añadir sticker/emoji como objeto del canvas
- [x] Deshacer/Rehacer (historial de canvas)
- [x] Zoom en el editor

**Entregable:** La zona superior es un editor visual completo. Se pueden hacer collages.

---

## Fase 6a — Layout unificado A4 y fondo de página completa

**Duración estimada:** 1 día  
**Objetivo:** El editor refleja una página A4 real (794×1123px) donde el canvas Fabric.js cubre toda la superficie y el grid del calendario es un overlay posicionado encima.

### Tareas:

- [x] Canvas Fabric.js redimensionado a página A4 completa (794×1123px)
- [x] Constantes `PAGE_WIDTH`, `PAGE_HEIGHT` en calendarTypes.ts
- [x] Grid del calendario como overlay HTML posicionado en la mitad inferior
- [x] Fondo de página (color/degradado/imagen) cubre el 100% — zona de fotos + tabla
- [x] Control de opacidad del fondo de página (vía BackgroundModal)
- [x] Control de opacidad general del grid (`gridOverlayOpacity`) para ver el fondo debajo
- [x] Objetos del canvas (fotos, texto, stickers) se mueven libremente por toda la página
- [x] Toggle de modo renombrado: "🎨 Decorar página" / "📅 Editar grid"

**Entregable:** El editor muestra una página A4 unificada. El fondo cubre toda la hoja. Las imágenes pueden hacer overflow a la zona del grid.

---

## Fase 6b — Grid arrastrable, redimensionable y con indicadores de distancia

**Duración estimada:** 1 día  
**Objetivo:** El grid del calendario se puede reposicionar y redimensionar visualmente (drag & resize) con indicadores de distancia a los bordes.

### Tareas:

- [x] Propiedades `gridX`, `gridY`, `gridWidth`, `gridHeight` en GridConfig
- [x] Campos numéricos en GridPropertiesPanel (X, Y, Ancho, Alto)
- [x] Componente `DraggableGridOverlay` con drag para mover, handles en bordes y esquinas para resize
- [x] Grid (CalendarGrid) con layout flex que se adapta al alto del contenedor
- [x] Indicadores de distancia a los 4 bordes de la página (líneas discontinuas + valor en px)
- [x] Sincronización bidireccional: drag ↔ inputs numéricos del panel

**Entregable:** La tabla de días se puede posicionar y dimensionar arrastrando. Los indicadores de distancia facilitan centrar y alinear.

---

## Fase 7 — Celda avanzada (imágenes y stickers en días)

**Duración estimada:** 3-4 días  
**Objetivo:** Cada celda del grid puede tener imagen, sticker y texto.

### Tareas:

- [x] Modal de celda: seleccionar imagen de biblioteca → se muestra en la celda
- [x] Modal de celda: seleccionar sticker/emoji → se muestra en la celda
- [x] Panel de Stickers y Emojis (con búsqueda)
- [x] Renderizado de celdas con contenido (imagen de fondo + sticker + texto + número)
- [x] Posicionamiento relativo dentro de la celda

**Entregable:** Las celdas se pueden decorar individualmente con fotos y stickers.

---

## Fase 8 — Plantillas

**Duración estimada:** 2-3 días  
**Objetivo:** Sistema de plantilla base + personalización por mes.

### Tareas:

- [x] Schema Prisma: tabla `templates`
- [x] Backend: CRUD de plantillas
- [x] Frontend: editor de plantilla base del proyecto
- [x] Frontend: indicador visual de mes con personalización propia
- [x] Frontend: "Aplicar a todos los meses" con confirmación
- [x] Frontend: guardar configuración actual como plantilla con nombre
- [x] Frontend: seleccionar plantilla al crear proyecto

**Entregable:** Se define una base visual y cada mes puede personalizarse sobre ella.

---

## Fase 9 — Exportación PDF/PNG

**Duración estimada:** 4-5 días  
**Objetivo:** Generar archivos de alta calidad listos para imprimir.

### Tareas:

- [x] Contenedor Docker para Puppeteer (sin sandbox, usuario no-root)
- [x] Ruta interna de renderizado (URL que Puppeteer abre para cada mes)
- [x] Backend: trabajos de exportación persistidos con estado y progreso
- [x] Puppeteer: captura PNG a 300 DPI (deviceScaleFactor)
- [x] Puppeteer: generación de PDF multipágina A4
- [x] Opción de guía de encuadernación (línea central)
- [x] Frontend: modal de exportación completo
- [x] Frontend: polling de estado + descarga automática
- [x] Configuración de nombre de archivo

**Entregable:** Se puede exportar el calendario completo en PDF listo para imprimir.

---

## Fase 10 — Pulido, UX y producción

**Duración estimada:** 3-4 días  
**Objetivo:** App lista para uso diario.

### Tareas:

- [x] Onboarding breve (tooltip tour en primer uso)
- [x] Tooltips en todas las herramientas del editor
- [x] Mensajes de error amigables en toda la app (toasts)
- [x] Optimización de rendimiento (lazy loading de páginas con React.lazy + Suspense)
- [x] Rate limiting en rutas de autenticación y API (`@fastify/rate-limit`)
- [x] Toggle mostrar/ocultar contraseña en login
- [x] Corrección build frontend para TypeScript 6
- [x] Endpoints de health básicos
- [x] Endurecimiento inicial de secretos: el compose de producción exige `COOKIE_SECRET`, `JWT_SECRET` y credenciales de administrador
- [x] Healthchecks de backend y Puppeteer en Compose de producción
- [x] Aislamiento de Puppeteer: sin puerto publicado fuera de la red Docker
- [x] CI para PRs y pushes a `main`/`dev` (lint, auditorías, build y tests)
- [x] Tests unitarios iniciales para configuración, schemas compartidos y helpers del calendario
- [x] Smoke test del stack de desarrollo con Docker Compose
- [ ] Tests de los flujos principales (Playwright)
- [ ] Documentación de uso básico (guía de usuario en PDF)
- [x] Configurar backup automático del volumen de datos y de los archivos persistentes
- [ ] Configurar HTTPS con certificado propio o Let's Encrypt
- [ ] Revisión completa con el usuario principal (prueba real)
- [x] Ejecutar migraciones de Prisma automáticamente durante el despliegue
- [ ] Recuperar y reintentar exportaciones interrumpidas
- [ ] Sustituir silencios de error en frontend por feedback accionable

**Entregable:** App en producción, estable y usable sin ayuda.

---

## Resumen de fases y estimaciones

| Fase | Descripción                   | Estado                                                   |
| ---- | ----------------------------- | -------------------------------------------------------- |
| 0    | Setup e infraestructura       | Funcional; despliegue real pendiente                     |
| 1    | Autenticación                 | Funcional                                                |
| 2    | Gestión de proyectos          | Funcional                                                |
| 3    | Biblioteca de assets          | Funcional                                                |
| 4    | Editor grid (zona inferior)   | Funcional                                                |
| 5    | Festivos y eventos            | Funcional                                                |
| 6    | Editor canvas (zona superior) | Funcional; efectos de imagen pendientes                  |
| 7    | Celdas avanzadas              | Funcional                                                |
| 8    | Plantillas                    | Funcional                                                |
| 9    | Exportación PDF/PNG           | Funcional; recuperación pendiente                        |
| 10   | Pulido y producción           | En curso; CI, migraciones y backups locales completados; operación y E2E pendientes |

> ⚠️ Estas estimaciones son para dedicación a tiempo parcial (no jornada completa). Ajustar según disponibilidad real.

---

## MVP funcional (Fases 0-5 + 9 básico)

Con las fases 0 a 5 más una versión básica de exportación, ya puede:

- Crear un proyecto de calendario
- Subir sus fotos
- Personalizar el grid (colores, fuentes)
- Ver los festivos automáticamente
- Añadir cumpleaños y eventos
- Exportar el PDF para imprimir

La zona de collage (Fase 6) es la más compleja y puede venir después del MVP.

---

## Ideas para v2 (post-MVP)

### Editor visual

- Máscaras de recorte para imágenes (círculo, corazón, estrella, hexágono)
- Marcos/bordes decorativos para fotos (polaroid, rasgado, sombra)
- Formas básicas (rectángulos, círculos, líneas, flechas)
- Collage automático: layouts predefinidos para la zona de fotos (1 foto, 2 lado a lado, mosaico…)
- Sombra y resplandor en objetos (drop shadow, glow)
- Multi-selección y agrupar/desagrupar objetos
- Texto con contorno (stroke) y degradado
- Guías de alineación (snap)

### Calendario y datos

- Números de semana (columna lateral opcional)
- Mini-calendario del mes anterior/siguiente en una esquina
- Eventos recurrentes (cada año, cada mes, cada semana)
- Importar eventos desde Google Calendar / archivo .ics
- Cuenta atrás a un evento destacado ("Faltan X días para…")
- Festivos internacionales

### Exportación e impresión

- Más tamaños de papel (A3, Letter, A5 — calendario de escritorio)
- Marcas de corte y sangrado (bleed) para impresión profesional
- Exportar meses individuales (no solo el calendario completo)
- Portada y contraportada personalizadas
- Exportar como imágenes sueltas (para WhatsApp, redes sociales)
- Calendario de pared vs. calendario de sobremesa (layouts diferentes)
- Revisar calendario físico y disposición de páginas. Por delante / detrás, una sola cara, cover y contraportada

### Plantillas y contenido

- Galería de temas estacionales (Navidad, verano, floral, minimalista…)
- Packs de stickers temáticos descargables
- Integración con bancos de imágenes gratuitos (Unsplash/Pexels)
- Generar sugerencias de diseño con IA a partir de las fotos subidas

### UX y productividad

- Compartir calendario como enlace de solo lectura
- Atajos de teclado configurables
- Panel de historial visual (ver snapshots de versiones anteriores)
- Duplicar mes con todo su contenido a otro mes
- "Aplicar estilo" — copiar solo la configuración visual (sin fotos) de un mes a otro
- Vista de año completo en miniatura (bird's eye view)
- Modo presentación: ver el calendario pasando meses como slideshow
