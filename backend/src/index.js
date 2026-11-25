const express = require('express');
const cors = require('cors');
require('dotenv').config();

const healthRoutes = require('./routes/health');
const proyectosRoutes = require('./routes/proyectos');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'API SADMG / DSS funcionando',
    endpoints: ['/api/health', '/api/proyectos', '/api/proyectos/:id/scoring']
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/proyectos', proyectosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
