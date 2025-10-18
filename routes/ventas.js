const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const auth = require('../middlewares/authMiddleware');

router.post('/', auth, ventaController.createVenta);

module.exports = router;
