const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/health — Verifica que el servidor y la BD en TiDB Cloud respondan
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SHOW TABLES');
    res.json({
      status: 'ok',
      database: process.env.DB_NAME || 'dss_sadmg',
      tables_count: rows.length
    });
  } catch (error) {
    console.error('Error conectando a la BD:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'No se pudo conectar a la base de datos',
      error: error.message
    });
  }
});

module.exports = router;
