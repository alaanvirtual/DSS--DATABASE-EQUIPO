const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/proyectos — Lista todos los proyectos (endpoint de ejemplo)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM proyectos');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/proyectos/:id/scoring — Calcula el ranking multicriterio del proyecto
router.get('/:id/scoring', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT 
         alt.id AS id_alternativa,
         alt.nombre AS alternativa,
         alt.descripcion,
         ROUND(SUM(mv.valor * cp.peso), 4) AS puntaje_scoring_total
       FROM matriz_valuada mv
       INNER JOIN alternativas alt ON mv.idproy = alt.idproy AND mv.idalt = alt.id
       INNER JOIN criterios_pesos cp ON mv.idproy = cp.idproy AND mv.idcrit = cp.id
       WHERE mv.idproy = ?
       GROUP BY alt.id, alt.nombre, alt.descripcion
       ORDER BY puntaje_scoring_total DESC`,
      [id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
