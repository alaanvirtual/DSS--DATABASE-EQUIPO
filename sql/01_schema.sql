-- =====================================================================
-- Base de Datos SADMG / DSS — Sistema de Apoyo a la Decisión Multicriterio en Grupo
-- Archivo: 01_schema.sql (DDL - Definición de Estructura de Tablas)
-- Motor: MySQL 8.0.16+ / MariaDB 10.2+ / TiDB 8.x
--
-- Este script NO borra nada: si las tablas ya existen, falla. Para actualizar
-- una BD existente usa 04_migracion_esquema.sql; para recargar datos de prueba
-- usa el script del backend: `npm run seed -- --yes`.
--
-- Para crear el esquema en otra BD (p. ej. dss_sadmg_dev) cambia el nombre en
-- las dos líneas siguientes y en DB_NAME del .env del backend.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS dss_sadmg CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dss_sadmg;

-- -----------------------------------------------------
-- 1. Tabla: usuarios
-- Catálogo de usuarios (facilitadores, decisores)
-- -----------------------------------------------------
CREATE TABLE usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(200) NOT NULL,
    usuario VARCHAR(100) NOT NULL,
    passw VARCHAR(255) NOT NULL COMMENT 'hash scrypt, nunca la contraseña en claro',
    CONSTRAINT uq_usuarios_usuario UNIQUE (usuario),
    CONSTRAINT uq_usuarios_correo UNIQUE (correo)
);

-- -----------------------------------------------------
-- 2. Tabla: proyectos
-- Proyectos o casos de estudio de toma de decisiones
-- -----------------------------------------------------
CREATE TABLE proyectos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    objetivo VARCHAR(1000),
    fechainicio DATE,
    fechafin DATE,
    estatus TINYINT NOT NULL COMMENT '1=activo, 2=cerrado',
    CONSTRAINT ck_proyectos_estatus CHECK (estatus IN (1, 2))
);

