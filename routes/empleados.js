const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController');
const auth = require('../middlewares/authMiddleware');

// Listar empleados
router.get('/', auth, empleadoController.getAll);

// Crear empleado
router.post('/', auth, empleadoController.create);

// Actualizar empleado
router.put('/:id', auth, empleadoController.update);

// Eliminar empleado
router.delete('/:id', auth, empleadoController.delete);

module.exports = router;
