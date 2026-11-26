-- =====================================================================
-- Base de Datos SADMG / DSS — Sistema de Apoyo a la Decisión Multicriterio en Grupo
-- Archivo: 02_seed.sql (DML - Datos Semilla e Inserciones de Prueba)
-- Motor: MySQL 8.0+ / MariaDB
-- =====================================================================

USE dss_sadmg;

-- -----------------------------------------------------
-- 1. Inserción en usuarios
-- -----------------------------------------------------
INSERT INTO usuarios (id, nombre, telefono, correo, usuario, passw)
VALUES 
(1, 'Juan', '6681202020', 'juan@gmail.com', 'juan', '1234'),
(2, 'María', '6681202021', 'maria@gmail.com', 'maria', '1234'),
(3, 'Carlos', '6681202022', 'carlos@gmail.com', 'carlos', '1234');

-- -----------------------------------------------------
-- 2. Inserción en proyectos
-- -----------------------------------------------------
INSERT INTO proyectos (id, nombre, objetivo, fechainicio, fechafin, estatus)
VALUES 
(1, 'laptops', 'elegir la mejor laptop para el departamento', '2026-01-01', '2026-01-30', 2);

-- -----------------------------------------------------
-- 3. Inserción en proyectos_usuarios (Roles)
-- -----------------------------------------------------
INSERT INTO proyectos_usuarios (idproy, idusu, rol)
VALUES 
(1, 1, 'FAC'),
(1, 2, 'DEC'),
(1, 3, 'DEC');

-- -----------------------------------------------------
-- 4. Inserción en alternativas
-- -----------------------------------------------------
INSERT INTO alternativas (idproy, id, nombre, descripcion)
VALUES 
(1, 1, 'acer', 'acer 15" color negro'),
(1, 2, 'hp', 'hp 16", color plata'),
(1, 3, 'lenovo', 'lenovo 17.2" color negro');

-- -----------------------------------------------------
-- 5. Inserción en criterios (con pesos de ponderación)
-- -----------------------------------------------------
INSERT INTO criterios (idproy, id, nombre, descripcion, peso)
VALUES 
(1, 1, 'ram', 'memoria ram', 0.3),
(1, 2, 'ssd', 'almacenamiento de estado solido', 0.2),
(1, 3, 'cpu', 'velocidad del procesador', 0.4),
(1, 4, 'tam pant', 'tamaño de pantalla', 0.1),
(1, 5, 'marca', 'marca del equipo', 0.1);

-- -----------------------------------------------------
-- 6. Inserción en matriz_valuada (Herramienta 7: Calificaciones)
-- -----------------------------------------------------
INSERT INTO matriz_valuada (idproy, idalt, idcrit, valor)
VALUES 
-- Alternativa 1 (acer)
(1, 1, 1, 8),
(1, 1, 2, 7),
(1, 1, 3, 9),
(1, 1, 4, 3),
(1, 1, 5, 1),
-- Alternativa 2 (hp)
(1, 2, 1, 6),
(1, 2, 2, 9),
(1, 2, 3, 5),
(1, 2, 4, 4),
(1, 2, 5, 3),
-- Alternativa 3 (lenovo)
(1, 3, 1, 7),
(1, 3, 2, 8),
(1, 3, 3, 4),
(1, 3, 4, 6),
(1, 3, 5, 2);

-- -----------------------------------------------------
-- 8. Inserción en tools (Catálogo de Herramientas)
-- -----------------------------------------------------
INSERT INTO tools (id, nombre, descripcion)
VALUES 
(1, 'chat', 'permite conversar con decisores'),
(2, 'lluvia de ideas', 'permite generar una lista de ideas'),
(3, 'categorizador', 'permite categorizar la lista de ideas'),
(4, 'comentador', 'permite comentar las categorías'),
(5, 'votacion', 'permite generar una votacion'),
(6, 'ponderacion', 'permite establecer pesos a los criterios'),
(7, 'matriz valuada', 'permite evaluar cada alternativa en cada criterio');