-- -----------------------------------------------------
-- 3. Tabla: proyectos_usuarios
-- Asignación de participantes a cada proyecto y rol
-- -----------------------------------------------------
CREATE TABLE proyectos_usuarios (
    idproy BIGINT NOT NULL,
    idusu BIGINT NOT NULL,
    rol VARCHAR(3) NOT NULL COMMENT 'FAC=Facilitador, DEC=Decisor',
    PRIMARY KEY (idproy, idusu),
    CONSTRAINT ck_proy_usu_rol CHECK (rol IN ('FAC', 'DEC')),
    CONSTRAINT fk_proy_usu_proyecto FOREIGN KEY (idproy)
        REFERENCES proyectos (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_proy_usu_usuario FOREIGN KEY (idusu)
        REFERENCES usuarios (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- 4. Tabla: alternativas
-- Alternativas de solución a evaluar en el proyecto
-- -----------------------------------------------------
CREATE TABLE alternativas (
    idproy BIGINT NOT NULL,
    id BIGINT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(1000),
    PRIMARY KEY (idproy, id),
    CONSTRAINT fk_alternativas_proyecto FOREIGN KEY (idproy)
        REFERENCES proyectos (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- 5. Tabla: criterios
-- Criterios de evaluación definidos para el proyecto
-- -----------------------------------------------------
CREATE TABLE criterios (
    idproy BIGINT NOT NULL,
    id BIGINT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(1000),
    peso DECIMAL(10, 4) DEFAULT NULL,
    PRIMARY KEY (idproy, id),
    CONSTRAINT fk_criterios_proyecto FOREIGN KEY (idproy)
        REFERENCES proyectos (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- 6. Tabla: matriz_valuada (Herramienta 7: Matriz Valuada)
-- Calificación de cada alternativa respecto a cada criterio
-- -----------------------------------------------------
CREATE TABLE matriz_valuada (
    idproy BIGINT NOT NULL,
    idalt BIGINT NOT NULL,
    idcrit BIGINT NOT NULL,
    valor DECIMAL(10, 4) NOT NULL,
    PRIMARY KEY (idproy, idalt, idcrit),
    CONSTRAINT fk_matriz_proyecto FOREIGN KEY (idproy)
        REFERENCES proyectos (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_matriz_alternativas FOREIGN KEY (idproy, idalt)
        REFERENCES alternativas (idproy, id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_matriz_criterios FOREIGN KEY (idproy, idcrit)
        REFERENCES criterios (idproy, id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- 7. Tabla: tools
-- Catálogo de herramientas del modelo de discusión
-- -----------------------------------------------------
CREATE TABLE tools (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(1000)
);

-- -----------------------------------------------------
-- 8. Tabla: agenda
-- Cronograma y plan de reunión (tópicos, roles y tools)
-- -----------------------------------------------------
CREATE TABLE agenda (
    idproy BIGINT NOT NULL,
    id BIGINT NOT NULL,
    topico VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL COMMENT 'FAC, DEC o "FAC, DEC"',
    idtool BIGINT NOT NULL,
    PRIMARY KEY (idproy, id),
    CONSTRAINT fk_agenda_proyecto FOREIGN KEY (idproy)
        REFERENCES proyectos (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_agenda_tool FOREIGN KEY (idtool)
        REFERENCES tools (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- 9. Tabla: chat (Herramienta 1: Chat)
-- Mensajería entre facilitador y decisores.
-- El autor debe participar en el proyecto (fk_chat_participante).
-- -----------------------------------------------------
CREATE TABLE chat (
    idproy BIGINT NOT NULL,
    idtopico BIGINT NOT NULL,
    idusuario BIGINT NOT NULL,
    id BIGINT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    mensaje VARCHAR(1000) NOT NULL,
    PRIMARY KEY (idproy, idtopico, idusuario, id),
    KEY idx_chat_participante (idproy, idusuario),
    CONSTRAINT fk_chat_agenda FOREIGN KEY (idproy, idtopico)
        REFERENCES agenda (idproy, id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_chat_participante FOREIGN KEY (idproy, idusuario)
        REFERENCES proyectos_usuarios (idproy, idusu)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- 10. Tabla: brainstorming (Herramienta 2: Lluvia de Ideas)
-- Propuestas iniciales de alternativas y criterios
-- -----------------------------------------------------
CREATE TABLE brainstorming (
    idproy BIGINT NOT NULL,
    idtopico BIGINT NOT NULL,
    idusuario BIGINT NOT NULL,
    id BIGINT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    objetivo VARCHAR(1000),
    PRIMARY KEY (idproy, idtopico, idusuario, id),
    KEY idx_brainstorming_participante (idproy, idusuario),
    CONSTRAINT fk_brainstorming_agenda FOREIGN KEY (idproy, idtopico)
        REFERENCES agenda (idproy, id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_brainstorming_participante FOREIGN KEY (idproy, idusuario)
        REFERENCES proyectos_usuarios (idproy, idusu)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- 11. Tabla: categorizer (Herramienta 3: Categorizador)
-- Categorías consolidadas para agrupar ideas.
-- idtopico es el tópico de categorización de la agenda al que pertenece la
-- categoría: así el categorizador de alternativas y el de criterios no
-- comparten categorías. El id es único dentro del proyecto.
-- -----------------------------------------------------
CREATE TABLE categorizer (
    idproy BIGINT NOT NULL,
    id BIGINT NOT NULL,
    idtopico BIGINT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    PRIMARY KEY (idproy, id),
    CONSTRAINT uq_categorizer_nombre UNIQUE (idproy, idtopico, nombre),
    CONSTRAINT fk_categorizer_proyecto FOREIGN KEY (idproy)
        REFERENCES proyectos (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_categorizer_agenda FOREIGN KEY (idproy, idtopico)
        REFERENCES agenda (idproy, id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- 12. Tabla: categorizerdet (Herramienta 3: Detalle)
-- Asignación de ideas individuales a cada categoría
-- (idtopico aquí es el tópico de la lluvia de ideas de origen)
-- -----------------------------------------------------
CREATE TABLE categorizerdet (
    idproy BIGINT NOT NULL,
    idcat BIGINT NOT NULL,
    idtopico BIGINT NOT NULL,
    idusuario BIGINT NOT NULL,
    ididea BIGINT NOT NULL,
    PRIMARY KEY (idproy, idcat, idtopico, idusuario, ididea),
    CONSTRAINT fk_catdet_categorizer FOREIGN KEY (idproy, idcat)
        REFERENCES categorizer (idproy, id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_catdet_brainstorming FOREIGN KEY (idproy, idtopico, idusuario, ididea)
        REFERENCES brainstorming (idproy, idtopico, idusuario, id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- 13. Tabla: comenter (Herramienta 4: Comentador)
-- Comentarios y retroalimentación sobre las categorías
-- -----------------------------------------------------
CREATE TABLE comenter (
    idproy BIGINT NOT NULL,
    idcat BIGINT NOT NULL,
    idusuario BIGINT NOT NULL,
    comentario VARCHAR(1000) NOT NULL,
    PRIMARY KEY (idproy, idcat, idusuario),
    KEY idx_comenter_participante (idproy, idusuario),
    CONSTRAINT fk_comenter_categorizer FOREIGN KEY (idproy, idcat)
        REFERENCES categorizer (idproy, id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_comenter_participante FOREIGN KEY (idproy, idusuario)
        REFERENCES proyectos_usuarios (idproy, idusu)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- 14. Tabla: voting (Herramienta 5: Votación)
-- Votos porcentuales sobre las categorías priorizadas
-- -----------------------------------------------------
CREATE TABLE voting (
    idproy BIGINT NOT NULL,
    idcat BIGINT NOT NULL,
    idusuario BIGINT NOT NULL,
    voto DECIMAL(5, 2) NOT NULL,
    PRIMARY KEY (idproy, idcat, idusuario),
    KEY idx_voting_participante (idproy, idusuario),
    CONSTRAINT ck_voting_voto CHECK (voto BETWEEN 0 AND 100),
    CONSTRAINT fk_voting_categorizer FOREIGN KEY (idproy, idcat)
        REFERENCES categorizer (idproy, id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_voting_participante FOREIGN KEY (idproy, idusuario)
        REFERENCES proyectos_usuarios (idproy, idusu)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
