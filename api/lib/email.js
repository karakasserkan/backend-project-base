const sgMail = require("@sendgrid/mail");
const config = require("../config");

sgMail.setApiKey(config.SENDGRID_API_KEY);

class EmailService {
  static async sendPasswordReset(to, resetToken) {
    const resetUrl = `${config.APP_URL}/api/users/reset-password?token=${resetToken}`;

    try {
      const result = await sgMail.send({
        to,
        from: config.SENDGRID_FROM_EMAIL,
        subject: "Şifre Sıfırlama",
        html: `<h2>Şifre Sıfırlama</h2>
        <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
        <a href="${resetUrl}">Şifremi Sıfırla</a>
        <p>Bu bağlantı 1 saat geçerlidir.</p>
        <p>Bu isteği siz yapmadıysanız bu emaili görmezden gelin.</p>`,
      });
      console.log("Email sent:", result[0].statusCode);
    } catch (err) {
      console.error("Email error:", err.response?.body || err.message);
    }
  }

  static async sendEmailVerification(to, verifyToken) {
    const verifyUrl = `${config.APP_URL}/api/users/verify-email?token=${verifyToken}`;

    await sgMail.send({
      to,
      from: config.SENDGRID_FROM_EMAIL,
      subject: "Email Doğrulama",
      html: `
        <h2>Email Doğrulama</h2>
        <p>Hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:</p>
        <a href="${verifyUrl}">Emailimi Doğrula</a>
        <p>Bu bağlantı 24 saat geçerlidir.</p>
      `,
    });
  }
}

module.exports = EmailService;
