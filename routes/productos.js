const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const auth = require('../middlewares/authMiddleware');

router.get('/', auth, productoController.getAll);
router.get('/:id', auth, productoController.getById);
router.post('/', auth, productoController.create);
router.put('/:id', auth, productoController.update);
router.delete('/:id', auth, productoController.delete);

module.exports = router;
