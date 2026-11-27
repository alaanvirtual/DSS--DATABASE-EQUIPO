// Seed completo de datos de prueba del SADMG / DSS.
//
//   npm run seed -- --yes
//
// BORRA todos los datos de la BD indicada en DB_NAME (.env) y los reemplaza por
// los de este archivo. El esquema (tablas) debe existir ya: ver sql/01_schema.sql
// o, si la BD es anterior, sql/04_migracion_esquema.sql.
//
// Flags:
//   --yes     confirma el borrado (sin esto el script solo muestra el destino y sale)
//   --force   permite ejecutarlo con NODE_ENV=production

import { env } from '../config/env';
import { hashPassword } from '../lib/password';
import { db, pool } from './client';
import {
  agenda,
  alternativas,
  brainstorming,
  categorizer,
  categorizerDet,
  chat,
  comenter,
  criterios,
  matrizValuada,
  proyectos,
  proyectosUsuarios,
  tools,
  usuarios,
  voting
} from './schema';

// Roles de la agenda y herramientas (ids de la tabla tools).
const TOOL = {
  CHAT: 1,
  LLUVIA_IDEAS: 2,
  CATEGORIZADOR: 3,
  COMENTADOR: 4,
  VOTACION: 5,
  PONDERACION: 6,
  MATRIZ: 7
} as const;

// ---------------------------------------------------------------------------
// Usuarios. La contraseña de prueba de todos es "1234"; se guarda hasheada
// (scrypt) al cargar el seed, igual que lo hace la API.
// ---------------------------------------------------------------------------
const CLAVE = '1234';

const datosUsuarios = [
  { id: 1, nombre: 'Juan', telefono: '6681202020', correo: 'juan@gmail.com', usuario: 'juan', passw: CLAVE },
  { id: 2, nombre: 'María', telefono: '6681202021', correo: 'maria@gmail.com', usuario: 'maria', passw: CLAVE },
  { id: 3, nombre: 'Carlos', telefono: '6681202022', correo: 'carlos@gmail.com', usuario: 'carlos', passw: CLAVE },
  { id: 4, nombre: 'Ana', telefono: '6681202023', correo: 'ana@gmail.com', usuario: 'ana', passw: CLAVE },
  { id: 5, nombre: 'Luis', telefono: '6681202024', correo: 'luis@gmail.com', usuario: 'luis', passw: CLAVE },
  { id: 6, nombre: 'Sofía', telefono: '6681202025', correo: 'sofia@gmail.com', usuario: 'sofia', passw: CLAVE }
];

const datosTools = [
  { id: 1, nombre: 'chat', descripcion: 'permite conversar con decisores' },
  { id: 2, nombre: 'lluvia de ideas', descripcion: 'permite generar una lista de ideas' },
  { id: 3, nombre: 'categorizador', descripcion: 'permite categorizar la lista de ideas' },
  { id: 4, nombre: 'comentador', descripcion: 'permite comentar las categorías' },
  { id: 5, nombre: 'votacion', descripcion: 'permite generar una votacion' },
  { id: 6, nombre: 'ponderacion', descripcion: 'permite establecer pesos a los criterios' },
  { id: 7, nombre: 'matriz valuada', descripcion: 'permite evaluar cada alternativa en cada criterio' }
];

// ---------------------------------------------------------------------------
// Proyecto 1 "laptops": CERRADO, con el flujo completo de las 7 herramientas
// (alternativas y criterios). Facilitador: Juan. Decisores: María, Carlos, Ana.
// ---------------------------------------------------------------------------
const P1 = 1;
const DECISORES_P1 = [2, 3, 4];

const agendaP1 = [
  { id: 1, topico: 'primer contacto', rol: 'FAC, DEC', idtool: TOOL.CHAT },
  { id: 2, topico: 'definir ideas de alternativas', rol: 'DEC', idtool: TOOL.LLUVIA_IDEAS },
  { id: 3, topico: 'categorizar ideas de alternativas', rol: 'FAC', idtool: TOOL.CATEGORIZADOR },
  { id: 4, topico: 'comentar ideas de alternativas', rol: 'DEC', idtool: TOOL.COMENTADOR },
  { id: 5, topico: 'votar ideas de alternativas', rol: 'DEC', idtool: TOOL.VOTACION },
  { id: 6, topico: 'definir ideas de criterios', rol: 'DEC', idtool: TOOL.LLUVIA_IDEAS },
  { id: 7, topico: 'categorizar ideas de criterios', rol: 'FAC', idtool: TOOL.CATEGORIZADOR },
  { id: 8, topico: 'comentar ideas de criterios', rol: 'DEC', idtool: TOOL.COMENTADOR },
  { id: 9, topico: 'votar ideas de criterios', rol: 'DEC', idtool: TOOL.VOTACION },
  { id: 10, topico: 'establecer pesos a criterios', rol: 'DEC', idtool: TOOL.PONDERACION },
  { id: 11, topico: 'establecer valoracion', rol: 'DEC', idtool: TOOL.MATRIZ }
].map((t) => ({ idproy: P1, ...t }));

