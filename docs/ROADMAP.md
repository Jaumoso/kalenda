# ROADMAP.md — Plan de desarrollo

## CalendApp

**Versión:** 1.0  
**Fecha:** Abril 2026

---

## Filosofía de desarrollo

- **MVP primero:** Construir lo mínimo que permita a tu madre crear y exportar un calendario completo, aunque con menos opciones de personalización. Añadir funcionalidades iterativamente.
- **Vertical slices:** Cada fase entrega valor real y usable, no capas horizontales de tecnología.
- **Feedback continuo:** El usuario principal (tu madre) prueba en cuanto hay algo funcional.

---

## Fases de desarrollo

---

## Fase 0 — Setup e infraestructura

**Duración estimada:** 1-2 días  
**Objetivo:** Tener el esqueleto funcionando en el servidor.

### Tareas:

- [ ] Inicializar monorepo con pnpm workspaces
- [ ] Configurar TypeScript en frontend (Vite + React) y backend (Fastify)
- [ ] Configurar Tailwind CSS y shadcn/ui
- [ ] Configurar Prisma + schema inicial de base de datos
- [ ] Crear docker-compose.yml (nginx, frontend, backend, postgres)
- [ ] Crear docker-compose.dev.yml (con hot reload)
- [ ] Configurar ESLint + Prettier
- [ ] Deploy del esqueleto vacío en el servidor Ubuntu
- [ ] Verificar que nginx sirve el frontend y proxea `/api/*` al backend
- [ ] Crear paquete `shared/` con tipos TypeScript base

**Entregable:** `https://calendapp.tuservidor.com` muestra "Hola mundo" en producción.

---

## Fase 1 — Autenticación y gestión de usuarios

**Duración estimada:** 2-3 días  
**Objetivo:** Login funcional, dos usuarios (madre + admin).

### Tareas:

- [ ] Schema Prisma: tabla `users`
- [ ] Backend: POST `/auth/login`, POST `/auth/logout`, POST `/auth/refresh`, GET `/auth/me`
- [ ] Backend: middleware de autenticación JWT
- [ ] Backend: CRUD básico de usuarios (solo admin)
- [ ] Frontend: pantalla de Login con i18next (ES/EN)
- [ ] Frontend: authStore (Zustand)
- [ ] Frontend: rutas protegidas (redirect a login si no autenticado)
- [ ] Frontend: página de admin → gestión de usuarios
- [ ] Crear los dos usuarios iniciales (seed)

**Entregable:** Login y logout funcionando. La madre puede entrar con su cuenta.

---

## Fase 2 — Gestión de proyectos (Dashboard)

**Duración estimada:** 2-3 días  
**Objetivo:** Crear, listar y organizar proyectos de calendario.

### Tareas:

- [ ] Schema Prisma: tablas `projects`, `calendar_months`
- [ ] Backend: CRUD de proyectos (`/projects`)
- [ ] Backend: al crear proyecto, generar automáticamente 12 registros `calendar_months`
- [ ] Backend: duplicar proyecto
- [ ] Frontend: Dashboard con tarjetas de proyectos
- [ ] Frontend: modal "Nuevo proyecto"
- [ ] Frontend: Vista general de proyecto (12 meses en grid)
- [ ] Frontend: estado visual de cada mes (vacío/con contenido/personalizado)

**Entregable:** Se pueden crear y organizar proyectos. La vista de 12 meses es navegable.

---

## Fase 3 — Biblioteca de assets

**Duración estimada:** 3-4 días  
**Objetivo:** Subir imágenes y stickers que persisten en el servidor.

### Tareas:

- [ ] Schema Prisma: tablas `assets`, `asset_folders`
- [ ] Backend: subida de archivos con validación (MIME, tamaño)
- [ ] Backend: procesamiento con Sharp (miniaturas, optimización)
- [ ] Backend: CRUD de carpetas y assets
- [ ] Backend: Nginx configurado para servir `/uploads/` directamente
- [ ] Frontend: página de Biblioteca (grid de imágenes, árbol de carpetas)
- [ ] Frontend: subida drag & drop con barra de progreso
- [ ] Frontend: búsqueda y filtrado

**Entregable:** La madre puede subir todas sus fotos una vez y acceder a ellas siempre.

---

## Fase 4 — Editor de mes: zona inferior (Grid)

**Duración estimada:** 5-7 días  
**Objetivo:** El grid del calendario es editable visualmente.

### Tareas:

- [ ] Schema Prisma: actualizar `calendar_months` con `gridConfigJson`, `dayCells`
- [ ] Backend: GET/PUT del mes (cargar y guardar estado)
- [ ] Frontend: MonthEditorPage con layout básico (zonas superior/inferior)
- [ ] Frontend: componente CalendarGrid (renderizado del mes correcto con días correctos)
- [ ] Frontend: lógica de días (Gregoriano, primer día semana configurable)
- [ ] Frontend: panel de propiedades del Grid (colores, bordes, fuentes)
- [ ] Frontend: FontSelector con preview de fuentes (Fontsource)
- [ ] Frontend: ColorPicker (react-colorful)
- [ ] Frontend: posición del número en la celda (9 posiciones)
- [ ] Frontend: modal de celda (color fondo, texto básico)
- [ ] Frontend: auto-save cada 30 segundos
- [ ] Frontend: botón Guardar manual

**Entregable:** Se puede personalizar el grid del calendario con colores, fuentes y bordes.

---

## Fase 5 — Festivos y eventos

**Duración estimada:** 3-4 días  
**Objetivo:** Festivos automáticos y eventos personalizados en el grid.

