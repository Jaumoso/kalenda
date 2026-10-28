# Runbook operativo de Kalenda

Este documento describe las comprobaciones y operaciones mínimas para mantener una
instalación de Kalenda. Los comandos se ejecutan desde el directorio que contiene
`docker-compose.yml` y `.env`.

## Comprobación básica

```bash
docker compose ps
curl -fsS http://localhost:3000/api/health
docker compose logs --tail=100 backend
```

Todos los servicios deben estar `running` y los healthchecks de `backend`, `postgres` y
`puppeteer` deben estar saludables. La respuesta del backend debe incluir
`"status":"ok"`.

Para validar la interfaz, abre la URL publicada y comprueba login, dashboard, biblioteca,
editor, vista previa y exportación. La guía funcional está en
[`USER_GUIDE.md`](USER_GUIDE.md).

## Backups

El servicio `backup` genera un archivo `backups/kalenda-<timestamp>.tar.gz` con:

- `database.dump`: dump PostgreSQL en formato custom.
- `data.tar`: uploads y exports persistentes.

El servicio depende del healthcheck del backend, no solo de PostgreSQL, para evitar crear un
backup vacío antes de que Prisma aplique las migraciones. Los backups creados antes de esta
garantía deben considerarse no verificados hasta restaurarlos.

Comprueba que se generan archivos y que no están vacíos:

```bash
find backups -maxdepth 1 -type f -name 'kalenda-*.tar.gz' -ls
tar -tzf backups/kalenda-YYYYMMDDTHHMMSSZ.tar.gz
```

Conserva una copia de `backups/` fuera del servidor y no la subas al repositorio.

## Restauración controlada

Nunca restaures sobre producción como primera prueba. Extrae el archivo en un directorio
temporal y usa una instancia PostgreSQL aislada:

```bash
mkdir -p /tmp/kalenda-restore
tar -xzf backups/kalenda-YYYYMMDDTHHMMSSZ.tar.gz -C /tmp/kalenda-restore

docker run -d --name kalenda-restore-test \
  -e POSTGRES_DB=kalenda \
  -e POSTGRES_USER=kalenda \
  -e POSTGRES_PASSWORD=restore \
  postgres:16-alpine

until docker exec kalenda-restore-test pg_isready -U kalenda -d kalenda; do sleep 1; done
docker cp /tmp/kalenda-restore/database.dump kalenda-restore-test:/tmp/database.dump
docker exec kalenda-restore-test \
  pg_restore --clean --if-exists --no-owner \
  --dbname=kalenda --username=kalenda /tmp/database.dump
tar -xf /tmp/kalenda-restore/data.tar -C /tmp/kalenda-restore
docker exec kalenda-restore-test \
  psql -U kalenda -d kalenda -c \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
docker rm -f kalenda-restore-test
rm -rf /tmp/kalenda-restore
```

La prueba es válida solo si el dump contiene las tablas esperadas y el contenido de `data.tar`
se puede extraer. Después hay que iniciar una instancia apuntando a esa base y comprobar login,
biblioteca, edición y exportación.

## Actualización

1. Crea y verifica un backup.
2. Anota la versión actual y el resultado de `/api/health`.
3. Cambia `APP_TAG` a la release deseada, por ejemplo `v0.1.10`.
4. Descarga las imágenes y recrea servicios:

   ```bash
   docker compose pull
   docker compose up -d
   ```

5. Espera los healthchecks y repite la comprobación básica.
6. Comprueba login, un proyecto existente, una imagen y una exportación.

Las migraciones Prisma se aplican al arrancar el backend. No elimines el volumen de PostgreSQL
durante una actualización.

## Rollback

Si una release falla después del arranque:

1. Conserva los logs y el backup de esa versión.
2. Cambia `APP_TAG` a la última versión conocida como estable.
3. Ejecuta `docker compose pull && docker compose up -d`.
4. Comprueba healthchecks y los flujos principales.

Si la release fallida aplicó una migración incompatible, no basta con cambiar la imagen:
detén backend y Puppeteer, restaura la base de datos y `data/` desde un backup compatible y
vuelve a arrancar. Las migraciones no deben darse por reversibles automáticamente.

## Canales de imagen

- `dev`: validación continua de la rama `dev`.
- `dev-<short-sha>`: snapshot reproducible de un commit concreto.
- `vX.Y.Z`: release estable.
- `latest`: apunta a la última release estable.

Los cambios de `main` se sincronizan hacia `dev` mediante una pull request automática. Las
releases se crean al subir una etiqueta y usan siempre el título `Kalenda vX.Y.Z`.
