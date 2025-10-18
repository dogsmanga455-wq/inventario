const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const auth = require('../middlewares/authMiddleware');

router.get('/ventas-producto', auth, reporteController.ventasPorProducto);
router.get('/ventas-filtradas',auth, reporteController.getVentasFiltradas);
router.get('/usuarios', reporteController.getUsuarios);
module.exports = router;
