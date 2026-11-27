import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { pool } from './db/client';
import { agenda, categorizer } from './db/schema';
import { HERRAMIENTA } from './lib/topicos';
import { requireAuth } from './middleware/auth';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import {
  conservarFacilitador,
  editaCategoria,
  permitirEscritura,
  soloPropio,
  topicoConHerramienta
} from './middleware/permisos';
import { requireParent } from './middleware/requireParent';
import { authRouter } from './routes/auth';
import { categorizadorRouter } from './routes/categorizador';
import { healthRouter } from './routes/health';
import { scoringRouter } from './routes/scoring';
import {
  agendaRouter,
  alternativasRouter,
  brainstormingRouter,
  categoriaDetalleRouter,
  categoriasRouter,
  chatRouter,
  comentariosRouter,
  criteriosRouter,
  matrizRouter,
  participantesRouter,
  proyectosRouter,
  toolsRouter,
  usuariosRouter,
  votosRouter
} from './routes/resources';

// Las rutas anidadas responden 404 si el recurso padre no existe,
// en vez de devolver una lista vacía. (El proyecto padre lo valida proyectosRouter.)
const topicoExiste = requireParent(agenda, 'Tópico de agenda', [
  { param: 'idproy', column: agenda.idproy },
  { param: 'idtopico', column: agenda.id }
]);

const categoriaExiste = requireParent(categorizer, 'Categoría', [
  { param: 'idproy', column: categorizer.idproy },
  { param: 'idcat', column: categorizer.id }
]);

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.json({
      message: 'API SADMG / DSS funcionando',
      docs: 'Ver backend/README.md para el detalle de endpoints'
    });
  });

  // Públicas: estado del servicio e inicio de sesión.
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);

  // Todo lo demás exige un token válido.
  app.use('/api', requireAuth);

  app.use('/api/usuarios', usuariosRouter);
  app.use('/api/tools', toolsRouter);

  // Dentro de /proyectos/:idproy el usuario ya está verificado como participante (ver
  // proyectosRouter) y req.rolProyecto trae su rol. Cada recurso define quién puede escribir.
  proyectosRouter.use(
    '/:idproy/participantes',
    permitirEscritura(['FAC']),
    conservarFacilitador,
    participantesRouter
  );
  proyectosRouter.use('/:idproy/alternativas', permitirEscritura(['FAC']), alternativasRouter);
  proyectosRouter.use(
    '/:idproy/criterios',
    // El facilitador define los criterios; los decisores pueden ajustar su peso (ponderación).
    permitirEscritura({ POST: ['FAC'], DELETE: ['FAC'], PATCH: ['FAC', 'DEC'] }),
    criteriosRouter
  );
  proyectosRouter.use('/:idproy/matriz', permitirEscritura(['DEC']), matrizRouter);
  proyectosRouter.use('/:idproy/scoring', scoringRouter);

  proyectosRouter.use('/:idproy/agenda/:idtopico', topicoExiste);
  proyectosRouter.use(
    '/:idproy/agenda/:idtopico/chat',
    topicoConHerramienta(HERRAMIENTA.CHAT),
    permitirEscritura(['FAC', 'DEC']),
    soloPropio,
    chatRouter
  );
  proyectosRouter.use(
    '/:idproy/agenda/:idtopico/brainstorming',
    topicoConHerramienta(HERRAMIENTA.LLUVIA_IDEAS),
    permitirEscritura(['FAC', 'DEC']),
    soloPropio,
    brainstormingRouter
  );
  proyectosRouter.use('/:idproy/agenda', permitirEscritura(['FAC']), agendaRouter);

  proyectosRouter.use('/:idproy/categorias/:idcat', categoriaExiste);
  proyectosRouter.use(
    '/:idproy/categorias/:idcat/detalle',
    permitirEscritura(['FAC']),
    editaCategoria,
    categoriaDetalleRouter
  );
  proyectosRouter.use(
    '/:idproy/categorias/:idcat/comentarios',
    permitirEscritura(['DEC']),
    soloPropio,
    comentariosRouter
  );
  proyectosRouter.use(
    '/:idproy/categorias/:idcat/votos',
    permitirEscritura(['DEC']),
    soloPropio,
    votosRouter
  );
  proyectosRouter.use(
    '/:idproy/categorias',
    permitirEscritura(['FAC']),
    editaCategoria,
    categoriasRouter
  );

  // Tablero agregado del categorizador y mover ideas entre categorías.
  proyectosRouter.use('/:idproy', categorizadorRouter);

  app.use('/api/proyectos', proyectosRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

if (require.main === module) {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${env.PORT}`);
  });

  // Cierre ordenado: primero se deja de aceptar peticiones, luego se cierra el pool.
  const shutdown = (signal: string) => {
    console.log(`${signal} recibido, cerrando servidor y conexiones...`);

    // Si algo queda colgado, se fuerza la salida.
    setTimeout(() => process.exit(1), 10_000).unref();

    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
    server.closeIdleConnections?.();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    console.error('Promesa rechazada sin manejar:', reason);
  });
}
