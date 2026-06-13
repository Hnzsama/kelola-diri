import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const confirmLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
  
  await transporter.sendMail({
    from: `"Kelola Diri" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: "Verifikasi Email Anda - Kelola Diri",
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Halo!</h2>
        <p>Terima kasih telah mendaftar di <strong>Kelola Diri</strong>.</p>
        <p>Silakan klik tautan di bawah ini untuk memverifikasi alamat email Anda agar dapat mulai masuk ke aplikasi:</p>
        <div style="margin: 20px 0;">
          <a href="${confirmLink}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Verifikasi Email Saya
          </a>
        </div>
        <p>Jika tombol di atas tidak berfungsi, salin dan tempel URL berikut ke peramban (browser) Anda:</p>
        <p><a href="${confirmLink}">${confirmLink}</a></p>
        <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">Jika Anda tidak mendaftar di aplikasi Kelola Diri, abaikan saja email ini.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  
  await transporter.sendMail({
    from: `"Kelola Diri" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: "Atur Ulang Kata Sandi Anda - Kelola Diri",
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Permintaan Atur Ulang Kata Sandi</h2>
        <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun <strong>Kelola Diri</strong> Anda.</p>
        <p>Silakan klik tautan di bawah ini untuk mengatur kata sandi baru (tautan ini berlaku selama 1 jam):</p>
        <div style="margin: 20px 0;">
          <a href="${resetLink}" style="background-color: #ff4081; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Atur Ulang Kata Sandi
          </a>
        </div>
        <p>Jika tombol di atas tidak berfungsi, salin dan tempel URL berikut ke peramban (browser) Anda:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">Jika Anda tidak meminta pengaturan ulang kata sandi ini, silakan abaikan email ini secara aman.</p>
      </div>
    `,
  });
}
