const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const SECRET = process.env.JWT_SECRET; // cambiar por variable de entorno en producción
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

const { sendVerificationCode } = require('../utils/email');

exports.login = async (req, res) => {
  const { usuario, contrasena } = req.body;
  console.log("🟢 Datos recibidos del frontend:", req.body);

  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
    console.log("🟢 Resultado SQL:", rows);

    if (rows.length === 0)
      return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });

    const user = rows[0];

    // 🔒 1. Verificar bloqueo
    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
      const minutosRestantes = Math.ceil(
        (new Date(user.bloqueado_hasta) - new Date()) / 60000
      );
      return res.status(403).json({
        error: `Cuenta bloqueada. Intenta en ${minutosRestantes} minuto(s).`,
      });
    }

    // 🔐 2. Verificar contraseña
    const match = await bcrypt.compare(contrasena, user.contrasena);
    console.log("🧩 Resultado comparación:", match);
    if (!match) {
      const nuevosIntentos = (user.intentos_fallidos || 0) + 1;

      if (nuevosIntentos >= 3) {
        const bloqueadoHasta = new Date(Date.now() + 5 * 60 * 1000);
        await db.query(
          'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = ? WHERE id = ?',
          [bloqueadoHasta, user.id]
        );
        return res.status(403).json({
          error: 'Cuenta bloqueada 5 minutos por múltiples intentos fallidos.',
        });
      } else {
        await db.query(
          'UPDATE usuarios SET intentos_fallidos = ? WHERE id = ?',
          [nuevosIntentos, user.id]
        );
        return res.status(400).json({ error: 'Usuario o contraseña incorrectos.' });
      }
    }

    // ✅ 3. Limpiar bloqueos e intentos
    await db.query(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?',
      [user.id]
    );

    // 📩 4. Generar y enviar código de verificación
    const code = Math.floor(100000 + Math.random() * 900000); // 6 dígitos
    await db.query(
      'UPDATE usuarios SET codigo_verificacion = ?, codigo_expira = NOW() + INTERVAL 5 MINUTE WHERE id = ?',
      [String(code), user.id]
    );

    await sendVerificationCode(user.correo, code);

    console.log("📧 Código enviado a:", user.correo);

    // 🔹 No generamos token todavía
    res.json({
      step: 'verify',
      message: 'Código enviado al correo electrónico',
      userId: user.id,
    });

  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

exports.verifyCode = async (req, res) => {
  const { userId, code } = req.body;
  const codeStr = String(code);
  try {
    const [rows] = await db.query(
  'SELECT * FROM usuarios WHERE id = ? AND codigo_verificacion = ? AND codigo_expira > NOW()',
  [userId, codeStr]
);
console.log("🟣 Verificando código", codeStr, "para usuario ID:", userId);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    const user = rows[0];

    // Limpia el código
    await db.query(
      'UPDATE usuarios SET codigo_verificacion = NULL, codigo_expira = NULL WHERE id = ?',
      [userId]
    );

    // Genera token JWT
    const token = jwt.sign({ id: user.id, rol: user.rol }, SECRET, {
      expiresIn: '1h',
    });

    res.json({ success: true, token, usuario: user.usuario, rol: user.rol });
  } catch (error) {
    console.error('Error en verificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
