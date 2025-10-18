const jwt = require('jsonwebtoken');
const SECRET = 'mi_secreto_123';

module.exports = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Acceso denegado' });

  try {
    const decoded = jwt.verify(token.split(' ')[1], SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};
