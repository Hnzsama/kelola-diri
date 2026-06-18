import prisma from "../prisma";
import { sendEmail, neoBrutalistLayout } from "./shared";

// DAILY HABIT REMINDER (21:00)
export async function runDailyHabitsReminder() {
  const users = await prisma.user.findMany({
    include: { notificationPreference: true },
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const todayDate = new Date(todayStr);

  for (const user of users) {
    if (!user.email) continue;
    const pref = user.notificationPreference;
    if (pref && !pref.habitReminder) continue;

    // Get active habits
    const habits = await prisma.habit.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        logs: {
          where: { date: todayDate },
        },
      },
    });

    const pendingHabits = habits.filter((h) => h.logs.length === 0 || !h.logs[0].completed);

    if (pendingHabits.length === 0) continue;

    const listHtml = pendingHabits
      .map(
        (h) => `
        <li style="margin-bottom: 10px; font-weight: bold; padding: 8px; border: 2px solid #09090b; background-color: #ffe4e6; box-shadow: 2px 2px 0px 0px #09090b;">
          ❌ ${h.name}
        </li>
      `
      )
      .join("");

    const bodyHtml = `
      <p style="font-size: 16px; font-weight: bold; margin-top: 0;">Hai Bestie! 👀 Malam makin larut nih, tapi habit hari ini belum kelar semua.</p>
      <p>Berikut kebiasaan yang belum kamu centang hari ini:</p>
      <ul style="list-style: none; padding: 0; margin: 20px 0;">
        ${listHtml}
      </ul>
      <p>Masih ada waktu sebelum hari berganti! Yuk luangkan 5-10 menit buat kelarinin biar streak-mu tetap berkibar bebas tanpa putus! Semangat! 🔥</p>
    `;

    const html = neoBrutalistLayout("🔥 Habit Hari Ini", bodyHtml, "REMINDER HABIT");
    await sendEmail(user.email, "🔥 Habit Reminder - Kelola Diri", html);

    // Kirim ke email sekunder yang didaftarkan (jika ada & aktif)
    const secondaryEmails = await prisma.secondaryEmail.findMany({
      where: { userId: user.id, habitReminder: true },
    });
    for (const sec of secondaryEmails) {
      await sendEmail(sec.email, `🔥 Habit Reminder (${user.name || "User"}) - Kelola Diri`, html);
    }
  }
}
