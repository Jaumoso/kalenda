# Guía básica de uso de Kalenda

## 1. Primer acceso

La cuenta de administrador se crea durante el primer arranque con `ADMIN_EMAIL` y
`ADMIN_PASSWORD` del archivo `.env`. El inicio de sesión usa siempre el correo electrónico;
el nombre de usuario solo identifica visualmente la cuenta.

El administrador puede crear usuarios desde **Administración**. El registro público es
opcional y solo crea cuentas normales (`USER`); se habilita con:

```dotenv
ALLOW_USER_REGISTRATION=true
```

El bootstrap del administrador sigue siendo obligatorio aunque el registro público esté
activado.

## 2. Crear un calendario

1. Entra en **Mis calendarios**.
2. Pulsa **Nuevo calendario**.
3. Indica el nombre, el año y la configuración regional del proyecto.
4. El proyecto se crea con sus doce meses y queda disponible en el dashboard.
5. Usa el selector de estado para marcarlo como borrador, en progreso o completado.

El dashboard muestra qué meses tienen personalización y si la portada o contraportada ya
han sido editadas. Los proyectos se pueden duplicar o eliminar desde su tarjeta.

## 3. Biblioteca de imágenes

Abre **Biblioteca** para organizar fotos y otros assets:

- Arrastra archivos al área de subida o selecciónalos desde el explorador.
- Crea carpetas y mueve assets entre carpetas.
- Usa el buscador para localizar una imagen.
- Renombra o elimina carpetas y archivos cuando ya no sean necesarios.

Desde el editor también se puede subir una imagen nueva en el selector de assets y utilizarla
inmediatamente sin volver a la biblioteca.

## 4. Editar un mes

1. Abre un proyecto y selecciona uno de sus meses.
2. Usa **Decorar página** para trabajar sobre el lienzo A4 completo.
3. Añade imágenes, stickers y texto; muévelos, cambia su tamaño y ajusta sus capas.
4. Configura el fondo de página y los efectos disponibles para las imágenes.
5. Cambia a **Editar grid** para ajustar colores, bordes, fuentes y posición de la tabla.
6. El grid se puede mover y redimensionar arrastrándolo o introduciendo sus coordenadas.
7. Activa **Mostrar mes anterior y siguiente** para añadir mini-calendarios auxiliares.
   Arrástralos o usa sus asas para cambiar su posición y tamaño; no pueden cubrir el grid.
8. Abre una celda para añadir texto, una imagen o un sticker y ajustar su posición.
9. Guarda manualmente o espera al auto-guardado.

El panel de capas permite seleccionar objetos superpuestos. Los controles de deshacer y rehacer
permiten recuperar cambios recientes.

## 5. Portada y contraportada

En la vista del proyecto, abre **Portada** o **Contraportada** para diseñarlas con el mismo
editor visual. El dashboard muestra el estado de cada una para saber si ya contiene una
personalización.

## 6. Festivos y eventos

En **Eventos** se pueden crear cumpleaños, aniversarios y eventos personalizados. Cada evento
puede tener día, mes, año, color y recurrencia anual. Los festivos nacionales y autonómicos
se incorporan automáticamente al grid según la configuración regional del proyecto.

También se pueden consultar y editar los eventos desde la celda del día correspondiente.

En la vista del proyecto, el selector **Evento destacado para la cuenta atrás** permite
elegir un evento como objetivo. La cuenta atrás aparece en cada mes y en la vista previa y
exportación. Las fechas se calculan como días naturales según la zona horaria del navegador;
si el evento no tiene una ocurrencia válida en el año del proyecto, se indica que falta o que
ya no está vigente en lugar de mostrar un valor engañoso.

## 7. Plantillas

En **Plantillas** se puede guardar una configuración visual reutilizable. Desde un proyecto:

1. Selecciona una plantilla al crear el proyecto, o abre la gestión de plantillas.
2. Guarda el diseño actual como plantilla con un nombre.
3. Usa **Aplicar a todos los meses** cuando quieras propagar la configuración.
4. Confirma la operación: los meses con personalización propia pueden sobrescribirse.

## 8. Vista previa y exportación

Desde la vista del proyecto:

1. Pulsa **Vista previa de impresión** para revisar el resultado.
2. Pulsa **Exportar**.
3. Selecciona PDF o PNG y configura el nombre del archivo y la guía de encuadernación si
   corresponde.
4. Espera a que termine el trabajo de exportación; el progreso se actualiza automáticamente.
5. Descarga el archivo cuando el trabajo finalice.

La exportación se procesa en segundo plano. Si el backend se reinicia, los trabajos
interrumpidos se recuperan y se reintentan según su estado.

## 9. Perfil y preferencias

Desde el perfil se puede cambiar:

- Nombre de usuario visible.
- Idioma de la interfaz (español o inglés).
- Contraseña, proporcionando primero la contraseña actual.

Cerrar sesión invalida la sesión actual. Si se olvida la contraseña, un administrador debe
restablecerla desde **Administración**.

## 10. Recomendaciones

- Guarda manualmente después de cambios importantes, aunque exista auto-guardado.
- Mantén copias externas del directorio `backups` y del archivo `.env`.
- No uses `docker compose down -v` salvo que quieras eliminar deliberadamente la base de datos.
- Valida una exportación antes de enviar el calendario a imprimir.
