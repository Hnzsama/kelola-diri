import prisma from "../prisma";
import { sendEmail, neoBrutalistLayout } from "./shared";

export async function sendTestDemoEmail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.email) throw new Error("Pengguna tidak ditemukan");

  const bodyHtml = `
    <p style="font-size: 16px; font-weight: bold; margin-top: 0;">⚡ Selamat Malam, Kak! Selamat datang kembali di pusat kendali harian Anda. Mari kelola hari ini dengan disiplin.</p>
    <p>Ini adalah email uji coba dari **Asisten Personal Kelola Diri**. Format tulisan ini memakai gaya bahasa yang "Gen-Z" able biar gak terlalu kaku kayak surat dinas kenegaraan! 😎🔥</p>
    
    <div style="border: 2px solid #09090b; padding: 15px; background-color: #fef08a; box-shadow: 4px 4px 0px 0px #09090b; margin: 20px 0;">
      <h4 style="margin: 0 0 5px 0; text-transform: uppercase;">🔥 Streak Checker</h4>
      <p style="margin: 0;"><strong>Habit "Belajar React":</strong> Streak 18 Hari! Jangan mager buat lanjutin entar malam ya, bestie! 🚀</p>
    </div>

    <div style="border: 2px solid #09090b; padding: 15px; background-color: #f3e8ff; box-shadow: 4px 4px 0px 0px #09090b; margin: 20px 0;">
      <h4 style="margin: 0 0 5px 0; text-transform: uppercase;">💸 Budget Warning (82%)</h4>
      <p style="margin: 0;"><strong>Makan:</strong> Rp574.000 / Rp700.000. Jajannya dikurangi dulu ya, ntar makan mie instan akhir bulan! 🍜</p>
    </div>

    <p>Semua sistem bekerja dengan aman, data preferensi kamu bisa diatur langsung di halaman Pengaturan. Keep active and productive! 🚀✨</p>
  `;

  const html = neoBrutalistLayout("Demo Asisten Kelola Diri", bodyHtml, "UJI COBA SISTEM");
  await sendEmail(user.email, "⚡ Uji Coba Asisten Personal - Kelola Diri", html);

  const secondaryEmails = await prisma.secondaryEmail.findMany({
    where: { userId },
  });
  for (const sec of secondaryEmails) {
    await sendEmail(sec.email, `⚡ Uji Coba Asisten Personal (${user.name || "User"}) - Kelola Diri`, html);
  }
  return true;
}
