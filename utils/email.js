const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationCode(to, code) {
  try {
    await transporter.sendMail({
      from: `"Sistema de Inventario" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Código de verificación',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Verificación de inicio de sesión</h2>
          <p>Hola, este es tu código de verificación:</p>
          <h1 style="color:#4CAF50">${code}</h1>
          <p>Este código expirará en 5 minutos.</p>
        </div>
      `,
    });
    console.log(`✅ Código enviado correctamente a ${to}`);
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
  }
}

module.exports = { sendVerificationCode };
