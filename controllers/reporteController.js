const db = require('../db');

exports.ventasPorProducto = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.nombre, SUM(dv.cantidad) AS cantidad_vendida, SUM(dv.subtotal) AS total_vendido
      FROM detalle_ventas dv
      JOIN productos p ON dv.id_producto = p.id
      GROUP BY p.id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getVentasFiltradas = async (req, res) => {
  const { fechaInicio, fechaFin, id_usuario } = req.query;

  try {
    let query = `
      SELECT 
        p.nombre AS producto,
        SUM(dv.cantidad) AS cantidad_vendida,
        SUM(dv.subtotal) AS total_vendido
      FROM detalle_ventas dv
      INNER JOIN productos p ON dv.id_producto = p.id
      INNER JOIN ventas v ON dv.id_venta = v.id
      INNER JOIN usuarios u ON v.id_usuario = u.id
      WHERE 1 = 1
    `;
    const params = [];

    if (fechaInicio) {
      query += ' AND DATE(v.fecha) >= ?';
      params.push(fechaInicio);
    }

    if (fechaFin) {
      query += ' AND DATE(v.fecha) <= ?';
      params.push(fechaFin);
    }

    if (id_usuario) {
      query += ' AND v.id_usuario = ?';
      params.push(id_usuario);
    }

    query += `
      GROUP BY p.nombre
      ORDER BY total_vendido DESC
    `;

    const [rows] = await db.query(query, params);
    console.log(rows)
    res.json(rows);
  } catch (err) {
    console.error('Error en getVentasFiltradas:', err);
    res.status(500).json({ error: 'Error al obtener reporte de ventas' });
  }
};

// Lista de usuarios (para el filtro del dashboard)
exports.getUsuarios = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombre FROM usuarios');
    res.json(rows);
  } catch (err) {
    console.error('Error en getUsuarios:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};