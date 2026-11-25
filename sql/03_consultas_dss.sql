-- =====================================================================
-- Base de Datos SADMG / DSS — Sistema de Apoyo a la Decisión Multicriterio en Grupo
-- Archivo: 03_consultas_dss.sql (DQL - Consultas de Verificación y Flujo DSS)
-- Motor: MySQL 8.0+ / MariaDB
-- =====================================================================

USE dss_sadmg;

-- -----------------------------------------------------
-- Consulta 1: Participantes y sus roles en el proyecto
-- -----------------------------------------------------
SELECT 
    p.nombre AS proyecto,
    u.id AS id_usuario,
    u.nombre AS participante,
    u.correo,
    pu.rol AS rol_en_reunion,
    CASE pu.rol
        WHEN 'FAC' THEN 'Facilitador (Conduce la reunión)'
        WHEN 'DEC' THEN 'Decisor (Emite juicios y votos)'
        ELSE pu.rol
    END AS descripcion_rol
FROM proyectos_usuarios pu
INNER JOIN proyectos p ON pu.idproy = p.id
INNER JOIN usuarios u ON pu.idusu = u.id
ORDER BY pu.idproy, pu.rol;

-- -----------------------------------------------------
-- Consulta 2: Agenda de la reunión y herramientas asignadas
-- -----------------------------------------------------
SELECT 
    a.id AS num_actividad,
    a.topico,
    a.rol AS rol_participante,
    t.nombre AS herramienta_utilizada,
    t.descripcion AS funcion_herramienta
FROM agenda a
INNER JOIN tools t ON a.idtool = t.id
WHERE a.idproy = 1
ORDER BY a.id;

-- -----------------------------------------------------
-- Consulta 3: Historial de mensajes en el Chat de la reunión
-- -----------------------------------------------------
SELECT 
    c.id AS mensaje_num,
    u.nombre AS remitente,
    c.fecha,
    c.hora,
    c.mensaje
FROM chat c
INNER JOIN usuarios u ON c.idusuario = u.id
WHERE c.idproy = 1 AND c.idtopico = 1
ORDER BY c.fecha, c.hora, c.id;

-- -----------------------------------------------------
-- Consulta 4: Consolidación de Lluvia de Ideas a Categorías
-- -----------------------------------------------------
SELECT 
    cat.id AS id_categoria,
    cat.nombre AS categoria,
    u.nombre AS decisor_que_propuso,
    b.nombre AS idea_original,
    b.objetivo AS descripcion_idea
FROM categorizerdet cd
INNER JOIN categorizer cat ON cd.idproy = cat.idproy AND cd.idcat = cat.id
INNER JOIN brainstorming b ON cd.idproy = b.idproy AND cd.idtopico = b.idtopico AND cd.idusuario = b.idusuario AND cd.ididea = b.id
INNER JOIN usuarios u ON b.idusuario = u.id
WHERE cd.idproy = 1
ORDER BY cat.id, u.id;

-- -----------------------------------------------------
-- Consulta 5: Resultados de Votación y Consenso por Categoría
-- -----------------------------------------------------
SELECT 
    cat.nombre AS categoria,
    COUNT(v.idusuario) AS total_votantes,
    AVG(v.voto) AS promedio_aprobacion_pct,
    MIN(v.voto) AS voto_minimo_pct,
    MAX(v.voto) AS voto_maximo_pct
FROM voting v
INNER JOIN categorizer cat ON v.idproy = cat.idproy AND v.idcat = cat.id
WHERE v.idproy = 1
GROUP BY cat.id, cat.nombre
ORDER BY promedio_aprobacion_pct DESC;

-- -----------------------------------------------------
-- Consulta 6: Ponderación de Criterios (Pesos de Decisión)
-- -----------------------------------------------------
SELECT 
    cp.id AS id_criterio,
    cp.nombre AS criterio,
    cp.descripcion,
    cp.peso AS ponderacion,
    CONCAT(ROUND(cp.peso * 100, 2), '%') AS porcentaje_importancia
FROM criterios_pesos cp
WHERE cp.idproy = 1
ORDER BY cp.peso DESC;

-- -----------------------------------------------------
-- Consulta 7: CÁLCULO FINAL DE SCORING MULTICRITERIO
-- Multiplica la calificación de cada alternativa por el peso del criterio
-- y calcula el puntaje total acumulado para emitir la recomendación final.
-- -----------------------------------------------------
SELECT 
    alt.id AS id_alternativa,
    alt.nombre AS alternativa,
    alt.descripcion,
    ROUND(SUM(mv.valor * cp.peso), 4) AS puntaje_scoring_total,
    RANK() OVER (ORDER BY SUM(mv.valor * cp.peso) DESC) AS ranking_recomendacion
FROM matriz_valuada mv
INNER JOIN alternativas alt ON mv.idproy = alt.idproy AND mv.idalt = alt.id
INNER JOIN criterios_pesos cp ON mv.idproy = cp.idproy AND mv.idcrit = cp.id
WHERE mv.idproy = 1
GROUP BY alt.id, alt.nombre, alt.descripcion
ORDER BY puntaje_scoring_total DESC;
