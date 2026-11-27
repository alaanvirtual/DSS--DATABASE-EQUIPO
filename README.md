# Base de Datos Relacional para SADMG / DSS (Sistema de Apoyo a la Decisión Multicriterio en Grupo)

Persistencia relacional en **MySQL 8.0+** diseñada para respaldar la arquitectura y el modelo de discusión de un **Sistema de Apoyo a la Decisión Multicriterio en Grupo (SADMG / MCGDSS)**, basado en la investigación de los **Dres. Pavel Anselmo Álvarez Carrillo y Juan Carlos Leyva López** (*Universidad de Occidente / UdeO - UAS*, Culiacán, Sinaloa).

---

## Contexto del Proyecto y Dominio del Problema

Un **SADMG (o DSS - Decision Support System)** es una plataforma de trabajo colaborativo distribuido y asíncrono diseñada para resolver problemas de decisión complejos (como la selección de una franquicia comercial, compra de equipo o localización de proyectos), mediante la integración de:
1. **Roles colaborativos diferenciados**:
   - `FAC` (Facilitador): Coordina la reunión, define la agenda y consolida las etapas.
   - `DEC` (Decisor): Aporta ideas, comentarios, votaciones y valoraciones cuantitativas.
2. **Modelo de Discusión Estructurado (Basado en Sam Kaner, 1996)**:
   - Fases de pensamiento divergente (generar ideas), zona de gemido (organizar y comentar) y pensamiento convergente (votar y ponderar).
3. **Evaluación Multicriterio (MCDA / Scoring / ELECTRE)**:
   - Ponderación de criterios de decisión y evaluación cuantitativa de cada alternativa en una matriz valuada.

> [!NOTE]  
> Este repositorio implementa la persistencia de datos real de los videos de clase y del artículo:  
> *"Sistema de apoyo a la decisión multicriterio en grupo: influencia de la coordinación paralela y secuencial en la actuación de un grupo colaborativo"* (Álvarez-Carrillo & Leyva-López).

---

## Estructura del Repositorio

```text
├── backend/                  # API REST en TypeScript + Express + Drizzle ORM
│   ├── src/
│   │   ├── index.ts          # Servidor Express y montaje de routers
│   │   ├── db/
│   │   │   ├── schema.ts     # Las 14 tablas como esquema Drizzle
│   │   │   ├── client.ts     # Pool mysql2 + conexión Drizzle
│   │   │   └── seed.ts       # Datos de prueba completos (npm run seed -- --yes)
│   │   ├── crud/             # Factory CRUD reutilizable
│   │   ├── routes/           # Routers por entidad + scoring
│   │   └── schemas/          # Validación de entrada con Zod
│   ├── .env.example          # Variables de entorno requeridas
│   ├── package.json          # Dependencias y scripts (dev/build/start)
│   └── README.md             # Documentación de la API y despliegue en Render
├── Frontend/                 # Cliente Angular 20 (zoneless) con pnpm y Phosphor Icons
│   ├── angular.json          # Configuración del proyecto (incluye los estilos de Phosphor)
│   ├── package.json          # Dependencias y scripts (start/build/test)
│   ├── public/               # Recursos estáticos (favicon)
│   └── src/
│       ├── index.html
│       ├── main.ts           # Arranque de la aplicación
│       ├── styles.css        # Importa los tokens y la base de app/styles
│       └── app/
│           ├── app.ts        # Componente raíz (encabezado, router-outlet y notificaciones)
│           ├── app.html
│           ├── app.css
│           ├── app.config.ts # Proveedores: router, HttpClient e interceptores
│           ├── app.routes.ts # Rutas con carga diferida por vista
│           ├── auth/
│           │   ├── environment/   # environment.ts (apiUrl del backend)
│           │   └── interceptors/  # error-api.interceptor.ts
│           ├── components/
│           │   ├── secundarios/   # Atomos: icono, boton, insignia, estado-vacio, cargando, campo-select, campo-texto
│           │   ├── compuestos/    # tarjeta-idea, columna-categoria
│           │   ├── modales/       # modal, modal-confirmar, modal-nombre
│           │   └── principales/   # encabezado, notificaciones, barra-contexto, tablero-categorizador
│           ├── models/            # Interfaces de las entidades (planas, un archivo por entidad)
│           ├── services/          # Acceso a la API y estado de cada herramienta (planos)
│           ├── styles/            # tokens.css (paleta) y base.css
│           ├── utils/             # Funciones puras de apoyo (con sus pruebas)
│           └── views/
│               └── categorizador/ # Vista de la ruta /categorizador
├── sql/
│   ├── 01_schema.sql         # DDL: Creación de BD y las 14 tablas relacionales con PK/FK
│   ├── 02_seed.sql           # Nota: los datos de prueba se cargan con el script del backend (npm run seed)
│   ├── 03_consultas_dss.sql  # DQL: Consultas de verificación, auditoría y cálculo de Scoring final
│   └── 04_migracion_esquema.sql  # Migración de una BD con el esquema anterior al actual
└── README.md                 # Documentación técnica de arquitectura y guía de despliegue
```

