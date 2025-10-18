// middlewares/roleMiddleware.js
module.exports = (rolesPermitidos) => {
  return (req, res, next) => {
    console.log('🟡 Usuario en req.user:', req.user); // 👈 esto te ayudará a depurar
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para acceder a esta sección.' });
    }
    next();
  };
};
