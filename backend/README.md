# Backend API — SADMG / DSS (TypeScript + Express + Drizzle ORM)

API REST con **CRUD completo** para las 15 tablas del modelo relacional SADMG / DSS.
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

Comprobar que responde:

```bash
curl http://localhost:3000/api/health
# {"status":"ok","database":"dss_sadmg","tables_count":15}
```

Scripts disponibles:

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor en modo watch (`tsx`) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta el build de producción |
| `npm run typecheck` | Verificación de tipos sin emitir |

---

## 2. Estructura

```text
src/
├── index.ts                     # App Express, montaje de routers, arranque
├── config/env.ts                # Validación de variables de entorno (Zod)
├── db/
│   ├── client.ts                # Pool mysql2 + instancia Drizzle
│   └── schema.ts                # Las 15 tablas (PK compuestas y FKs)
├── crud/createCrudRouter.ts     # Factory CRUD reutilizable
├── middleware/
│   ├── validate.ts              # Validación de body con Zod
│   └── errorHandler.ts          # Traducción de errores MySQL → HTTP
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
| GET/POST | `/api/proyectos/:idproy/criterios-pesos` |
| GET/PATCH/DELETE | `/api/proyectos/:idproy/criterios-pesos/:id` |
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
| GET/POST | `/api/proyectos/:idproy/categorias` |
| GET/PATCH/DELETE | `/api/proyectos/:idproy/categorias/:id` |
| GET/POST | `/api/proyectos/:idproy/categorias/:idcat/detalle` |
| GET/DELETE | `/api/proyectos/:idproy/categorias/:idcat/detalle/:idtopico/:idusuario/:ididea` |
| GET/POST | `/api/proyectos/:idproy/categorias/:idcat/comentarios` |
| GET/PATCH/DELETE | `/api/proyectos/:idproy/categorias/:idcat/comentarios/:idusuario` |
| GET/POST | `/api/proyectos/:idproy/categorias/:idcat/votos` |
| GET/PATCH/DELETE | `/api/proyectos/:idproy/categorias/:idcat/votos/:idusuario` |

> `categorizerdet` es una tabla puente sin columnas propias: no tiene `PATCH`, la
> modificación se hace borrando y volviendo a crear el registro.

---

## 4. Ejemplos

```bash
# Crear un proyecto
curl -X POST http://localhost:3000/api/proyectos \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"laptops","objetivo":"elegir laptop","fechainicio":"2026-01-01","fechafin":"2026-01-30","estatus":1}'

# Alta de alternativa dentro del proyecto 1
curl -X POST http://localhost:3000/api/proyectos/1/alternativas \
  -H 'Content-Type: application/json' \
  -d '{"id":4,"nombre":"dell","descripcion":"dell 14\""}'

# Editar parcialmente
curl -X PATCH http://localhost:3000/api/proyectos/1/alternativas/4 \
  -H 'Content-Type: application/json' -d '{"nombre":"dell xps"}'

# Valorar alternativa 4 en el criterio 2
curl -X POST http://localhost:3000/api/proyectos/1/matriz \
  -H 'Content-Type: application/json' -d '{"idalt":4,"idcrit":2,"valor":9}'

# Ranking multicriterio del proyecto
curl http://localhost:3000/api/proyectos/1/scoring
```

### Formato de respuestas

- `GET` / `PATCH` → objeto o arreglo de objetos con los datos de la fila.
- `POST` → `201` con los valores insertados (incluye el `id` autogenerado).
- `DELETE` → `204` sin cuerpo.
- Errores → `{ "error": "mensaje" }`, con `details` cuando falla la validación Zod.

| Código | Cuándo |
| --- | --- |
| 400 | Body inválido, parámetro no numérico o referencia inexistente |
| 404 | Recurso no encontrado |
| 409 | Clave duplicada o borrado bloqueado por FK (`RESTRICT`) |
| 500 | Error interno |

Las llaves foráneas están en `ON DELETE CASCADE`, por lo que borrar un proyecto
elimina en cascada sus alternativas, criterios, agenda, etc.

---

## 5. Desplegar en Render

1. **New +** → **Web Service** y conecta el repositorio.
2. Configura:
   * **Root Directory:** `backend`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm start`
3. En **Environment Variables** agrega:
   `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`.
   (`PORT` lo inyecta Render automáticamente.)
4. Despliega y verifica `https://tu-servicio.onrender.com/api/health`.

La app lee tanto `.env` como un archivo `env` en la raíz de `backend/`, y valida
las variables al arrancar: si falta alguna, el proceso falla con un mensaje claro
en lugar de fallar a mitad de una petición.
