const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = 'mi_secreto_123'; // cambiar por variable de entorno en producción
// 🔐 Función para validar contraseña
const validarContrasena = (password) => {
  // Al menos 8 caracteres, al menos 1 mayúscula y 1 minúscula
  // Puedes agregar número y caracter especial si quieres: (?=.*\d)(?=.*[\W_])
  const regex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  return regex.test(password);
};

exports.register = async (req, res) => {
  const { nombre, usuario, contrasena, rol } = req.body;

  // 1️⃣ Validar contraseña
  if (!validarContrasena(contrasena)) {
    return res.status(400).json({
      error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula y una minúscula.'
    });
  }

  try {
    // 2️⃣ Hashear contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // 3️⃣ Insertar usuario en DB
    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, usuario, contrasena, rol, intentos_fallidos, bloqueado_hasta) VALUES (?, ?, ?, ?, 0, NULL)',
      [nombre, usuario, hashedPassword, rol || 'vendedor']
    );

    res.json({ id: result.insertId, nombre, usuario, rol });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

exports.login = async (req, res) => {
  const { usuario, contrasena } = req.body;
console.log("🟢 Datos recibidos del frontend:", req.body);
  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
     console.log("🟢 Resultado SQL:", rows);
    if (rows.length === 0)
      return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });

    const user = rows[0];

    // 🧱 1. Verificar si está bloqueado (solo si bloqueado_hasta no es null)
    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
      const minutosRestantes = Math.ceil(
        (new Date(user.bloqueado_hasta) - new Date()) / 60000
      );
      return res.status(403).json({
        error: `Cuenta bloqueada. Intenta de nuevo en ${minutosRestantes} minuto(s).`,
      });
    }

    // 🔐 2. Comparar contraseñas
    console.log("🟡 Contraseña recibida:", contrasena);
    console.log("🟡 Hash en BD:", user.contrasena);
    const match = await bcrypt.compare(contrasena, user.contrasena);
    bcrypt.hash('admin123', 10).then(console.log);
    console.log("🧩 Resultado comparación:", match);
    if (!match) {
      const nuevosIntentos = (user.intentos_fallidos || 0) + 1;

      if (nuevosIntentos >= 3) {
        const bloqueadoHasta = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
        await db.query(
          'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = ? WHERE id = ?',
          [bloqueadoHasta, user.id]
        );
        return res.status(403).json({
          error:
            'Cuenta bloqueada por 5 minutos debido a múltiples intentos fallidos.',
        });
      } else {
        await db.query(
          'UPDATE usuarios SET intentos_fallidos = ? WHERE id = ?',
          [nuevosIntentos, user.id]
        );
        return res
          .status(400)
          .json({ error: 'Usuario o contraseña incorrectos.' });
      }
    }

    // ✅ 3. Si la contraseña es correcta → limpiar intentos y desbloquear
    await db.query(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?',
      [user.id]
    );

    // 🪪 4. Crear token
    const token = jwt.sign({ id: user.id, rol: user.rol }, SECRET, {
      expiresIn: '1h',
    });

    res.json({ token, usuario: user.usuario, rol: user.rol });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};