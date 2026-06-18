import prisma from "../prisma";
import { sendEmail, neoBrutalistLayout, formatRupiah } from "./shared";

// 1. GOAL STAGNATION CHECK (Daily/Weekly)
export async function runGoalStagnationCheck() {
  const users = await prisma.user.findMany({
    include: { notificationPreference: true },
  });

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  for (const user of users) {
    if (!user.email) continue;
    const pref = user.notificationPreference;
    if (pref && !pref.weeklyReview) continue; // Bind this to weeklyReview or default true

    // Find active goals
    const goals = await prisma.goal.findMany({
      where: {
        userId: user.id,
        status: "ACTIVE",
        createdAt: { lte: fourteenDaysAgo },
      },
      include: {
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const stagnantGoals = goals.filter((g) => {
      if (g.reviews.length === 0) return true;
      return g.reviews[0].createdAt < fourteenDaysAgo;
    });

    if (stagnantGoals.length === 0) continue;

    const listHtml = stagnantGoals
      .map(
        (g) => `
        <li style="margin-bottom: 12px; padding: 12px; border: 2px solid #09090b; background-color: #fffbeb; box-shadow: 2px 2px 0px 0px #09090b;">
          <strong>${g.emoji} ${g.title}</strong><br/>
          <span style="font-size: 11px; color: #666;">Progress saat ini: ${g.progress}% | Tidak ada update > 14 hari</span>
        </li>
      `
      )
      .join("");

    const bodyHtml = `
      <p style="font-size: 16px; font-weight: bold; margin-top: 0;">Puntiiing, Kak! 👀 Asisten di sini mendeteksi ada goal-mu yang "jalan di tempat" alias stagnan tanpa progres nih.</p>
      <p>Berikut goal yang perlu perhatian ekstra dari kamu:</p>
      <ul style="list-style: none; padding: 0; margin: 20px 0;">
        ${listHtml}
      </ul>
      <p>Mager sebentar wajar kok, tapi jangan sampai keterusan sampai impianmu berdebu ya! Yuk ambil langkah kecil hari ini buat mulai progresnya lagi! Kamu pasti bisa! 🔥🎯</p>
    `;

    const html = neoBrutalistLayout("🎯 Goal Perlu Perhatian!", bodyHtml, "WARNING LIFE GOAL");
    await sendEmail(user.email, "🎯 Goal Perlu Perhatian - Kelola Diri", html);

    // Kirim ke email sekunder yang didaftarkan (jika ada & aktif)
    const secondaryEmails = await prisma.secondaryEmail.findMany({
      where: { userId: user.id, weeklyReview: true },
    });
    for (const sec of secondaryEmails) {
      await sendEmail(sec.email, `🎯 Goal Perlu Perhatian (${user.name || "User"}) - Kelola Diri`, html);
    }
  }
}

// 2. WEEKLY LIFE REVIEW (Sunday night / Monday morning)
export async function runWeeklyLifeReview() {
  const users = await prisma.user.findMany({
    include: { notificationPreference: true },
  });

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  for (const user of users) {
    if (!user.email) continue;
    const pref = user.notificationPreference;
    if (pref && !pref.weeklyReview) continue;

    // 1. Academic: assignments due next week
    const upcomingAssignments = await prisma.assignment.count({
      where: {
        course: { userId: user.id },
        dueDate: { gte: new Date(), lte: nextWeek },
        status: { not: "DONE" },
      },
    });

    // 2. Organization: events next week
    const upcomingEvents = await prisma.organizationEvent.count({
      where: {
        userId: user.id,
        date: { gte: new Date(), lte: nextWeek },
      },
    });

    // 3. Habit Completion last 7 days
    const habits = await prisma.habit.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        logs: {
          where: {
            date: { gte: oneWeekAgo },
            completed: true,
          },
        },
      },
    });
    
    let totalLogsCount = 0;
    const totalPossibleLogs = habits.length * 7;
    habits.forEach((h) => {
      totalLogsCount += h.logs.length;
    });
    const habitCompletionRate = totalPossibleLogs > 0 ? Math.round((totalLogsCount / totalPossibleLogs) * 100) : 0;

    // 4. Finance: budget used this month
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const budgets = await prisma.budget.findMany({
      where: { userId: user.id, month: currentMonth, year: currentYear },
    });
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lte: new Date(currentYear, currentMonth, 0, 23, 59, 59),
        },
      },
    });
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const budgetUsagePct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    // 5. Goals: count and progress
    const activeGoals = await prisma.goal.findMany({
      where: { userId: user.id, status: "ACTIVE" },
    });
    const avgGoalProgress = activeGoals.length > 0
      ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length)
      : 0;

    const bodyHtml = `
      <p style="font-size: 16px; font-weight: bold; margin-top: 0;">☀️ Selamat Malam, Kak! Selamat datang kembali di pusat kendali harian Anda. Mari kelola minggu depan dengan penuh kedisiplinan dan semangat baru!</p>
      <p>Berikut adalah ringkasan status operasional hidupmu minggu lalu & rencana minggu depan:</p>

      <div style="display: grid; grid-template-cols: 1fr; gap: 15px; margin: 25px 0;">
        <div style="border: 2px solid #09090b; padding: 12px; background-color: #fdf2f8; box-shadow: 3px 3px 0px 0px #09090b;">
          <strong>📚 Akademik:</strong> ${upcomingAssignments} Deadline Tugas Minggu Ini
        </div>
        <div style="border: 2px solid #09090b; padding: 12px; background-color: #eff6ff; box-shadow: 3px 3px 0px 0px #09090b;">
          <strong>🏢 Organisasi:</strong> ${upcomingEvents} Agenda & Rapat Minggu Ini
        </div>
        <div style="border: 2px solid #09090b; padding: 12px; background-color: #ecfdf5; box-shadow: 3px 3px 0px 0px #09090b;">
          <strong>🔥 Habit Tracker:</strong> ${habitCompletionRate}% Rata-rata Penyelesaian
        </div>
        <div style="border: 2px solid #09090b; padding: 12px; background-color: #fffbeb; box-shadow: 3px 3px 0px 0px #09090b;">
          <strong>💸 Keuangan:</strong> ${budgetUsagePct}% Anggaran Terpakai Bulan Ini (${formatRupiah(totalSpent)} / ${formatRupiah(totalBudget)})
        </div>
        <div style="border: 2px solid #09090b; padding: 12px; background-color: #faf5ff; box-shadow: 3px 3px 0px 0px #09090b;">
          <strong>🎯 Life Goals:</strong> ${activeGoals.length} Goal Aktif (Rata-rata Progress ${avgGoalProgress}%)
        </div>
      </div>

      <p>Yuk kurangi mager dan tingkatkan disiplin! Atur fokus prioritas kamu dari sekarang biar minggu depan bisa dilewati dengan gacor! 🚀💪</p>
    `;

    const html = neoBrutalistLayout("☀️ Weekly Life Review", bodyHtml, "LIFE SUMMARY WEEKLY");
    await sendEmail(user.email, "☀️ Weekly Life Review - Kelola Diri", html);

    // Kirim ke email sekunder yang didaftarkan (jika ada & aktif)
    const secondaryEmails = await prisma.secondaryEmail.findMany({
      where: { userId: user.id, weeklyReview: true },
    });
    for (const sec of secondaryEmails) {
      await sendEmail(sec.email, `☀️ Weekly Life Review (${user.name || "User"}) - Kelola Diri`, html);
    }
  }
}
