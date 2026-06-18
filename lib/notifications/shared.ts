import { transporter } from "../mail";

// SMTP sender fallback simulation
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const fromEmail = process.env.SMTP_FROM || "ayokeloladiri@gmail.com";
    await transporter.sendMail({
      from: `"Kelola Diri Asisten" <${fromEmail}>`,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL] Berhasil mengirim email ke: ${to} | Subjek: ${subject}`);
    return true;
  } catch (error: any) {
    console.warn(`[EMAIL WARNING] Gagal mengirim email via SMTP. Menggunakan Fallback Console. Error: ${error?.message}`);
    console.log(`\n======================================================`);
    console.log(`[EMAIL SIMULATION] SENDING TO: ${to}`);
    console.log(`[SUBJECT]: ${subject}`);
    console.log(`------------------------------------------------------`);
    console.log(html.replace(/<[^>]*>/g, " ").trim().substring(0, 500) + "...");
    console.log(`======================================================\n`);
    return true; // Return true as simulation succeeded
  }
}

// Styling wrapper Neo-brutalist
export function neoBrutalistLayout(title: string, contentHtml: string, badgeText = "ASISTEN PERSONAL") {
  return `
    <div style="background-color: #f4f4f5; padding: 40px 20px; font-family: 'Courier New', Courier, monospace; color: #09090b; font-size: 14px; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 3px solid #09090b; padding: 30px; box-shadow: 8px 8px 0px 0px #09090b;">
        <!-- Header -->
        <div style="border-bottom: 3px solid #09090b; padding-bottom: 20px; margin-bottom: 25px;">
          <div style="display: inline-block; background-color: #a78bfa; color: #000000; font-size: 10px; font-weight: bold; border: 2px solid #09090b; padding: 4px 10px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 2px 2px 0px 0px #09090b;">
            ⚡ ${badgeText}
          </div>
          <h1 style="font-size: 26px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: -0.02em; color: #09090b;">
            ${title}
          </h1>
        </div>

        <!-- Content -->
        <div style="margin-bottom: 30px;">
          ${contentHtml}
        </div>

        <!-- Footer -->
        <div style="border-top: 3px solid #09090b; padding-top: 20px; font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">
          <p style="margin: 0 0 5px 0;">Kelola Diri — Personal Management Platform</p>
          <p style="margin: 0; font-size: 10px;">Kamu menerima email ini berdasarkan pengaturan preferensi notifikasimu. Ubah di <a href="${process.env.NEXTAUTH_URL}/dashboard/settings" style="color: #a78bfa; text-decoration: underline;">Pengaturan Akun</a>.</p>
        </div>
      </div>
    </div>
  `;
}

// Rupiah Helper
export function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}
