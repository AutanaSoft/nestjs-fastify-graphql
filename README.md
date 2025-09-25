# 🚀 NestJS GraphQL API

![Estado del proyecto](https://img.shields.io/badge/estado-en%20desarrollo-blue.svg)
![Licencia MIT](https://img.shields.io/badge/licencia-MIT-green.svg)

API GraphQL modular construida con NestJS, Fastify y TypeORM, preparada para escalar con arquitectura hexagonal y convenciones empresariales de AutanaSoft.

## ✨ Características clave

- Arquitectura hexagonal que separa dominio, aplicación e infraestructura para facilitar la extensión por módulos.
- Servidor GraphQL code-first con Apollo Driver, schema auto-generado y protección por rate limiting.
- Bootstrap con Fastify, CORS configurable, Helmet endurecido y encabezado `X-Correlation-ID` para trazabilidad.
- Logging estructurado mediante `nestjs-pino`, con redacción automática de datos sensibles.
- Configuración centralizada por `@nestjs/config`, validaciones tipadas y utilidades para migraciones con TypeORM.

## 🛠️ Tecnologías principales

- [NestJS 11](https://docs.nestjs.com/) sobre [Fastify](https://fastify.dev/)
- [GraphQL](https://graphql.org/) con Apollo Server y generación de esquema code-first
- [TypeORM](https://typeorm.io/) + PostgreSQL
- [Pino](https://getpino.io/) para logging estructurado
- [pnpm](https://pnpm.io/) como gestor de paquetes

## 📋 Requisitos previos

- Node.js 20 LTS o superior
- pnpm 9 o superior (`corepack enable`)
- PostgreSQL 13+ accesible (local o remoto)

## ⚡ Puesta en marcha rápida

1. Clona el repositorio y accede al directorio del proyecto.
2. Instala las dependencias:

   ```bash
   pnpm install
   ```

3. Crea un archivo `.env` en la raíz del proyecto con los valores necesarios (ver sugerencia debajo).
4. Levanta PostgreSQL y asegúrate de que las credenciales coinciden con las variables de entorno.
5. Ejecuta la aplicación en modo desarrollo:

   ```bash
   pnpm run start:dev
   ```

### 🔧 Variables de entorno sugeridas

```bash
APP_NAME=NestJS GraphQL API
APP_DESCRIPTION=API GraphQL modular con NestJS y PostgreSQL
APP_SERVER_PORT=4000
APP_SERVER_USE_GLOBAL_PREFIX=true
APP_SERVER_GLOBAL_PREFIX=api
APP_SERVER_LOG_LEVEL=debug

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=app_api_db
DB_SYNCHRONIZE=true
DB_LOGGING=false

CORS_ALLOWED_ORIGINS=http://localhost:3000
THROTTLER_TTL=60
THROTTLER_LIMIT=150

LOG_LEVEL=debug
LOG_DIR=./logs
LOG_MAX_SIZE=10
LOG_MAX_FILES=5
```

## 🗂️ Variables de entorno disponibles

| Variable                                                                          | Descripción                                             | Valor por defecto                                         |
| --------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| `APP_NAME`                                                                        | Nombre público de la aplicación                         | `NestJS GraphQL API`                                      |
| `APP_DESCRIPTION`                                                                 | Descripción corta utilizada en la consulta `getAppInfo` | `API built with NestJS and GraphQL`                       |
| `APP_SERVER_PORT`                                                                 | Puerto HTTP utilizado por Fastify                       | `4200`                                                    |
| `APP_SERVER_USE_GLOBAL_PREFIX`                                                    | Activa prefijo global (`true`/`false`)                  | `false`                                                   |
| `APP_SERVER_GLOBAL_PREFIX`                                                        | Prefijo usado cuando está habilitado                    | `api`                                                     |
| `APP_SERVER_LOG_LEVEL`                                                            | Nivel de logs del núcleo (`debug`, `info`, etc.)        | `debug`                                                   |
| `CORS_ALLOWED_ORIGINS`                                                            | Lista separada por comas de orígenes permitidos         | _(vacío)_                                                 |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`                     | Configuración de PostgreSQL                             | `localhost`, `5432`, `postgres`, `postgres`, `app_api_db` |
| `DB_SSL`                                                                          | Habilita TLS en la conexión                             | `false`                                                   |
| `DB_SYNCHRONIZE`                                                                  | Auto-sincroniza entidades (solo desarrollo)             | `!production`                                             |
| `DB_LOGGING`                                                                      | Activa logs SQL                                         | `false`                                                   |
| `DB_RETRY_ATTEMPTS`, `DB_RETRY_DELAY`                                             | Política de reintentos de conexión                      | `3`, `3000`                                               |
| `THROTTLER_TTL`, `THROTTLER_LIMIT`                                                | Ventana y límite de peticiones para rate limiting       | `60`, `100` (producción)                                  |
| `LOG_LEVEL`, `LOG_DIR`, `LOG_MAX_SIZE`, `LOG_MAX_FILES`, `LOG_ROTATION_FREQUENCY` | Ajustes del logger basado en pino                       | `info`, `./logs`, `10`, `5`, `daily`                      |

## 🧰 Scripts disponibles

| Script                                    | Descripción                                                  |
| ----------------------------------------- | ------------------------------------------------------------ |
| `pnpm run start`                          | Levanta la aplicación en modo estándar.                      |
| `pnpm run start:dev`                      | Ejecuta NestJS en watch mode con recarga automática.         |
| `pnpm run start:prod`                     | Arranca la versión compilada con `NODE_ENV=production`.      |
| `pnpm run start:debug`                    | Inicia la app en modo inspección para depuración.            |
| `pnpm run build`                          | Compila el proyecto en `dist/`.                              |
| `pnpm run lint`                           | Ejecuta ESLint con autofix sobre `src/` y `test/`.           |
| `pnpm run format`                         | Formatea archivos TypeScript con Prettier.                   |
| `pnpm run test`                           | Corre todos los tests con cobertura.                         |
| `pnpm run test:unit`                      | Ejecuta únicamente los tests unitarios.                      |
| `pnpm run test:e2e`                       | Ejecuta únicamente los tests end-to-end.                     |
| `pnpm run migration:generate -- <Nombre>` | Genera una migración usando la configuración de TypeORM CLI. |
| `pnpm run migration:run`                  | Aplica las migraciones pendientes en la base de datos.       |
| `pnpm run migration:revert`               | Revierte la última migración aplicada.                       |
| `pnpm run migration:show`                 | Lista el historial de migraciones.                           |
| `pnpm run schema:sync`                    | Sincroniza el esquema (solo entornos controlados).           |
| `pnpm run schema:drop`                    | Elimina el esquema actual de la base de datos.               |

## 🗄️ Migraciones y base de datos

- Las migraciones TypeORM viven en `src/database/migrations`.
- Para generar una nueva migración con CLI:

  ```bash
  pnpm run migration:generate -- src/database/migrations/<timestamp>-Descripcion
  ```

- Recuerda ejecutar `pnpm run migration:run` después de generar o actualizar entidades.
- Para entornos productivos se recomienda fijar `DB_SYNCHRONIZE=false` y ejecutar migraciones como parte del despliegue.

## ▶️ Ejecución

| Entorno    | Pasos                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| Desarrollo | `pnpm run start:dev` (recarga automática, GraphQL Playground local habilitado mediante Apollo Studio). |
| Producción | `pnpm run build` seguido de `pnpm run start:prod` en un entorno con variables de entorno definidas.    |

La aplicación expone un `GET /` de prueba que devuelve un saludo genérico y la API GraphQL bajo `/graphql` (o `/<prefijo>/graphql` si se habilitó el prefijo global).

## 🔮 API GraphQL

- Endpoint principal: `http://localhost:<puerto>/graphql`.
- Introspection y ordenamiento del esquema se desactivan automáticamente en producción.
- El acceso al Playground está deshabilitado por defecto; se recomienda usar [Apollo Studio](https://studio.apollographql.com/).
- Todas las operaciones GraphQL están protegidas por el guard `GqlThrottlerGuard`, que respeta el encabezado `X-Correlation-ID`.

Consulta de ejemplo:

```graphql
query GetAppInfo {
  getAppInfo {
    name
    description
    version
    server {
      host
      port
      environment
      logLevel
    }
  }
}
```

## 🏗️ Arquitectura del proyecto

El proyecto sigue los principios de arquitectura hexagonal, separando dominio, aplicación e infraestructura. Cada módulo de negocio debe replicar la organización base:

```
src/
├─ app.module.ts
├─ app.resolver.ts
├─ app.service.ts
├─ config/
│  ├─ app.config.ts
│  ├─ cors.config.ts
│  ├─ database.config.ts
│  ├─ graphql.config.ts
│  ├─ helmet.config.ts
│  └─ logger.config.ts
├─ database/
│  ├─ config/typeorm.config.ts
│  └─ migrations/
├─ shared/
│  ├─ applications/dto/
│  ├─ domain/
│  └─ infrastructure/
└─ main.ts
```

Para nuevos módulos se recomienda mantener la estructura `application/`, `domain/`, `infrastructure/` y exponer resolvers o controladores como adaptadores.

## 🛡️ Observabilidad y seguridad

- **Logging**: `nestjs-pino` escribe logs estructurados, redactando claves sensibles y enriqueciendo cada entrada con el `correlationId`.
- **Correlation ID**: el servidor genera o respeta el encabezado `X-Correlation-ID` en cada solicitud y lo replica en la respuesta.
- **CORS**: configurable con `CORS_ALLOWED_ORIGINS`, habilitando orígenes adicionales en producción.
- **Helmet**: cabeceras de seguridad basadas en CSP mínima; se endurecen automáticamente en producción.
- **Rate limiting**: el guard `GqlThrottlerGuard` utiliza `THROTTLER_TTL` y `THROTTLER_LIMIT` para controlar la frecuencia de consultas GraphQL.

## ✅ Pruebas y calidad

- `pnpm run test` genera reporte de cobertura en `coverage/`.
- `pnpm run test:unit` y `pnpm run test:e2e` separan los ciclos de validación unitarios y end-to-end.
- `pnpm run lint` mantiene el estilo de código alineado con ESLint y `pnpm run format` aplica Prettier.

## 📫 Contacto

- Autor: **AutanaSoft**
- Correo: [admin@autanasoft.com](mailto:admin@autanasoft.com)
- Repositorio: [https://github.com/AutanaSoft/nestjs-graphql-api](https://github.com/AutanaSoft/nestjs-graphql-api)

## 📄 Licencia

Este proyecto se distribuye bajo la licencia [MIT](./LICENSE).
