# Backend API — SADMG / DSS (TypeScript + Express + Drizzle ORM)

API REST con **CRUD completo** para las 14 tablas del modelo relacional SADMG / DSS.
Stack: **Node.js 20+**, **TypeScript**, **Express 4**, **Drizzle ORM**, **Zod** y **mysql2**
(compatible con MySQL 8 y TiDB Cloud). Lista para desplegar en Render.

---

## 1. Correr en local

```bash
cd backend
npm install
cp .env.example .env     # edita con tus credenciales (o usa el archivo env existente)
npm run dev              # tsx watch, recarga automática
```

El `.env` necesita además `JWT_SECRET` (mínimo 32 caracteres; ver `.env.example` y la sección 9):
sin él el servidor no arranca.

Comprobar que responde:

```bash
curl http://localhost:3300/api/health
# {"status":"ok","database":"dss_sadmg","tables_count":14}
```

Scripts disponibles:

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor en modo watch (`tsx`) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta el build de producción |
| `npm run typecheck` | Verificación de tipos sin emitir |
| `npm run seed -- --yes` | Borra y recarga los datos de prueba de la BD de `DB_NAME` (ver sección 6) |
| `npm run db:hash-passwords` | Convierte a hash las contraseñas en texto plano (ver sección 7) |
| `npm run db:generate` / `db:migrate` | Genera y aplica migraciones con Drizzle Kit (ver sección 8) |

---

## 2. Estructura

```text
src/
├── index.ts                     # App Express, montaje de routers, arranque
├── config/env.ts                # Validación de variables de entorno (Zod)
├── db/
│   ├── client.ts                # Pool mysql2 + instancia Drizzle
│   ├── schema.ts                # Las 14 tablas (PK compuestas y FKs)
│   └── seed.ts                  # Script de datos de prueba (npm run seed)
├── crud/createCrudRouter.ts     # Factory CRUD reutilizable
├── middleware/
│   ├── validate.ts              # Validación de body con Zod
│   ├── requireParent.ts         # 404 si el recurso padre de una ruta anidada no existe
│   └── errorHandler.ts          # Traducción de errores MySQL / body-parser → HTTP
├── lib/                         # ApiError, asyncHandler, helpers
├── routes/
│   ├── health.ts                # GET /api/health
│   ├── scoring.ts               # Ranking multicriterio
│   └── resources.ts             # Configuración CRUD de cada entidad
└── schemas/entities.ts          # Schemas Zod de alta/edición
```

Cada entidad se declara de forma declarativa: tabla, esquema de validación, columnas
que forman la llave y columnas heredadas del prefijo padre. El factory genera
automáticamente `GET`, `GET /:id`, `POST`, `PATCH /:id` y `DELETE /:id`.

---

## 3. Endpoints