> La API expone CRUD completo (`GET`, `POST`, `PATCH`, `DELETE`) para las 14 tablas.
> Consulta [`backend/README.md`](backend/README.md) para el listado de endpoints.

---

## Frontend (Angular)

Cliente web del sistema, construido con **Angular 20 (zoneless)**, **pnpm** y **Phosphor Icons**.
Por ahora implementa la herramienta **Categorizador** (herramienta 3 del SADMG); los demás
módulos los desarrollan otros equipos reutilizando los mismos componentes.

### Categorizador

El **facilitador (`FAC`)** organiza las ideas de la lluvia de ideas del tópico anterior en categorías:

* Lista de *ideas sin categorizar* y columnas de categorías, con arrastrar y soltar (o selector "Mover a…").
* Crear, renombrar y eliminar categorías (eliminar borra en cascada asignaciones, comentarios y votos).
* Los **decisores (`DEC`)** lo ven en solo lectura.
* Ruta: `/categorizador`.

### Ejecución local

Requiere **Node.js 24.15+** (o 22.22+) y **pnpm**. Con el backend ya corriendo:

```bash
cd Frontend
pnpm install
pnpm start        # http://localhost:4200
```

La URL de la API se configura en `Frontend/src/app/auth/environment/environment.ts`
(`apiUrl`); ajústala al puerto en que corre tu backend.

| Script | Descripción |
| --- | --- |
| `pnpm start` | Servidor de desarrollo con recarga automática |
| `pnpm build` | Compilación de producción en `Frontend/dist/` |
| `pnpm test` | Pruebas unitarias (Karma + Jasmine) |

### Convenciones

* Colores y espaciados **solo** mediante las variables de `styles/tokens.css`.
* `models/` y `services/` son planos, sin subcarpetas.
* Se prioriza la reutilización de componentes; antes de crear uno nuevo, revisa `components/`.

---

## Modelo de Datos (14 Tablas Relacionales)

### 1. Núcleo del Sistema y Control de Acceso
* **`usuarios`**: Datos de los participantes (`id`, `nombre`, `telefono`, `correo`, `usuario`, `passw`).
* **`proyectos`**: Definición de los problemas de decisión (`id`, `nombre`, `objetivo`, `fechainicio`, `fechafin`, `estatus`).
* **`proyectos_usuarios`**: Asignación de participantes a cada proyecto con clave primaria compuesta `(idproy, idusu)` y rol (`FAC`, `DEC`).

### 2. Estructuración Multicriterio
* **`alternativas`**: Soluciones u opciones a evaluar (`idproy`, `id`, `nombre`, `descripcion`). PK: `(idproy, id)`.
* **`criterios`**: Variables de evaluación iniciales (`idproy`, `id`, `nombre`, `descripcion`, `peso`). PK: `(idproy, id)`.

### 3. Motor de Reunión y Agenda (Modelo Kaner)
* **`tools`**: Catálogo de las herramientas electrónicas de soporte a la decisión (`id`, `nombre`, `descripcion`).
* **`agenda`**: Cronograma ordenado de actividades de la sesión (`idproy`, `id`, `topico`, `rol`, `idtool`). PK: `(idproy, id)`.

### 4. Las 7 Herramientas Electrónicas del SADMG
1. **`chat`** *(Herramienta 1: Chat)*:  
   Canal de comunicación entre facilitador y decisores (`idproy`, `idtopico`, `idusuario`, `id`, `fecha`, `hora`, `mensaje`).
2. **`brainstorming`** *(Herramienta 2: Lluvia de Ideas)*:  
   Propuestas abiertas de alternativas y criterios generadas por los decisores (`idproy`, `idtopico`, `idusuario`, `id`, `nombre`, `objetivo`).