const alternativasP1 = [
  { id: 1, nombre: 'acer', descripcion: 'acer 15" color negro' },
  { id: 2, nombre: 'hp', descripcion: 'hp 16", color plata' },
  { id: 3, nombre: 'lenovo', descripcion: 'lenovo 17.2" color negro' }
].map((a) => ({ idproy: P1, ...a }));

// Los pesos suman 1 (ram .3 + ssd .2 + cpu .3 + pantalla .1 + marca .1).
const criteriosP1 = [
  { id: 1, nombre: 'ram', descripcion: 'memoria ram', peso: 0.3 },
  { id: 2, nombre: 'ssd', descripcion: 'almacenamiento de estado solido', peso: 0.2 },
  { id: 3, nombre: 'cpu', descripcion: 'velocidad del procesador', peso: 0.3 },
  { id: 4, nombre: 'tam pant', descripcion: 'tamaño de pantalla', peso: 0.1 },
  { id: 5, nombre: 'marca', descripcion: 'marca del equipo', peso: 0.1 }
].map((c) => ({ idproy: P1, ...c }));

// Calificación por alternativa, en el orden de los criterios (ram, ssd, cpu, pantalla, marca).
const valoraciones: Record<number, number[]> = {
  1: [8, 7, 9, 3, 1], // acer
  2: [6, 9, 5, 4, 3], // hp
  3: [7, 8, 4, 6, 2] // lenovo
};

const matrizP1 = Object.entries(valoraciones).flatMap(([idalt, valores]) =>
  valores.map((valor, i) => ({ idproy: P1, idalt: Number(idalt), idcrit: i + 1, valor }))
);

const chatP1 = [
  { idtopico: 1, idusuario: 1, id: 1, hora: '08:00:00', mensaje: 'hola a todos' },
  { idtopico: 1, idusuario: 2, id: 2, hora: '08:01:00', mensaje: 'hola' },
  { idtopico: 1, idusuario: 3, id: 3, hora: '08:02:00', mensaje: 'hola' },
  { idtopico: 1, idusuario: 4, id: 4, hora: '08:02:00', mensaje: 'buen día' },
  {
    idtopico: 1,
    idusuario: 1,
    id: 5,
    hora: '08:03:00',
    mensaje: 'el objetivo de este proyecto es elegir la mejor laptop para el departamento'
  },
  { idtopico: 1, idusuario: 2, id: 6, hora: '08:04:00', mensaje: 'enterado' },
  { idtopico: 1, idusuario: 3, id: 7, hora: '08:04:00', mensaje: 'enterado' },
  { idtopico: 1, idusuario: 4, id: 8, hora: '08:05:00', mensaje: 'enterado' }
].map((m) => ({ idproy: P1, fecha: '2026-01-01', ...m }));

const laptop = (marca: string) => `laptop ${marca} para el departamento`;

// Lluvia de ideas de alternativas (tópico 2).
const ideasAlternativasP1 = [
  { idusuario: 2, id: 1, nombre: 'lenovo', objetivo: laptop('lenovo') },
  { idusuario: 2, id: 2, nombre: 'hp', objetivo: laptop('hp') },
  { idusuario: 2, id: 3, nombre: 'toshiba', objetivo: laptop('toshiba') },
  { idusuario: 3, id: 1, nombre: 'lenovo', objetivo: laptop('lenovo') },
  { idusuario: 3, id: 2, nombre: 'sony', objetivo: laptop('sony') },
  { idusuario: 3, id: 3, nombre: 'toshiba', objetivo: laptop('toshiba') },
  { idusuario: 4, id: 1, nombre: 'acer', objetivo: laptop('acer') },
  { idusuario: 4, id: 2, nombre: 'hp', objetivo: laptop('hp') }
].map((i) => ({ idproy: P1, idtopico: 2, ...i }));

