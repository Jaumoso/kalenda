# Contribuir a Kalenda

Gracias por contribuir a Kalenda. La rama `main` contiene el código estable y
solo recibe cambios mediante pull requests. La rama `dev` es la rama de
integración para el trabajo diario.

## Flujo de trabajo

1. Crea una rama descriptiva a partir de `dev`, por ejemplo
   `fix/export-timeout` o `feat/calendar-filters`.
2. Mantén los cambios centrados en un objetivo y evita incluir cambios
   generados o formateados sin relación.
3. Abre una pull request contra `dev`. Los cambios destinados a una release se
   promocionan después mediante otra pull request hacia `main`.
4. Espera a que todos los checks de CI terminen correctamente y responde a las
   revisiones antes de fusionar.

No se deben hacer pushes directos a `main`, ni force-pushes sobre ramas
protegidas. Las ramas de trabajo pueden eliminarse después de fusionar la pull
request.

## Requisitos para una pull request

Cada pull request debe:

- Explicar el problema y la solución propuesta.
- Indicar cómo se ha probado el cambio.
- Incluir tests para la lógica nueva o modificada cuando sea posible.
- Actualizar la documentación y el roadmap si cambia el comportamiento o el
  flujo de operación.
- No introducir secretos, credenciales ni datos de usuario.
- Mantener compatibilidad con Docker Compose y las versiones soportadas.

El CI ejecuta instalación reproducible, auditoría de dependencias, lint, build,
tests unitarios y un smoke test del stack Docker Compose. Todos esos checks son
obligatorios para fusionar cambios en `main`.

## Commits

Usa mensajes breves y descriptivos, preferiblemente con un prefijo:

```text
feat: add recurring events
fix: retry interrupted exports
docs: update compose installation
ci: require generated Prisma client
```

Los commits mantenidos por el responsable del proyecto deben conservar la
identidad y firma configuradas para Jaumoso. Los cambios automáticos de
Dependabot pueden conservar su autoría cuando correspondan a actualizaciones
de seguridad.

## Dependencias y seguridad

No actualices dependencias ignorando el lockfile. Ejecuta `pnpm install` y
comprueba `pnpm audit` antes de abrir la pull request. Para vulnerabilidades,
no publiques detalles explotables en una pull request pública: utiliza el
proceso de security advisories de GitHub.

## Releases

Las releases se preparan desde `dev`, se promocionan a `main` y se etiquetan
con SemVer (`vMAJOR.MINOR.PATCH`). Las imágenes Docker se publican únicamente
desde una release publicada y con tag válido.
