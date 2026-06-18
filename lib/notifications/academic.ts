import prisma from "../prisma";
import { sendEmail, neoBrutalistLayout } from "./shared";

// DAILY ACADEMIC DEADLINES (19:00)
export async function runDailyAcademicDeadlines() {
  const users = await prisma.user.findMany({
    include: { notificationPreference: true },
  });

  const tomorrowStart = new Date();
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date();
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  tomorrowEnd.setHours(23, 59, 59, 999);

  for (const user of users) {
    if (!user.email) continue;
    const pref = user.notificationPreference;
    if (pref && !pref.deadlineTugas) continue; // Opted out

    // Find assignments due tomorrow
    const assignments = await prisma.assignment.findMany({
      where: {
        course: { userId: user.id },
        dueDate: { gte: tomorrowStart, lte: tomorrowEnd },
        status: { not: "DONE" },
      },
      include: { course: true },
    });

    if (assignments.length === 0) continue;

    const listHtml = assignments
      .map(
        (asg) => `
        <li style="margin-bottom: 12px; padding: 10px; border: 2px solid #09090b; background-color: #fcfcfc; box-shadow: 2px 2px 0px 0px #09090b;">
          <strong>📚 ${asg.title}</strong><br/>
          <span style="font-size: 11px; color: #666;">Matkul: ${asg.course.name} | Jam: ${asg.dueDate.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}</span>
        </li>
      `
      )
      .join("");

    const bodyHtml = `
      <p style="font-size: 16px; font-weight: bold; margin-top: 0;">Halo, Kak! Ini asisten harianmu. Ada tugas kuliah yang deadline-nya besok nih! 😱</p>
      <ul style="list-style: none; padding: 0; margin: 20px 0;">
        ${listHtml}
      </ul>
      <p>Jangan sampai mepet-mepet ngerjainnya ya! Begadang boleh tapi jangan keseringan. Yuk kelola waktunya biar tidur malammu tetap nyenyak! 🚀✨</p>
    `;

    const html = neoBrutalistLayout("📚 Deadline Besok!", bodyHtml, "REMINDER AKADEMIK");
    await sendEmail(user.email, "📚 Deadline Besok - Kelola Diri", html);

    // Kirim ke email sekunder yang didaftarkan (jika ada & aktif)
    const secondaryEmails = await prisma.secondaryEmail.findMany({
      where: { userId: user.id, deadlineTugas: true },
    });
    for (const sec of secondaryEmails) {
      await sendEmail(sec.email, `📚 Deadline Besok (${user.name || "User"}) - Kelola Diri`, html);
    }
  }
}
