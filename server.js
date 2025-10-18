

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productoRoutes = require('./routes/productos');
const ventaRoutes = require('./routes/ventas');
const reporteRoutes = require('./routes/reportes');
const empleadosRoutes = require('./routes/empleados');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Rutas
app.use('/auth', authRoutes);
app.use('/productos', productoRoutes);
app.use('/ventas', ventaRoutes);
app.use('/reportes', reporteRoutes);
app.use('/empleados', empleadosRoutes);

app.get('/', (req, res) => {
  res.send('✅ Backend del sistema de inventario funcionando correctamente');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