### Tareas:

- [ ] Schema Prisma: tablas `holidays`, `events`
- [ ] Importar base de datos de festivos nacionales ES (2025-2030) y por CCAA
- [ ] Importar calendario de santos español
- [ ] Backend: `/holidays`, `/saints`, `/events` (CRUD)
- [ ] Backend: al cargar un mes, inyectar festivos y eventos en la respuesta
- [ ] Frontend: página de gestión de eventos personalizados
- [ ] Frontend: indicación visual de festivos en celdas (color diferente)
- [ ] Frontend: indicación visual de eventos en celdas (icono + color)
- [ ] Frontend: selector de CCAA en configuración del proyecto
- [ ] Frontend: mostrar santo del día en celda (activable/desactivable)
- [ ] Frontend: modal de celda ampliado → ver y añadir eventos del día

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

- [ ] Modal de celda: seleccionar imagen de biblioteca → se muestra en la celda
- [ ] Modal de celda: seleccionar sticker/emoji → se muestra en la celda
- [ ] Panel de Stickers y Emojis (con búsqueda)
- [ ] Renderizado de celdas con contenido (imagen de fondo + sticker + texto + número)
- [ ] Posicionamiento relativo dentro de la celda

**Entregable:** Las celdas se pueden decorar individualmente con fotos y stickers.

---

## Fase 8 — Plantillas

**Duración estimada:** 2-3 días  
**Objetivo:** Sistema de plantilla base + personalización por mes.

### Tareas:

- [ ] Schema Prisma: tabla `templates`
- [ ] Backend: CRUD de plantillas
- [ ] Frontend: editor de plantilla base del proyecto
- [ ] Frontend: indicador visual de mes con personalización propia
- [ ] Frontend: "Aplicar a todos los meses" con confirmación
- [ ] Frontend: guardar configuración actual como plantilla con nombre
- [ ] Frontend: seleccionar plantilla al crear proyecto

**Entregable:** Se define una base visual y cada mes puede personalizarse sobre ella.

---

## Fase 9 — Exportación PDF/PNG

**Duración estimada:** 4-5 días  
**Objetivo:** Generar archivos de alta calidad listos para imprimir.

### Tareas:

- [ ] Contenedor Docker para Puppeteer (sin sandbox, usuario no-root)
- [ ] Ruta interna de renderizado (URL que Puppeteer abre para cada mes)
- [ ] Backend: cola de trabajos de exportación con estado
- [ ] Puppeteer: captura PNG a 300 DPI (deviceScaleFactor)
- [ ] Puppeteer: generación de PDF multipágina A4
- [ ] Opción de guía de encuadernación (línea central)
- [ ] Frontend: modal de exportación completo
- [ ] Frontend: polling de estado + descarga automática
- [ ] Configuración de nombre de archivo

**Entregable:** Se puede exportar el calendario completo en PDF listo para imprimir.

---

## Fase 10 — Pulido, UX y producción

**Duración estimada:** 3-4 días  
**Objetivo:** App lista para uso diario por la madre.

### Tareas:

- [ ] Onboarding breve (tooltip tour en primer uso)
- [ ] Tooltips en todas las herramientas del editor
- [ ] Mensajes de error amigables en toda la app
- [ ] Optimización de rendimiento (lazy loading de assets, compresión)
- [ ] Rate limiting en rutas de autenticación y API (`@fastify/rate-limit`)
- [ ] Tests de los flujos principales (Playwright)
- [ ] Documentación de uso básico (guía de usuario en PDF)
- [ ] Configurar backup automático del volumen de datos
- [ ] Configurar HTTPS con certificado propio o Let's Encrypt
- [ ] Revisión completa con el usuario principal (prueba real)

**Entregable:** App en producción, estable y usable por la madre sin ayuda.

---

## Resumen de fases y estimaciones

| Fase      | Descripción                   | Estimación      |
| --------- | ----------------------------- | --------------- |
| 0         | Setup e infraestructura       | 1-2 días        |
| 1         | Autenticación                 | 2-3 días        |
| 2         | Gestión de proyectos          | 2-3 días        |
| 3         | Biblioteca de assets          | 3-4 días        |
| 4         | Editor grid (zona inferior)   | 5-7 días        |
| 5         | Festivos y eventos            | 3-4 días        |
| 6         | Editor canvas (zona superior) | 7-10 días       |
| 7         | Celdas avanzadas              | 3-4 días        |
| 8         | Plantillas                    | 2-3 días        |
| 9         | Exportación PDF/PNG           | 4-5 días        |
| 10        | Pulido y producción           | 3-4 días        |
| **Total** |                               | **~35-49 días** |

> ⚠️ Estas estimaciones son para dedicación a tiempo parcial (no jornada completa). Ajustar según disponibilidad real.

---

## MVP funcional (Fases 0-5 + 9 básico)

Con las fases 0 a 5 más una versión básica de exportación, la madre ya puede:

- Crear un proyecto de calendario
- Subir sus fotos
- Personalizar el grid (colores, fuentes)
- Ver los festivos automáticamente
- Añadir cumpleaños y eventos
- Exportar el PDF para imprimir

La zona de collage (Fase 6) es la más compleja y puede venir después del MVP.

---

## Ideas para v2 (post-MVP)

- Portada y contraportada
- Vista previa de impresión (simulación física)
- Copiar/pegar elementos entre meses
- Guías de alineación (snap)
- Festivos internacionales
- Modo oscuro
- Compartir calendario como enlace de solo lectura
