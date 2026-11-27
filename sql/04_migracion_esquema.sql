-- =====================================================================
-- Archivo: 04_migracion_esquema.sql
-- Actualiza una BD YA CREADA con el esquema anterior (14 tablas, categorizer
-- sin idtopico) al esquema actual de 01_schema.sql.
--
-- Cambios:
--   1. usuarios: usuario y correo únicos.
--   2. categorizer: nueva columna idtopico (FK a agenda) y nombre único por tópico.
--   3. chat, brainstorming, comenter, voting: el autor debe participar en el
--      proyecto (FK compuesta a proyectos_usuarios en lugar de a usuarios).
--   4. CHECK de rol, estatus y voto (opcional, ver el final).
--
-- ANTES DE EJECUTAR (en la consola de DataGrip, con la BD correcta seleccionada):
--   * categorizer debe estar VACÍA (en caso contrario agrega idtopico con datos
--     reales antes del paso 2):   SELECT COUNT(*) FROM categorizer;
--   * No debe haber usuarios repetidos:
--       SELECT usuario, COUNT(*) FROM usuarios GROUP BY usuario HAVING COUNT(*) > 1;
--       SELECT correo,  COUNT(*) FROM usuarios GROUP BY correo  HAVING COUNT(*) > 1;
--   * Todo autor de chat/brainstorming/comenter/voting debe estar en proyectos_usuarios:
--       SELECT DISTINCT c.idproy, c.idusuario FROM chat c
--       LEFT JOIN proyectos_usuarios pu ON pu.idproy = c.idproy AND pu.idusu = c.idusuario
--       WHERE pu.idusu IS NULL;      (repetir con brainstorming, comenter y voting)
--
-- Ejecuta cada sentencia por separado y en orden. En TiDB no son transaccionales.
-- Cambia el nombre de la BD si no es dss_sadmg.
-- =====================================================================

USE dss_sadmg;

-- -----------------------------------------------------
-- 1. usuarios: unicidad
-- -----------------------------------------------------
ALTER TABLE usuarios ADD CONSTRAINT uq_usuarios_usuario UNIQUE (usuario);
ALTER TABLE usuarios ADD CONSTRAINT uq_usuarios_correo UNIQUE (correo);

-- -----------------------------------------------------
-- 1b. usuarios.passw: espacio para el hash (scrypt)
-- Después de este paso ejecuta, desde backend/:  npm run db:hash-passwords
-- (convierte a hash las contraseñas que estén en texto plano; los logins
-- fallan hasta que se haga).
-- -----------------------------------------------------
ALTER TABLE usuarios MODIFY COLUMN passw VARCHAR(255) NOT NULL;

-- -----------------------------------------------------
-- 2. categorizer: idtopico
-- -----------------------------------------------------
ALTER TABLE categorizer ADD COLUMN idtopico BIGINT NOT NULL AFTER id;
ALTER TABLE categorizer ADD CONSTRAINT uq_categorizer_nombre UNIQUE (idproy, idtopico, nombre);
ALTER TABLE categorizer ADD CONSTRAINT fk_categorizer_agenda FOREIGN KEY (idproy, idtopico)
    REFERENCES agenda (idproy, id) ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------------
-- 3. Pertenencia al proyecto
-- -----------------------------------------------------
ALTER TABLE chat ADD INDEX idx_chat_participante (idproy, idusuario);
ALTER TABLE chat DROP FOREIGN KEY fk_chat_usuario;
ALTER TABLE chat ADD CONSTRAINT fk_chat_participante FOREIGN KEY (idproy, idusuario)
    REFERENCES proyectos_usuarios (idproy, idusu) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE brainstorming ADD INDEX idx_brainstorming_participante (idproy, idusuario);
ALTER TABLE brainstorming DROP FOREIGN KEY fk_brainstorming_usuario;
ALTER TABLE brainstorming ADD CONSTRAINT fk_brainstorming_participante FOREIGN KEY (idproy, idusuario)
    REFERENCES proyectos_usuarios (idproy, idusu) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE comenter ADD INDEX idx_comenter_participante (idproy, idusuario);
ALTER TABLE comenter DROP FOREIGN KEY fk_comenter_usuario;
ALTER TABLE comenter ADD CONSTRAINT fk_comenter_participante FOREIGN KEY (idproy, idusuario)
    REFERENCES proyectos_usuarios (idproy, idusu) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE voting ADD INDEX idx_voting_participante (idproy, idusuario);
ALTER TABLE voting DROP FOREIGN KEY fk_voting_usuario;
ALTER TABLE voting ADD CONSTRAINT fk_voting_participante FOREIGN KEY (idproy, idusuario)
    REFERENCES proyectos_usuarios (idproy, idusu) ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------------
-- 4. CHECK (opcional)
-- TiDB solo los aplica si tidb_enable_check_constraint = ON. Compruébalo con:
--   SHOW VARIABLES LIKE 'tidb_enable_check_constraint';
-- Si está en OFF y no puedes activarla, omite este paso: la API ya valida
-- los mismos valores con Zod.
-- -----------------------------------------------------
ALTER TABLE proyectos ADD CONSTRAINT ck_proyectos_estatus CHECK (estatus IN (1, 2));
ALTER TABLE proyectos_usuarios ADD CONSTRAINT ck_proy_usu_rol CHECK (rol IN ('FAC', 'DEC'));
ALTER TABLE voting ADD CONSTRAINT ck_voting_voto CHECK (voto BETWEEN 0 AND 100);
