const db = require('../db');

exports.createVenta = async (req, res) => {
  const { productos } = req.body; // [{id_producto, cantidad}]
  const id_usuario = req.user.id;

  try {
    // Calcular total
    let total = 0;
    for (let p of productos) {
      const [rows] = await db.query('SELECT precio, stock FROM productos WHERE id = ?', [p.id_producto]);
      if (rows.length === 0) return res.status(400).json({ error: 'Producto no encontrado' });
      if (rows[0].stock < p.cantidad) return res.status(400).json({ error: 'Stock insuficiente' });
      total += rows[0].precio * p.cantidad;
    }

    // Crear venta
    const [ventaResult] = await db.query('INSERT INTO ventas (id_usuario, total) VALUES (?, ?)', [id_usuario, total]);
    const id_venta = ventaResult.insertId;

    // Insertar detalle_ventas y actualizar stock
    for (let p of productos) {
      const [rows] = await db.query('SELECT precio, stock FROM productos WHERE id = ?', [p.id_producto]);
      const subtotal = rows[0].precio * p.cantidad;

      await db.query(
        'INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, subtotal) VALUES (?, ?, ?, ?)',
        [id_venta, p.id_producto, p.cantidad, subtotal]
      );

      await db.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [p.cantidad, p.id_producto]);
    }

    res.json({ id_venta, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
