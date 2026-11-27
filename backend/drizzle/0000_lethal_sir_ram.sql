CREATE TABLE `agenda` (
	`idproy` bigint NOT NULL,
	`id` bigint NOT NULL,
	`topico` varchar(100) NOT NULL,
	`rol` varchar(20) NOT NULL,
	`idtool` bigint NOT NULL,
	CONSTRAINT `agenda_idproy_id_pk` PRIMARY KEY(`idproy`,`id`)
);
--> statement-breakpoint
CREATE TABLE `alternativas` (
	`idproy` bigint NOT NULL,
	`id` bigint NOT NULL,
	`nombre` varchar(100) NOT NULL,
	`descripcion` varchar(1000),
	CONSTRAINT `alternativas_idproy_id_pk` PRIMARY KEY(`idproy`,`id`)
);
--> statement-breakpoint
CREATE TABLE `brainstorming` (
	`idproy` bigint NOT NULL,
	`idtopico` bigint NOT NULL,
	`idusuario` bigint NOT NULL,
	`id` bigint NOT NULL,
	`nombre` varchar(100) NOT NULL,
	`objetivo` varchar(1000),
	CONSTRAINT `brainstorming_idproy_idtopico_idusuario_id_pk` PRIMARY KEY(`idproy`,`idtopico`,`idusuario`,`id`)
);
--> statement-breakpoint
CREATE TABLE `categorizer` (
	`idproy` bigint NOT NULL,
	`id` bigint NOT NULL,
	`idtopico` bigint NOT NULL,
	`nombre` varchar(100) NOT NULL,
	CONSTRAINT `categorizer_idproy_id_pk` PRIMARY KEY(`idproy`,`id`),
	CONSTRAINT `uq_categorizer_nombre` UNIQUE(`idproy`,`idtopico`,`nombre`)
);
--> statement-breakpoint
CREATE TABLE `categorizerdet` (
	`idproy` bigint NOT NULL,
	`idcat` bigint NOT NULL,
	`idtopico` bigint NOT NULL,
	`idusuario` bigint NOT NULL,
	`ididea` bigint NOT NULL,
	CONSTRAINT `categorizerdet_idproy_idcat_idtopico_idusuario_ididea_pk` PRIMARY KEY(`idproy`,`idcat`,`idtopico`,`idusuario`,`ididea`)
);
--> statement-breakpoint
CREATE TABLE `chat` (
	`idproy` bigint NOT NULL,
	`idtopico` bigint NOT NULL,
	`idusuario` bigint NOT NULL,
	`id` bigint NOT NULL,
	`fecha` date NOT NULL,
	`hora` time NOT NULL,
	`mensaje` varchar(1000) NOT NULL,
	CONSTRAINT `chat_idproy_idtopico_idusuario_id_pk` PRIMARY KEY(`idproy`,`idtopico`,`idusuario`,`id`)
);
--> statement-breakpoint
CREATE TABLE `comenter` (
	`idproy` bigint NOT NULL,
	`idcat` bigint NOT NULL,
	`idusuario` bigint NOT NULL,
	`comentario` varchar(1000) NOT NULL,
	CONSTRAINT `comenter_idproy_idcat_idusuario_pk` PRIMARY KEY(`idproy`,`idcat`,`idusuario`)
);
--> statement-breakpoint
CREATE TABLE `criterios` (
	`idproy` bigint NOT NULL,
	`id` bigint NOT NULL,
	`nombre` varchar(100) NOT NULL,
	`descripcion` varchar(1000),
	`peso` decimal(10,4),
	CONSTRAINT `criterios_idproy_id_pk` PRIMARY KEY(`idproy`,`id`)
);
--> statement-breakpoint
CREATE TABLE `matriz_valuada` (
	`idproy` bigint NOT NULL,
	`idalt` bigint NOT NULL,
	`idcrit` bigint NOT NULL,
	`valor` decimal(10,4) NOT NULL,
	CONSTRAINT `matriz_valuada_idproy_idalt_idcrit_pk` PRIMARY KEY(`idproy`,`idalt`,`idcrit`)
);
--> statement-breakpoint
CREATE TABLE `proyectos` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`nombre` varchar(100) NOT NULL,
	`objetivo` varchar(1000),
	`fechainicio` date,
	`fechafin` date,
	`estatus` tinyint NOT NULL,
	CONSTRAINT `proyectos_id` PRIMARY KEY(`id`),
	CONSTRAINT `ck_proyectos_estatus` CHECK(`proyectos`.`estatus` IN (1, 2))
);
--> statement-breakpoint
CREATE TABLE `proyectos_usuarios` (
	`idproy` bigint NOT NULL,
	`idusu` bigint NOT NULL,
	`rol` varchar(3) NOT NULL,
	CONSTRAINT `proyectos_usuarios_idproy_idusu_pk` PRIMARY KEY(`idproy`,`idusu`),
	CONSTRAINT `ck_proy_usu_rol` CHECK(`proyectos_usuarios`.`rol` IN ('FAC', 'DEC'))
);
--> statement-breakpoint
CREATE TABLE `tools` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`nombre` varchar(100) NOT NULL,
	`descripcion` varchar(1000),
	CONSTRAINT `tools_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`nombre` varchar(100) NOT NULL,
	`telefono` varchar(20),
	`correo` varchar(200) NOT NULL,
	`usuario` varchar(100) NOT NULL,
	`passw` varchar(255) NOT NULL,
	CONSTRAINT `usuarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_usuarios_usuario` UNIQUE(`usuario`),
	CONSTRAINT `uq_usuarios_correo` UNIQUE(`correo`)
);
--> statement-breakpoint
CREATE TABLE `voting` (
	`idproy` bigint NOT NULL,
	`idcat` bigint NOT NULL,
	`idusuario` bigint NOT NULL,
	`voto` decimal(5,2) NOT NULL,
	CONSTRAINT `voting_idproy_idcat_idusuario_pk` PRIMARY KEY(`idproy`,`idcat`,`idusuario`),
	CONSTRAINT `ck_voting_voto` CHECK(`voting`.`voto` BETWEEN 0 AND 100)
);
--> statement-breakpoint
ALTER TABLE `agenda` ADD CONSTRAINT `fk_agenda_proyecto` FOREIGN KEY (`idproy`) REFERENCES `proyectos`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `agenda` ADD CONSTRAINT `fk_agenda_tool` FOREIGN KEY (`idtool`) REFERENCES `tools`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `alternativas` ADD CONSTRAINT `fk_alternativas_proyecto` FOREIGN KEY (`idproy`) REFERENCES `proyectos`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `brainstorming` ADD CONSTRAINT `fk_brainstorming_agenda` FOREIGN KEY (`idproy`,`idtopico`) REFERENCES `agenda`(`idproy`,`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `brainstorming` ADD CONSTRAINT `fk_brainstorming_participante` FOREIGN KEY (`idproy`,`idusuario`) REFERENCES `proyectos_usuarios`(`idproy`,`idusu`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `categorizer` ADD CONSTRAINT `fk_categorizer_proyecto` FOREIGN KEY (`idproy`) REFERENCES `proyectos`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `categorizer` ADD CONSTRAINT `fk_categorizer_agenda` FOREIGN KEY (`idproy`,`idtopico`) REFERENCES `agenda`(`idproy`,`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `categorizerdet` ADD CONSTRAINT `fk_catdet_categorizer` FOREIGN KEY (`idproy`,`idcat`) REFERENCES `categorizer`(`idproy`,`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `categorizerdet` ADD CONSTRAINT `fk_catdet_brainstorming` FOREIGN KEY (`idproy`,`idtopico`,`idusuario`,`ididea`) REFERENCES `brainstorming`(`idproy`,`idtopico`,`idusuario`,`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `chat` ADD CONSTRAINT `fk_chat_agenda` FOREIGN KEY (`idproy`,`idtopico`) REFERENCES `agenda`(`idproy`,`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `chat` ADD CONSTRAINT `fk_chat_participante` FOREIGN KEY (`idproy`,`idusuario`) REFERENCES `proyectos_usuarios`(`idproy`,`idusu`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `comenter` ADD CONSTRAINT `fk_comenter_categorizer` FOREIGN KEY (`idproy`,`idcat`) REFERENCES `categorizer`(`idproy`,`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `comenter` ADD CONSTRAINT `fk_comenter_participante` FOREIGN KEY (`idproy`,`idusuario`) REFERENCES `proyectos_usuarios`(`idproy`,`idusu`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `criterios` ADD CONSTRAINT `fk_criterios_proyecto` FOREIGN KEY (`idproy`) REFERENCES `proyectos`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `matriz_valuada` ADD CONSTRAINT `fk_matriz_proyecto` FOREIGN KEY (`idproy`) REFERENCES `proyectos`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `matriz_valuada` ADD CONSTRAINT `fk_matriz_alternativas` FOREIGN KEY (`idproy`,`idalt`) REFERENCES `alternativas`(`idproy`,`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `matriz_valuada` ADD CONSTRAINT `fk_matriz_criterios` FOREIGN KEY (`idproy`,`idcrit`) REFERENCES `criterios`(`idproy`,`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `proyectos_usuarios` ADD CONSTRAINT `fk_proy_usu_proyecto` FOREIGN KEY (`idproy`) REFERENCES `proyectos`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `proyectos_usuarios` ADD CONSTRAINT `fk_proy_usu_usuario` FOREIGN KEY (`idusu`) REFERENCES `usuarios`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `voting` ADD CONSTRAINT `fk_voting_categorizer` FOREIGN KEY (`idproy`,`idcat`) REFERENCES `categorizer`(`idproy`,`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `voting` ADD CONSTRAINT `fk_voting_participante` FOREIGN KEY (`idproy`,`idusuario`) REFERENCES `proyectos_usuarios`(`idproy`,`idusu`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `idx_brainstorming_participante` ON `brainstorming` (`idproy`,`idusuario`);--> statement-breakpoint
CREATE INDEX `idx_chat_participante` ON `chat` (`idproy`,`idusuario`);--> statement-breakpoint
CREATE INDEX `idx_comenter_participante` ON `comenter` (`idproy`,`idusuario`);--> statement-breakpoint
CREATE INDEX `idx_voting_participante` ON `voting` (`idproy`,`idusuario`);