// Lluvia de ideas de criterios (tópico 6).
const ideasCriteriosP1 = [
  { idusuario: 2, id: 1, nombre: 'ram', objetivo: 'memoria ram del equipo' },
  { idusuario: 2, id: 2, nombre: 'ssd', objetivo: 'almacenamiento de estado solido' },
  { idusuario: 3, id: 1, nombre: 'cpu', objetivo: 'velocidad del procesador' },
  { idusuario: 3, id: 2, nombre: 'tam pant', objetivo: 'tamaño de pantalla' },
  { idusuario: 4, id: 1, nombre: 'marca', objetivo: 'marca del equipo' },
  { idusuario: 4, id: 2, nombre: 'ram', objetivo: 'memoria ram del equipo' }
].map((i) => ({ idproy: P1, idtopico: 6, ...i }));

// Categorías (el id es único dentro del proyecto; idtopico es el tópico categorizador).
const categoriasP1 = [
  { id: 1, idtopico: 3, nombre: 'lenovo' },
  { id: 2, idtopico: 3, nombre: 'hp' },
  { id: 3, idtopico: 3, nombre: 'toshiba' },
  { id: 4, idtopico: 3, nombre: 'sony' },
  { id: 5, idtopico: 3, nombre: 'acer' },
  { id: 6, idtopico: 7, nombre: 'ram' },
  { id: 7, idtopico: 7, nombre: 'ssd' },
  { id: 8, idtopico: 7, nombre: 'cpu' },
  { id: 9, idtopico: 7, nombre: 'tam pant' },
  { id: 10, idtopico: 7, nombre: 'marca' }
].map((c) => ({ idproy: P1, ...c }));

// Asignación de cada idea (idtopico de origen, idusuario, ididea) a su categoría.
const detalleP1 = [
  // alternativas (ideas del tópico 2)
  { idcat: 1, idtopico: 2, idusuario: 2, ididea: 1 },
  { idcat: 2, idtopico: 2, idusuario: 2, ididea: 2 },
  { idcat: 3, idtopico: 2, idusuario: 2, ididea: 3 },
  { idcat: 1, idtopico: 2, idusuario: 3, ididea: 1 },
  { idcat: 4, idtopico: 2, idusuario: 3, ididea: 2 },
  { idcat: 3, idtopico: 2, idusuario: 3, ididea: 3 },
  { idcat: 5, idtopico: 2, idusuario: 4, ididea: 1 },
  { idcat: 2, idtopico: 2, idusuario: 4, ididea: 2 },
  // criterios (ideas del tópico 6)
  { idcat: 6, idtopico: 6, idusuario: 2, ididea: 1 },
  { idcat: 7, idtopico: 6, idusuario: 2, ididea: 2 },
  { idcat: 8, idtopico: 6, idusuario: 3, ididea: 1 },
  { idcat: 9, idtopico: 6, idusuario: 3, ididea: 2 },
  { idcat: 10, idtopico: 6, idusuario: 4, ididea: 1 },
  { idcat: 6, idtopico: 6, idusuario: 4, ididea: 2 }
].map((d) => ({ idproy: P1, ...d }));

// Un comentario y un voto por decisor en cada categoría. Cada fila es una
// categoría (1 a 10) y cada columna un decisor, en el orden de DECISORES_P1.
const comentariosP1: string[][] = [
  ['está todo bien', 'me parece bien', 'de acuerdo'], // lenovo
  ['estoy de acuerdo', 'ok', 'buena opción'], // hp
  ['muy bien', 'está bien', 'sin comentarios'], // toshiba
  ['coincido', 'es correcto', 'poco relevante'], // sony
  ['buena marca', 'sí, incluirla', 'estoy de acuerdo'], // acer
  ['indispensable', 'importa mucho', 'de acuerdo'], // ram
  ['muy útil', 'necesario', 'está bien'], // ssd
  ['el más importante', 'sin duda', 'de acuerdo'], // cpu
  ['poco importante', 'puede ayudar', 'secundario'], // tam pant
  ['no es técnico', 'no pesa mucho', 'secundario'] // marca
];

