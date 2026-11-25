# Base de Datos Relacional para SADMG / DSS (Sistema de Apoyo a la Decisión Multicriterio en Grupo)

Persistencia relacional en **MySQL 8.0+** diseñada para respaldar la arquitectura y el modelo de discusión de un **Sistema de Apoyo a la Decisión Multicriterio en Grupo (SADMG / MCGDSS)**, basado en la investigación de los **Dres. Pavel Anselmo Álvarez Carrillo y Juan Carlos Leyva López** (*Universidad de Occidente / UdeO - UAS*, Culiacán, Sinaloa).

---

## 📌 Contexto del Proyecto y Dominio del Problema

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

## 📂 Estructura del Repositorio

```text
├── backend/                  # API REST en TypeScript + Express + Drizzle ORM
│   ├── src/
│   │   ├── index.ts          # Servidor Express y montaje de routers
│   │   ├── db/
│   │   │   ├── schema.ts     # Las 15 tablas como esquema Drizzle
│   │   │   └── client.ts     # Pool mysql2 + conexión Drizzle
│   │   ├── crud/             # Factory CRUD reutilizable
│   │   ├── routes/           # Routers por entidad + scoring
│   │   └── schemas/          # Validación de entrada con Zod
│   ├── .env.example          # Variables de entorno requeridas
│   ├── package.json          # Dependencias y scripts (dev/build/start)
│   └── README.md             # Documentación de la API y despliegue en Render
├── sql/
│   ├── 01_schema.sql         # DDL: Creación de BD y las 15 tablas relacionales con PK/FK
│   ├── 02_seed.sql           # DML: Datos iniciales de prueba (Proyecto "Laptops", usuarios, herramientas)
│   └── 03_consultas_dss.sql  # DQL: Consultas de verificación, auditoría y cálculo de Scoring final
└── README.md                 # Documentación técnica de arquitectura y guía de despliegue
```

> La API expone CRUD completo (`GET`, `POST`, `PATCH`, `DELETE`) para las 15 tablas.
> Consulta [`backend/README.md`](backend/README.md) para el listado de endpoints.

---

## 🗄️ Modelo de Datos (15 Tablas Relacionales)

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
   Categorías consolidadas por el facilitador (`idproy`, `id`, `nombre`).
4. **`categorizerdet`** *(Herramienta 3: Detalle de Categorización)*:  
   Mapeo de ideas individuales asignadas a cada categoría consolidada (`idproy`, `idcat`, `idtopico`, `idusuario`, `ididea`).
5. **`comenter`** *(Herramienta 4: Comentador)*:  
   Retroalimentación y observaciones de los decisores sobre las categorías (`idproy`, `idcat`, `idusuario`, `comentario`).
6. **`voting`** *(Herramienta 5: Votación)*:  
   Votación porcentual de consenso de los decisores (`idproy`, `idcat`, `idusuario`, `voto`).
7. **`criterios_pesos`** *(Herramienta 6: Ponderación)*:  
   Ponderaciones cuantitativas asignadas a los criterios para el modelo matemático (`idproy`, `id`, `nombre`, `descripcion`, `peso`).
8. **`matriz_valuada`** *(Herramienta 7: Matriz Valuada)*:  
   Calificaciones de cada alternativa evaluada frente a cada criterio (`idproy`, `idalt`, `idcrit`, `valor`).

---

## ⚡ Reglas de Integridad y Diseño Relacional

* **Claves Primarias Compuestas**: Todas las tablas dependientes de un proyecto (`alternativas`, `criterios`, `agenda`, `matriz_valuada`, etc.) utilizan llaves compuestas `(idproy, ...)` para aislar completamente los datos de cada sesión y proyecto.
* **Integridad Referencial en Cascada**: Las restricciones `FOREIGN KEY` implementan `ON DELETE CASCADE ON UPDATE CASCADE`, asegurando que la eliminación o modificación de un proyecto o usuario limpie y sincronice sus registros hijos sin inconsistencias.
* **Tipos Numéricos Precisos**: Se utiliza `DECIMAL(10, 4)` en matrices y pesos para evitar errores de redondeo de punto flotante en los cálculos de scoring.

---

## 🚀 Guía de Ejecución en MySQL / MariaDB

### Opción A: Desde PowerShell / Bash en una sola línea

```powershell
mysql -u root -p --default-character-set=utf8mb4 -e "source sql/01_schema.sql; source sql/02_seed.sql; source sql/03_consultas_dss.sql"
```

### Opción B: Ejecución paso a paso en consola interactiva de MySQL

```sql
-- 1. Crear el esquema y las 15 tablas
SOURCE sql/01_schema.sql;

-- 2. Insertar los datos semilla de prueba
SOURCE sql/02_seed.sql;

-- 3. Ejecutar las consultas de validación y cálculo de scoring multicriterio
SOURCE sql/03_consultas_dss.sql;
```

---

## 📊 Consulta Destacada: Cálculo del Ranking Multicriterio (Scoring)

El archivo [`sql/03_consultas_dss.sql`](sql/03_consultas_dss.sql) incluye el cálculo automático del modelo aditivo ponderado:

$$\text{Puntaje}(A_i) = \sum_{j=1}^{m} \left( \text{Valor}_{ij} \times \text{Peso}_j \right)$$

```sql
SELECT 
    alt.nombre AS alternativa,
    ROUND(SUM(mv.valor * cp.peso), 4) AS puntaje_scoring_total,
    RANK() OVER (ORDER BY SUM(mv.valor * cp.peso) DESC) AS ranking_recomendacion
FROM matriz_valuada mv
INNER JOIN alternativas alt ON mv.idproy = alt.idproy AND mv.idalt = alt.id
INNER JOIN criterios_pesos cp ON mv.idproy = cp.idproy AND mv.idcrit = cp.id
WHERE mv.idproy = 1
GROUP BY alt.id, alt.nombre
ORDER BY puntaje_scoring_total DESC;
```
*(Produce el ranking recomendado por el sistema: 1° Lenovo, 2° HP, 3° Acer).*
