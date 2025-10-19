const db = require('../db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM productos');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM productos WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { nombre, descripcion, precio, stock } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?)',
      [nombre, descripcion, precio, stock]
    );
    res.json({ id: result.insertId, nombre, descripcion, precio, stock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock } = req.body;
  try {
    await db.query(
      'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ? WHERE id = ?',
      [nombre, descripcion, precio, stock, id]
    );
    res.json({ id, nombre, descripcion, precio, stock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  console.log('🟡 Intentando eliminar producto con id:', id);
  try {
    await db.query('DELETE FROM productos WHERE id = ?', [id]);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    console.error('❌ Error en delete:', err.message);
    res.status(500).json({ error: err.message });
  }
};