const votosP1: number[][] = [
  [60, 75, 70], // lenovo
  [30, 40, 35], // hp
  [80, 90, 85], // toshiba
  [100, 100, 95], // sony
  [70, 65, 80], // acer
  [90, 85, 95], // ram
  [75, 80, 70], // ssd
  [95, 100, 90], // cpu
  [40, 35, 45], // tam pant
  [20, 30, 25] // marca
];

const comentariosFilasP1 = comentariosP1.flatMap((textos, i) =>
  DECISORES_P1.map((idusuario, j) => ({
    idproy: P1,
    idcat: i + 1,
    idusuario,
    comentario: textos[j]!
  }))
);

const votosFilasP1 = votosP1.flatMap((votos, i) =>
  DECISORES_P1.map((idusuario, j) => ({
    idproy: P1,
    idcat: i + 1,
    idusuario,
    voto: votos[j]!
  }))
);

// ---------------------------------------------------------------------------
// Proyecto 2 "servidores del laboratorio": ACTIVO, a medio camino. Hay ideas
// de alternativas, dos categorías con asignaciones parciales y dos ideas sin
// categorizar. Facilitadora: Sofía. Juan participa aquí como DECISOR, para
// probar la vista de solo lectura del categorizador.
// ---------------------------------------------------------------------------
const P2 = 2;

const agendaP2 = [
  { id: 1, topico: 'primer contacto', rol: 'FAC, DEC', idtool: TOOL.CHAT },
  { id: 2, topico: 'definir ideas de alternativas', rol: 'DEC', idtool: TOOL.LLUVIA_IDEAS },
  { id: 3, topico: 'categorizar ideas de alternativas', rol: 'FAC', idtool: TOOL.CATEGORIZADOR },
  { id: 4, topico: 'comentar ideas de alternativas', rol: 'DEC', idtool: TOOL.COMENTADOR },
  { id: 5, topico: 'votar ideas de alternativas', rol: 'DEC', idtool: TOOL.VOTACION }
].map((t) => ({ idproy: P2, ...t }));

const chatP2 = [
  { idusuario: 6, id: 1, hora: '09:00:00', mensaje: 'bienvenidos al proyecto de servidores' },
  { idusuario: 1, id: 2, hora: '09:01:00', mensaje: 'hola' },
  { idusuario: 3, id: 3, hora: '09:02:00', mensaje: 'listo para empezar' },
  { idusuario: 5, id: 4, hora: '09:03:00', mensaje: 'hola a todos' }
].map((m) => ({ idproy: P2, idtopico: 1, fecha: '2026-03-02', ...m }));

const servidor = (marca: string) => `servidor ${marca} para el laboratorio`;

const ideasP2 = [
  { idusuario: 1, id: 1, nombre: 'dell', objetivo: servidor('dell') },
  { idusuario: 1, id: 2, nombre: 'supermicro', objetivo: servidor('supermicro') },
  { idusuario: 3, id: 1, nombre: 'dell', objetivo: servidor('dell') },
  { idusuario: 3, id: 2, nombre: 'hpe', objetivo: servidor('hpe') },
  { idusuario: 5, id: 1, nombre: 'lenovo', objetivo: servidor('lenovo') },
  { idusuario: 5, id: 2, nombre: 'hpe', objetivo: servidor('hpe') },
  { idusuario: 5, id: 3, nombre: 'dell', objetivo: servidor('dell') }
].map((i) => ({ idproy: P2, idtopico: 2, ...i }));

const categoriasP2 = [
  { id: 1, idtopico: 3, nombre: 'dell' },
  { id: 2, idtopico: 3, nombre: 'hpe' }
].map((c) => ({ idproy: P2, ...c }));

// Sin categorizar: supermicro (Juan, idea 2) y lenovo (Luis, idea 1).
const detalleP2 = [
  { idcat: 1, idtopico: 2, idusuario: 1, ididea: 1 },
  { idcat: 1, idtopico: 2, idusuario: 3, ididea: 1 },
  { idcat: 1, idtopico: 2, idusuario: 5, ididea: 3 },
  { idcat: 2, idtopico: 2, idusuario: 3, ididea: 2 },
  { idcat: 2, idtopico: 2, idusuario: 5, ididea: 2 }
].map((d) => ({ idproy: P2, ...d }));

// ---------------------------------------------------------------------------

