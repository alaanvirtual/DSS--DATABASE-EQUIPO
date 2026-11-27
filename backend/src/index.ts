import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { pool } from './db/client';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
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

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);

  app.use('/api/usuarios', usuariosRouter);
  app.use('/api/tools', toolsRouter);

  proyectosRouter.use('/:idproy/participantes', participantesRouter);
  proyectosRouter.use('/:idproy/alternativas', alternativasRouter);
  proyectosRouter.use('/:idproy/criterios', criteriosRouter);
  proyectosRouter.use('/:idproy/matriz', matrizRouter);
  proyectosRouter.use('/:idproy/scoring', scoringRouter);

  proyectosRouter.use('/:idproy/agenda/:idtopico/chat', chatRouter);
  proyectosRouter.use('/:idproy/agenda/:idtopico/brainstorming', brainstormingRouter);
  proyectosRouter.use('/:idproy/agenda', agendaRouter);

  proyectosRouter.use('/:idproy/categorias/:idcat/detalle', categoriaDetalleRouter);
  proyectosRouter.use('/:idproy/categorias/:idcat/comentarios', comentariosRouter);
  proyectosRouter.use('/:idproy/categorias/:idcat/votos', votosRouter);
  proyectosRouter.use('/:idproy/categorias', categoriasRouter);

  app.use('/api/proyectos', proyectosRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

if (require.main === module) {
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} recibido, cerrando conexiones...`);
    pool.end().finally(() => process.exit(0));
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
