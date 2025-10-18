const db = require('../db');
const bcrypt = require('bcryptjs');

// Validar contraseña: al menos 8 caracteres, 1 mayúscula y 1 minúscula
const validarContrasena = (password) => /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(password);

exports.getAll = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    const [rows] = await db.query("SELECT id, nombre, usuario, rol FROM usuarios WHERE rol != 'admin'");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cargar empleados' });
  }
};

exports.create = async (req, res) => {
  if (req.user.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

  const { nombre, usuario, contrasena, rol } = req.body;

  if (!validarContrasena(contrasena)) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula y una minúscula.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const [result] = await db.query(
      "INSERT INTO usuarios (nombre, usuario, contrasena, rol, intentos_fallidos, bloqueado_hasta) VALUES (?, ?, ?, ?, 0, NULL)",
      [nombre, usuario, hashedPassword, rol || 'vendedor']
    );
    res.json({ id: result.insertId, nombre, usuario, rol });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear empleado' });
  }
};

exports.update = async (req, res) => {
  if (req.user.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

  const { id } = req.params;
  const { nombre, usuario, contrasena, rol } = req.body;

  try {
    let query = "UPDATE usuarios SET nombre = ?, usuario = ?, rol = ? WHERE id = ?";
    let params = [nombre, usuario, rol, id];

    // Si envían contraseña nueva, validarla y hashearla
    if (contrasena) {
      if (!validarContrasena(contrasena)) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula y una minúscula.' });
      }
      const hashedPassword = await bcrypt.hash(contrasena, 10);
      query = "UPDATE usuarios SET nombre = ?, usuario = ?, rol = ?, contrasena = ? WHERE id = ?";
      params = [nombre, usuario, rol, hashedPassword, id];
    }

    await db.query(query, params);
    res.json({ id, nombre, usuario, rol });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar empleado' });
  }
};

exports.delete = async (req, res) => {
  if (req.user.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

  const { id } = req.params;
  try {
    await db.query("DELETE FROM usuarios WHERE id = ?", [id]);
    res.json({ message: 'Empleado eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar empleado' });
  }
};