3. **`categorizer`** *(Herramienta 3: Categorizador)*:  
   Categorías consolidadas por el facilitador (`idproy`, `id`, `idtopico`, `nombre`). `idtopico` es el tópico de categorización de la agenda al que pertenece la categoría.
4. **`categorizerdet`** *(Herramienta 3: Detalle de Categorización)*:  
   Mapeo de ideas individuales asignadas a cada categoría consolidada (`idproy`, `idcat`, `idtopico`, `idusuario`, `ididea`).
5. **`comenter`** *(Herramienta 4: Comentador)*:  
   Retroalimentación y observaciones de los decisores sobre las categorías (`idproy`, `idcat`, `idusuario`, `comentario`).
6. **`voting`** *(Herramienta 5: Votación)*:  
   Votación porcentual de consenso de los decisores (`idproy`, `idcat`, `idusuario`, `voto`).
7. **`criterios` (campo `peso`)** *(Herramienta 6: Ponderación)*:  
   Ponderaciones cuantitativas asignadas directamente en `criterios.peso` para el modelo matemático.
8. **`matriz_valuada`** *(Herramienta 7: Matriz Valuada)*:  
   Calificaciones de cada alternativa evaluada frente a cada criterio (`idproy`, `idalt`, `idcrit`, `valor`).

---

## Reglas de Integridad y Diseño Relacional

* **Claves Primarias Compuestas**: Todas las tablas dependientes de un proyecto (`alternativas`, `criterios`, `agenda`, `matriz_valuada`, etc.) utilizan llaves compuestas `(idproy, ...)` para aislar completamente los datos de cada sesión y proyecto.
* **Integridad Referencial en Cascada**: Las restricciones `FOREIGN KEY` implementan `ON DELETE CASCADE ON UPDATE CASCADE`, asegurando que la eliminación o modificación de un proyecto o usuario limpie y sincronice sus registros hijos sin inconsistencias.
* **Tipos Numéricos Precisos**: Se utiliza `DECIMAL(10, 4)` en matrices y pesos para evitar errores de redondeo de punto flotante en los cálculos de scoring.

---

## Guía de Ejecución en MySQL / MariaDB

El script `01_schema.sql` no borra nada: si las tablas ya existen, falla. Si tu BD tiene
el esquema anterior, aplica [`sql/04_migracion_esquema.sql`](sql/04_migracion_esquema.sql).

### Paso 1: crear el esquema (desde PowerShell / Bash)

```powershell
mysql -u root -p --default-character-set=utf8mb4 -e "source sql/01_schema.sql"
```

(O ábrelo en la consola de tu cliente SQL, por ejemplo DataGrip, y ejecútalo.)

### Paso 2: cargar los datos de prueba con el script del backend

```bash
cd backend
npm run seed -- --yes
```

Borra y recarga todos los datos de la BD de `DB_NAME`. Ver [`backend/README.md`](backend/README.md#6-datos-de-prueba-seed).

### Paso 3: verificar con las consultas de ejemplo

```sql
SOURCE sql/03_consultas_dss.sql;
```

---

## Consulta Destacada: Cálculo del Ranking Multicriterio (Scoring)

El archivo [`sql/03_consultas_dss.sql`](sql/03_consultas_dss.sql) incluye el cálculo automático del modelo aditivo ponderado:

$$\text{Puntaje}(A_i) = \sum_{j=1}^{m} \left( \text{Valor}_{ij} \times \text{Peso}_j \right)$$

```sql
SELECT 
    alt.nombre AS alternativa,
    ROUND(SUM(mv.valor * COALESCE(c.peso, 0)), 4) AS puntaje_scoring_total,
    RANK() OVER (ORDER BY SUM(mv.valor * COALESCE(c.peso, 0)) DESC) AS ranking_recomendacion
FROM matriz_valuada mv
INNER JOIN alternativas alt ON mv.idproy = alt.idproy AND mv.idalt = alt.id
INNER JOIN criterios c ON mv.idproy = c.idproy AND mv.idcrit = c.id
WHERE mv.idproy = 1
GROUP BY alt.id, alt.nombre
ORDER BY puntaje_scoring_total DESC;
```
*(Con los datos del seed produce el ranking: 1° Acer (6.9), 2° HP (5.8), 3° Lenovo (5.7)).*