### Autenticación

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/auth/login` | Recibe `{ usuario, passw }` y devuelve `{ token, usuario }` |
| GET | `/api/auth/me` | Usuario de la sesión actual (requiere token) |

Todas las rutas, salvo `/api/health` y `/api/auth/login`, exigen el encabezado
`Authorization: Bearer <token>`. Quién puede hacer qué: ver la sección 9.

### Catálogos raíz

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Estado del servicio y nº de tablas |
| GET/POST | `/api/usuarios` | Listar / crear usuarios |
| GET/PATCH/DELETE | `/api/usuarios/:id` | Consultar / editar / borrar usuario |
| GET/POST | `/api/tools` | Listar / crear herramientas |
| GET/PATCH/DELETE | `/api/tools/:id` | Consultar / editar / borrar herramienta |

### Proyectos y estructuración

| Método | Ruta |
| --- | --- |
| GET/POST | `/api/proyectos` |
| GET/PATCH/DELETE | `/api/proyectos/:id` |
| GET | `/api/proyectos/:idproy/scoring` |
| GET/POST | `/api/proyectos/:idproy/participantes` |
| GET/PATCH/DELETE | `/api/proyectos/:idproy/participantes/:idusu` |
| GET/POST | `/api/proyectos/:idproy/alternativas` |
| GET/PATCH/DELETE | `/api/proyectos/:idproy/alternativas/:id` |
| GET/POST | `/api/proyectos/:idproy/criterios` |
| GET/PATCH/DELETE | `/api/proyectos/:idproy/criterios/:id` |
| GET/POST | `/api/proyectos/:idproy/matriz` |
| GET/PATCH/DELETE | `/api/proyectos/:idproy/matriz/:idalt/:idcrit` |

### Motor de reunión (Kaner)

| Método | Ruta |
| --- | --- |
| GET/POST | `/api/proyectos/:idproy/agenda` |
| GET/PATCH/DELETE | `/api/proyectos/:idproy/agenda/:id` |
| GET/POST | `/api/proyectos/:idproy/agenda/:idtopico/chat` |
| GET/PATCH/DELETE | `/api/proyectos/:idproy/agenda/:idtopico/chat/:idusuario/:id` |
| GET/POST | `/api/proyectos/:idproy/agenda/:idtopico/brainstorming` |
| GET/PATCH/DELETE | `/api/proyectos/:idproy/agenda/:idtopico/brainstorming/:idusuario/:id` |

### Herramientas 3–5

| Método | Ruta |
| --- | --- |
| GET/POST | `/api/proyectos/:idproy/categorias` (el POST exige `idtopico`; el GET admite `?idtopico=`) |
| GET/PATCH/DELETE | `/api/proyectos/:idproy/categorias/:id` |
| GET/POST | `/api/proyectos/:idproy/categorias/:idcat/detalle` |
| GET/DELETE | `/api/proyectos/:idproy/categorias/:idcat/detalle/:idtopico/:idusuario/:ididea` |
| GET/POST | `/api/proyectos/:idproy/categorias/:idcat/comentarios` |
| GET/PATCH/DELETE | `/api/proyectos/:idproy/categorias/:idcat/comentarios/:idusuario` |
| GET/POST | `/api/proyectos/:idproy/categorias/:idcat/votos` |
| GET/PATCH/DELETE | `/api/proyectos/:idproy/categorias/:idcat/votos/:idusuario` |
| GET | `/api/proyectos/:idproy/categorizador/:idtopico` |
| PUT | `/api/proyectos/:idproy/ideas/:idtopico/:idusuario/:ididea/categoria` |

* `GET .../categorizador/:idtopico` devuelve en **una sola petición** lo que necesita el tablero:
  `{ topico, origen, puedeEditar, ideas, categorias, detalles }`.
* `PUT .../categoria` con `{ "idcat": 3 }` mueve la idea a esa categoría y con `{ "idcat": null }` la
  deja sin categorizar, en una sola operación atómica. Una idea solo puede estar en una categoría.

> `categorizerdet` es una tabla puente sin columnas propias: no tiene `PATCH`, la
> modificación se hace borrando y volviendo a crear el registro.
>
> Cada categoría pertenece a un tópico de categorización de la agenda (`idtopico`),
> por eso el categorizador de alternativas y el de criterios tienen categorías
> separadas. Su `id` es único dentro del proyecto.

---

## 4. Ejemplos

```bash
# Crear un proyecto
curl -X POST http://localhost:3300/api/proyectos \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"laptops","objetivo":"elegir laptop","fechainicio":"2026-01-01","fechafin":"2026-01-30","estatus":1}'

# Alta de alternativa dentro del proyecto 1
curl -X POST http://localhost:3300/api/proyectos/1/alternativas \
  -H 'Content-Type: application/json' \
  -d '{"id":4,"nombre":"dell","descripcion":"dell 14\""}'

# Editar parcialmente
curl -X PATCH http://localhost:3300/api/proyectos/1/alternativas/4 \
  -H 'Content-Type: application/json' -d '{"nombre":"dell xps"}'

# Valorar alternativa 4 en el criterio 2
curl -X POST http://localhost:3300/api/proyectos/1/matriz \
  -H 'Content-Type: application/json' -d '{"idalt":4,"idcrit":2,"valor":9}'