async function main() {
  const args = new Set(process.argv.slice(2));

  console.log(`Destino: ${env.DB_HOST}:${env.DB_PORT} / base "${env.DB_NAME}"`);

  if (env.NODE_ENV === 'production' && !args.has('--force')) {
    console.error('NODE_ENV=production: el seed se rehúsa a borrar datos (usa --force si es intencional).');
    process.exitCode = 1;
    return;
  }

  if (!args.has('--yes')) {
    console.error('Este script BORRA todos los datos de esa base y los reemplaza por los de prueba.');
    console.error('Si es lo que quieres, ejecútalo de nuevo con: npm run seed -- --yes');
    process.exitCode = 1;
    return;
  }

  // El hash se calcula antes de abrir la transacción (es trabajo de CPU, no de BD).
  const usuariosConHash = await Promise.all(
    datosUsuarios.map(async (usuario) => ({ ...usuario, passw: await hashPassword(usuario.passw) }))
  );

  await db.transaction(async (tx) => {
    // Borrado en orden inverso a las dependencias (hijos primero).
    await tx.delete(voting);
    await tx.delete(comenter);
    await tx.delete(categorizerDet);
    await tx.delete(categorizer);
    await tx.delete(brainstorming);
    await tx.delete(chat);
    await tx.delete(agenda);
    await tx.delete(tools);
    await tx.delete(matrizValuada);
    await tx.delete(criterios);
    await tx.delete(alternativas);
    await tx.delete(proyectosUsuarios);
    await tx.delete(proyectos);
    await tx.delete(usuarios);

    await tx.insert(usuarios).values(usuariosConHash);

    await tx.insert(proyectos).values([
      {
        id: P1,
        nombre: 'laptops',
        objetivo: 'elegir la mejor laptop para el departamento',
        fechainicio: '2026-01-01',
        fechafin: '2026-01-30',
        estatus: 2
      },
      {
        id: P2,
        nombre: 'servidores del laboratorio',
        objetivo: 'elegir el servidor para el laboratorio de cómputo',
        fechainicio: '2026-03-02',
        fechafin: '2026-03-31',
        estatus: 1
      }
    ]);

    await tx.insert(proyectosUsuarios).values([
      { idproy: P1, idusu: 1, rol: 'FAC' },
      { idproy: P1, idusu: 2, rol: 'DEC' },
      { idproy: P1, idusu: 3, rol: 'DEC' },
      { idproy: P1, idusu: 4, rol: 'DEC' },
      { idproy: P2, idusu: 6, rol: 'FAC' },
      { idproy: P2, idusu: 1, rol: 'DEC' },
      { idproy: P2, idusu: 3, rol: 'DEC' },
      { idproy: P2, idusu: 5, rol: 'DEC' }
    ]);

    await tx.insert(alternativas).values(alternativasP1);
    await tx.insert(criterios).values(criteriosP1);
    await tx.insert(matrizValuada).values(matrizP1);

    await tx.insert(tools).values(datosTools);
    await tx.insert(agenda).values([...agendaP1, ...agendaP2]);
    await tx.insert(chat).values([...chatP1, ...chatP2]);
    await tx.insert(brainstorming).values([...ideasAlternativasP1, ...ideasCriteriosP1, ...ideasP2]);

    await tx.insert(categorizer).values([...categoriasP1, ...categoriasP2]);
    await tx.insert(categorizerDet).values([...detalleP1, ...detalleP2]);
    await tx.insert(comenter).values(comentariosFilasP1);
    await tx.insert(voting).values(votosFilasP1);
  });

  console.log('Seed cargado:');
  console.log(`  usuarios ................ ${datosUsuarios.length}`);
  console.log('  proyectos ............... 2 (laptops cerrado, servidores activo)');
  console.log(`  agenda .................. ${agendaP1.length + agendaP2.length}`);
  console.log(`  chat .................... ${chatP1.length + chatP2.length}`);
  console.log(
    `  brainstorming ........... ${ideasAlternativasP1.length + ideasCriteriosP1.length + ideasP2.length}`
  );
  console.log(`  categorizer ............. ${categoriasP1.length + categoriasP2.length}`);
  console.log(`  categorizerdet .......... ${detalleP1.length + detalleP2.length}`);
  console.log(`  comenter ................ ${comentariosFilasP1.length}`);
  console.log(`  voting .................. ${votosFilasP1.length}`);
  console.log('  Ranking esperado de "laptops": 1° acer (6.9), 2° hp (5.8), 3° lenovo (5.7)');
}

main()
  .catch((error) => {
    console.error('El seed falló (no se aplicó ningún cambio):', error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
