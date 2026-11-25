-- =====================================================================
-- Base de Datos SADMG / DSS — Sistema de Apoyo a la Decisión Multicriterio en Grupo
-- Archivo: 01_schema.sql (DDL - Definición de Estructura de Tablas)
-- Motor: MySQL 8.0+ / MariaDB
-- =====================================================================

DROP DATABASE IF EXISTS dss_sadmg;
CREATE DATABASE dss_sadmg CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
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
    passw VARCHAR(100) NOT NULL
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
    estatus TINYINT NOT NULL COMMENT '1=activo, 2=cerrado'
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
-- 6. Tabla: criterios_pesos (Herramienta 6: Ponderación)
-- Pesos / ponderaciones numéricas asignadas a criterios
-- -----------------------------------------------------
CREATE TABLE criterios_pesos (
    idproy BIGINT NOT NULL,
    id BIGINT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(1000),
    peso DECIMAL(10, 4) NOT NULL,
    PRIMARY KEY (idproy, id),
    CONSTRAINT fk_criterios_pesos_proyecto FOREIGN KEY (idproy)
        REFERENCES proyectos (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- 7. Tabla: matriz_valuada (Herramienta 7: Matriz Valuada)
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
-- 8. Tabla: tools
-- Catálogo de herramientas del modelo de discusión
-- -----------------------------------------------------
CREATE TABLE tools (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(1000)
);

-- -----------------------------------------------------
-- 9. Tabla: agenda
-- Cronograma y plan de reunión (tópicos, roles y tools)
-- -----------------------------------------------------
CREATE TABLE agenda (
    idproy BIGINT NOT NULL,
    id BIGINT NOT NULL,
    topico VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL,
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
-- 10. Tabla: chat (Herramienta 1: Chat)
-- Mensajería entre facilitador y decisores
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
    CONSTRAINT fk_chat_agenda FOREIGN KEY (idproy, idtopico)
        REFERENCES agenda (idproy, id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_chat_usuario FOREIGN KEY (idusuario)
        REFERENCES usuarios (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- 11. Tabla: brainstorming (Herramienta 2: Lluvia de Ideas)
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
    CONSTRAINT fk_brainstorming_agenda FOREIGN KEY (idproy, idtopico)
        REFERENCES agenda (idproy, id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_brainstorming_usuario FOREIGN KEY (idusuario)
        REFERENCES usuarios (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- 12. Tabla: categorizer (Herramienta 3: Categorizador)
-- Categorías consolidadas para agrupar ideas
-- -----------------------------------------------------
CREATE TABLE categorizer (
    idproy BIGINT NOT NULL,
    id BIGINT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    PRIMARY KEY (idproy, id),
    CONSTRAINT fk_categorizer_proyecto FOREIGN KEY (idproy)
        REFERENCES proyectos (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- 13. Tabla: categorizerdet (Herramienta 3: Detalle)
-- Asignación de ideas individuales a cada categoría
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
-- 14. Tabla: comenter (Herramienta 4: Comentador)
-- Comentarios y retroalimentación sobre las categorías
-- -----------------------------------------------------
CREATE TABLE comenter (
    idproy BIGINT NOT NULL,
    idcat BIGINT NOT NULL,
    idusuario BIGINT NOT NULL,
    comentario VARCHAR(1000) NOT NULL,
    PRIMARY KEY (idproy, idcat, idusuario),
    CONSTRAINT fk_comenter_categorizer FOREIGN KEY (idproy, idcat)
        REFERENCES categorizer (idproy, id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_comenter_usuario FOREIGN KEY (idusuario)
        REFERENCES usuarios (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- 15. Tabla: voting (Herramienta 5: Votación)
-- Votos porcentuales sobre las categorías priorizadas
-- -----------------------------------------------------
CREATE TABLE voting (
    idproy BIGINT NOT NULL,
    idcat BIGINT NOT NULL,
    idusuario BIGINT NOT NULL,
    voto DECIMAL(5, 2) NOT NULL,
    PRIMARY KEY (idproy, idcat, idusuario),
    CONSTRAINT fk_voting_categorizer FOREIGN KEY (idproy, idcat)
        REFERENCES categorizer (idproy, id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_voting_usuario FOREIGN KEY (idusuario)
        REFERENCES usuarios (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