# Ranking multicriterio del proyecto
curl http://localhost:3300/api/proyectos/1/scoring
```

### Formato de respuestas

- `GET` / `PATCH` → objeto o arreglo de objetos con los datos de la fila.
- `POST` → `201` con los valores insertados, incluido el `id` asignado. `usuarios`, `proyectos` y
  `tools` usan autoincremental (en TiDB no es consecutivo). En las tablas de llave compuesta
  (`alternativas`, `criterios`, `agenda`, `categorias`, `chat`, `brainstorming`) el `id` es
  **opcional**: si se omite, el servidor asigna el siguiente libre (dentro del proyecto, del tópico o
  del usuario según la tabla) y reintenta si dos peticiones coinciden. Si se envía, se respeta.
- `DELETE` → `204` sin cuerpo.
- Errores → `{ "error": "mensaje" }`, con `details` cuando falla la validación Zod.

| Código | Cuándo |
| --- | --- |
| 400 | JSON mal formado, body inválido, valor fuera de rango, parámetro no numérico o referencia inexistente (p. ej. un usuario que no participa en el proyecto) |
| 401 | Falta el token, es inválido o expiró; o usuario o contraseña incorrectos en el login |
| 403 | Autenticado pero sin permiso: no participas en el proyecto, tu rol no puede hacer esa acción o la agenda no lo permite |
| 404 | Recurso no encontrado, incluido el proyecto, tópico o categoría padre de una ruta anidada |
| 409 | Clave duplicada (p. ej. `usuario` o `correo` repetidos), conflicto de concurrencia o borrado bloqueado por FK (`RESTRICT`) |
| 413 | Cuerpo de la petición demasiado grande |
| 500 | Error interno |
| 503 | Base de datos no disponible |

Las llaves foráneas están en `ON DELETE CASCADE`, por lo que borrar un proyecto
elimina en cascada sus alternativas, criterios, agenda, etc. La excepción es
`agenda.idtool`, que es `RESTRICT`: una herramienta usada en una agenda no se puede borrar.

`chat`, `brainstorming`, `comenter` y `voting` solo aceptan usuarios que participan en
el proyecto (llave foránea compuesta a `proyectos_usuarios`). `GET .../chat` devuelve
los mensajes en orden cronológico.

---

## 5. Desplegar en Render

1. **New +** → **Web Service** y conecta el repositorio.
2. Configura:
   * **Root Directory:** `backend`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm start`
3. En **Environment Variables** agrega:
   `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`, `JWT_SECRET`
   (y opcionalmente `JWT_EXPIRES_IN`).
   (`PORT` lo inyecta Render automáticamente.)
4. Despliega y verifica `https://tu-servicio.onrender.com/api/health`.

La app lee tanto `.env` como un archivo `env` en la raíz de `backend/`, y valida
las variables al arrancar: si falta alguna, el proceso falla con un mensaje claro
en lugar de fallar a mitad de una petición.

---

## 6. Datos de prueba (seed)

El esquema se crea con [`sql/01_schema.sql`](../sql/01_schema.sql). Si la BD ya existía con
el esquema anterior, aplica antes [`sql/04_migracion_esquema.sql`](../sql/04_migracion_esquema.sql).
Los datos de prueba se cargan con el script del backend:

```bash
npm run seed -- --yes
```

> **Borra todos los datos** de la base indicada en `DB_NAME` (`.env`) y los reemplaza.
> Sin `--yes` solo muestra el destino y sale. Con `NODE_ENV=production` se rehúsa a
> correr salvo que se agregue `--force`. Apunta `DB_NAME` a una BD de pruebas
> (p. ej. `dss_sadmg_dev`) si la BD principal es compartida con otros equipos.

Carga 6 usuarios (contraseña `1234`) y 2 proyectos:

| Proyecto | Estatus | Contenido |
| --- | --- | --- |
| `laptops` | Cerrado | Flujo completo: chat, ideas, categorías, comentarios y votos de alternativas y de criterios, pesos y matriz. Facilitador: `juan`; decisores: `maria`, `carlos`, `ana`. |
| `servidores del laboratorio` | Activo | A medias: ideas de alternativas, 2 categorías con asignaciones parciales y 2 ideas sin categorizar. Facilitadora: `sofia`; `juan` participa como decisor (vista de solo lectura). |

El ranking esperado de `laptops` (`GET /api/proyectos/1/scoring`) es 1° acer (6.9), 2° hp (5.8), 3° lenovo (5.7).

---

## 7. Contraseñas

Las contraseñas se guardan con **scrypt** (módulo `crypto` de Node, sin dependencias extra),
con sal aleatoria por usuario, en `usuarios.passw` (`VARCHAR(255)`). Formato:
`scrypt$N$r$p$sal$hash`. Se hashean al crear o editar un usuario (`POST` / `PATCH
/api/usuarios`) y **ninguna respuesta de la API devuelve `passw`**. `POST /api/auth/login`
verifica la contraseña contra el hash, y tarda lo mismo si el usuario no existe.

Si la BD ya tenía usuarios con la contraseña en texto plano, conviértelos una sola vez
(es idempotente):

```bash
npm run db:hash-passwords
```

La sesión y los permisos por rol están en la sección 9.

---

## 8. Migraciones (Drizzle Kit)