-- -----------------------------------------------------
-- 9. Inserción en agenda (Cronograma de Tópicos)
-- -----------------------------------------------------
INSERT INTO agenda (idproy, id, topico, rol, idtool)
VALUES 
(1, 1, 'primer contacto', 'FAC, DEC', 1),
(1, 2, 'definir ideas de alternativas', 'DEC', 2),
(1, 3, 'categorizar ideas de alternativas', 'FAC', 3),
(1, 4, 'comentar ideas de alternativas', 'DEC', 4),
(1, 5, 'votar ideas de alternativas', 'DEC', 5),
(1, 6, 'definir ideas de criterios', 'DEC', 2),
(1, 7, 'categorizar ideas de criterios', 'FAC', 3),
(1, 8, 'comentar ideas de criterios', 'DEC', 4),
(1, 9, 'votar ideas de criterios', 'DEC', 5),
(1, 10, 'establecer pesos a criterios', 'DEC', 6),
(1, 11, 'establecer valoracion', 'DEC', 7);

-- -----------------------------------------------------
-- 10. Inserción en chat (Herramienta 1)
-- -----------------------------------------------------
INSERT INTO chat (idproy, idtopico, idusuario, id, fecha, hora, mensaje)
VALUES 
(1, 1, 1, 1, '2026-01-01', '08:00:00', 'hola a todos'),
(1, 1, 2, 2, '2026-01-01', '08:01:00', 'hola'),
(1, 1, 3, 3, '2026-01-01', '08:02:00', 'hola'),
(1, 1, 1, 4, '2026-01-01', '08:03:00', 'el objetivo de este proyecto es...'),
(1, 1, 2, 5, '2026-01-01', '08:03:00', 'enterado'),
(1, 1, 3, 6, '2026-01-01', '08:03:00', 'enterado');

-- -----------------------------------------------------
-- 11. Inserción en brainstorming (Herramienta 2)
-- -----------------------------------------------------
INSERT INTO brainstorming (idproy, idtopico, idusuario, id, nombre, objetivo)
VALUES 
-- Propuestas de alternativas (Tópico 2)
(1, 2, 2, 1, 'lenovo', 'laptop lenovo para el departamento'),
(1, 2, 2, 2, 'hp', 'laptop hp para el departamento'),
(1, 2, 2, 3, 'toshiba', 'laptop toshiba para el departamento'),
(1, 2, 3, 1, 'lenovo', 'laptop lenovo para el departamento'),
(1, 2, 3, 2, 'sony', 'laptop sony para el departamento'),
(1, 2, 3, 3, 'toshiba', 'laptop toshiba para el departamento'),
-- Propuestas de criterios (Tópico 6)
(1, 6, 2, 1, 'ram', 'memoria ram del equipo'),
(1, 6, 2, 2, 'ssd', 'almacenamiento de estado solido');

-- -----------------------------------------------------
-- 12. Inserción en categorizer (Herramienta 3)
-- -----------------------------------------------------
INSERT INTO categorizer (idproy, id, nombre)
VALUES 
(1, 1, 'lenovo'),
(1, 2, 'hp'),
(1, 3, 'toshiba'),
(1, 4, 'sony');

-- -----------------------------------------------------
-- 13. Inserción en categorizerdet (Herramienta 3: Detalle)
-- -----------------------------------------------------
INSERT INTO categorizerdet (idproy, idcat, idtopico, idusuario, ididea)
VALUES 
(1, 1, 2, 2, 1),
(1, 1, 2, 3, 1),
(1, 2, 2, 2, 2),
(1, 3, 2, 2, 3),
(1, 3, 2, 3, 3),
(1, 4, 2, 3, 2);

-- -----------------------------------------------------
-- 14. Inserción en comenter (Herramienta 4)
-- -----------------------------------------------------
INSERT INTO comenter (idproy, idcat, idusuario, comentario)
VALUES 
(1, 1, 2, 'está todo bien'),
(1, 1, 3, 'me parece bien'),
(1, 2, 2, 'estoy de acuerdo'),
(1, 2, 3, 'ok'),
(1, 3, 2, 'muy bien'),
(1, 3, 3, 'está bien'),
(1, 4, 2, 'coincido'),
(1, 4, 3, 'es correcto');

-- -----------------------------------------------------
-- 15. Inserción en voting (Herramienta 5)
-- -----------------------------------------------------
INSERT INTO voting (idproy, idcat, idusuario, voto)
VALUES 
(1, 1, 2, 60.00),
(1, 1, 3, 75.00),
(1, 2, 2, 30.00),
(1, 2, 3, 40.00),
(1, 3, 2, 80.00),
(1, 3, 3, 90.00),
(1, 4, 2, 100.00),
(1, 4, 3, 100.00);
