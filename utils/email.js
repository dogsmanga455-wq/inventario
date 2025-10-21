const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationCode(to, code) {
  try {
    console.log(`📨 Enviando correo a ${to} con código ${code}...`);

    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'inventario@resend.dev',
      to,
      subject: 'Código de verificación - Sistema de Inventario',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Verificación de inicio de sesión</h2>
          <p>Hola, este es tu código de verificación:</p>
          <h1 style="color:#4CAF50; font-size: 28px;">${code}</h1>
          <p>Este código expirará en 5 minutos.</p>
          <br/>
          <small>Enviado automáticamente por tu sistema de inventario</small>
        </div>
      `,
    });

    // Logs informativos
    if (response?.id) {
      console.log(`✅ Correo enviado correctamente a ${to} (ID: ${response.id})`);
    } else {
      console.warn(`⚠️ Resend no devolvió ID, posible error:`, response);
    }

  } catch (error) {
    console.error('❌ Error al enviar correo con Resend:', error);
  }
}

module.exports = { sendVerificationCode };