`src/db/schema.ts` es la fuente de verdad del esquema. **Drizzle Kit** (el equivalente de
Prisma Migrate para este stack) compara el esquema con la versión anterior y genera
migraciones SQL versionadas en `drizzle/`, que se commitean junto con el código.

| Script | Equivalente en Prisma | Qué hace |
| --- | --- | --- |
| `npm run db:generate` | `migrate dev --create-only` | Crea una migración SQL a partir de los cambios en `schema.ts` |
| `npm run db:migrate` | `migrate deploy` | Aplica las migraciones pendientes a la BD de `.env` |
| `npm run db:push` | `db push` | Sincroniza el esquema directo, sin migración. Solo en BD de pruebas |
| `npm run db:studio` | `studio` | Explorador web de la BD |

Flujo para cambiar el esquema:

1. Edita `src/db/schema.ts`.
2. `npm run db:generate` y revisa el `.sql` creado en `drizzle/`.
3. `npm run db:migrate` en tu BD; commitea `drizzle/` con el cambio.
4. Los demás ejecutan `npm run db:migrate` al actualizar el repositorio.

**Adopción en una BD que ya existe** (como `dss_sadmg`): la primera migración
(`0000_*.sql`) crea todas las tablas, así que `db:migrate` fallaría ahí porque ya existen.
Procedimiento:

1. Lleva la BD al esquema actual (en `dss_sadmg`, con `sql/04_migracion_esquema.sql`).
2. `npm run db:generate` para crear la migración inicial desde `schema.ts`.
3. `npm run db:marcar-aplicadas -- --yes`: la marca como ya aplicada, sin ejecutarla (solo funciona si
   `__drizzle_migrations` está vacía). Reproduce el registro del migrador de Drizzle, así que
   si actualizas `drizzle-orm` de versión mayor, revisa que siga siendo compatible.
4. Desde ahí, cada cambio de esquema es `db:generate` + `db:migrate`.

En una BD vacía no hace falta nada de esto: `npm run db:migrate` crea todo.

> **Los `CHECK` en TiDB Serverless:** la variable `tidb_enable_check_constraint` viene en `OFF`
> y no se pudo activar, así que los `CHECK` del esquema (`estatus`, `rol`, `voto`) están
> declarados pero la BD no los hace cumplir. La API valida esos mismos valores con Zod, por
> lo que solo se podrían violar escribiendo directo en la BD.

---

## 9. Sesión y permisos

**Sesión.** `POST /api/auth/login` devuelve un **JWT** (HS256) firmado con `JWT_SECRET`, con la
vigencia de `JWT_EXPIRES_IN` (8 h por defecto). El cliente lo envía en `Authorization: Bearer <token>`.
Para generar un secreto:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

El token no se revoca: un usuario borrado conserva un token válido hasta que expire, aunque las
rutas de proyecto lo rechazan porque comprueban su participación en la BD en cada petición.

**Rol por proyecto.** Dentro de `/api/proyectos/:idproy/...` el usuario debe participar en el
proyecto (403 si no) y su rol (`FAC` / `DEC`) decide qué puede escribir. Leer está permitido a
cualquier participante. `GET /api/proyectos` solo devuelve los proyectos del usuario, y quien crea
un proyecto queda como su facilitador.

| Recurso | Quién escribe |
| --- | --- |
| Proyecto (`PATCH` / `DELETE`), participantes, alternativas, agenda | `FAC` |
| Participantes | `FAC`; no se puede quitar ni degradar al último facilitador |
| Criterios | `FAC` crea y borra; `FAC` y `DEC` editan (el peso lo ajustan los decisores) |
| Matriz valuada | `DEC` |
| Chat y lluvia de ideas | Quien indique el `rol` del tópico en la agenda, y **solo con su propio usuario** |
| Categorías y asignación de ideas | `FAC`, si el `rol` del tópico en la agenda incluye `FAC` |
| Comentarios y votos | `DEC`, solo con su propio usuario |
| `usuarios/:id` (`PATCH` / `DELETE`) | Solo el propio usuario. Cualquier usuario autenticado puede crear usuarios |
| `tools` | Solo lectura por API |

En `chat`, `brainstorming`, `comentarios` y `votos` el `idusuario` del `POST` es opcional: si se
omite, se usa el del token; si se envía otro distinto, responde 403.

**Reglas del dominio.** El tópico de la ruta debe usar la herramienta correspondiente (chat → 1,
lluvia de ideas → 2, categorizador → 3). Una idea solo se puede asignar a categorías del
tópico categorizador que la organiza, y a una sola categoría.
