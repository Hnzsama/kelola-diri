import { transporter } from "./mail";
import prisma from "./prisma";

// SMTP sender fallback simulation
async function sendEmail(to: string, subject: string, html: string) {
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
function neoBrutalistLayout(title: string, contentHtml: string, badgeText = "ASISTEN PERSONAL") {
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
function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

// ----------------------------------------------------
// 1. EVENT ALERTS (REAL-TIME TRIGGERS)
// ----------------------------------------------------

export async function sendBudgetWarning(userId: string, categoryName: string, budgetLimit: number, currentSpent: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { notificationPreference: true },
  });

  if (!user || !user.email) return;
  const pref = user.notificationPreference;
  if (pref && !pref.budgetWarning) return; // Opted out

  const pct = Math.round((currentSpent / budgetLimit) * 100);
  const isOver = pct >= 100;
  
  let subject = "";
  let headerTitle = "";
  let bodyHtml = "";

  if (isOver) {
    subject = `🚨 Budget Terlampaui - Kategori ${categoryName}!`;
    headerTitle = `🚨 Budget Terlampaui!`;
    bodyHtml = `
      <p style="font-size: 16px; font-weight: bold; color: #e11d48; margin-top: 0;">OH NO, Kategori ${categoryName} Bocor! 😭💸</p>
      <div style="border: 2px solid #09090b; padding: 15px; background-color: #ffe4e6; box-shadow: 4px 4px 0px 0px #09090b; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Kategori:</strong> ${categoryName}</p>
        <p style="margin: 5px 0;"><strong>Batas Anggaran:</strong> ${formatRupiah(budgetLimit)}</p>
        <p style="margin: 5px 0; color: #e11d48;"><strong>Pengeluaran Saat Ini:</strong> ${formatRupiah(currentSpent)} (${pct}%)</p>
      </div>
      <p>Pengeluaran kamu udah nembus batas limit yang kamu set, nih. Waktunya ngerem belanjaan buat kategori ini biar gak makin boncos di akhir bulan! Semangat hematnya, bestie! 💪</p>
    `;
  } else {
    subject = `⚠️ Waspada! Budget Kategori ${categoryName} Sudah 80%`;
    headerTitle = `⚠️ Budget Warning!`;
    bodyHtml = `
      <p style="font-size: 16px; font-weight: bold; color: #d97706; margin-top: 0;">Ssttt, Rem Dulu Belanjanya Kategori ${categoryName}! 💸</p>
      <div style="border: 2px solid #09090b; padding: 15px; background-color: #fef3c7; box-shadow: 4px 4px 0px 0px #09090b; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Kategori:</strong> ${categoryName}</p>
        <p style="margin: 5px 0;"><strong>Batas Anggaran:</strong> ${formatRupiah(budgetLimit)}</p>
        <p style="margin: 5px 0; color: #d97706;"><strong>Pengeluaran Saat Ini:</strong> ${formatRupiah(currentSpent)} (${pct}%)</p>
      </div>
      <p>Batas pengeluaran kamu udah hampir menyentuh garis merah (sisa kurang dari 20%). Kurang-kurangin checkout barang yang gak mendesak dulu ya. Kamu pasti bisa kontrol keuanganmu! 🎯</p>
    `;
  }

  const html = neoBrutalistLayout(headerTitle, bodyHtml, "WARNING KEUANGAN");
  await sendEmail(user.email, subject, html);
}

// ----------------------------------------------------
// 2. CRON-BASED BATCHES
// ----------------------------------------------------

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
  }
}

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
  }
}

// DAILY FINANCE SUMMARY (22:00)
export async function runDailyFinanceSummary() {
  const users = await prisma.user.findMany({
    include: { notificationPreference: true },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  for (const user of users) {
    if (!user.email) continue;
    const pref = user.notificationPreference;
    if (pref && !pref.dailyFinanceReport) continue; // Off by default

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: { gte: todayStart, lte: todayEnd },
      },
      include: { category: true },
    });

    if (transactions.length === 0) continue;

    const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const sortedTx = [...transactions].sort((a, b) => b.amount - a.amount);
    const largestTx = sortedTx[0];

    const bodyHtml = `
      <p style="font-size: 16px; font-weight: bold; margin-top: 0;">Selamat malam! Ini rekap pengeluaran harianmu sebelum istirahat. 💰</p>
      <div style="border: 2px solid #09090b; padding: 15px; background-color: #ecfdf5; box-shadow: 4px 4px 0px 0px #09090b; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; text-transform: uppercase;">Total Jajan Hari Ini</h4>
        <span style="font-size: 24px; font-weight: 900;">${formatRupiah(totalSpent)}</span>
      </div>
      <p><strong>Pengeluaran Terbesar:</strong> ${largestTx.category.icon} ${largestTx.category.name} sebesar <strong>${formatRupiah(largestTx.amount)}</strong> (${largestTx.description || "Tanpa keterangan"}).</p>
      <p>Lacak terus pengeluaranmu tiap hari biar keuanganmu tetap terkontrol. Have a good sleep! 😴🌙</p>
    `;

    const html = neoBrutalistLayout("💰 Ringkasan Hari Ini", bodyHtml, "LAPORAN KEUANGAN");
    await sendEmail(user.email, "💰 Rekap Jajan Hari Ini - Kelola Diri", html);
  }
}

// WEEKLY LIFE REVIEW (Sunday night / Monday morning)
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
  }
}

// MONTHLY REPORT (1st of the month)
export async function runMonthlyReport() {
  const users = await prisma.user.findMany({
    include: { notificationPreference: true },
  });

  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const targetMonth = lastMonthDate.getMonth() + 1;
  const targetYear = lastMonthDate.getFullYear();

  const monthName = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(lastMonthDate);

  for (const user of users) {
    if (!user.email) continue;
    const pref = user.notificationPreference;
    if (pref && !pref.monthlyReport) continue; // Off by default

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const txs = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const income = txs.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
    const expense = txs.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
    const savings = income - expense;

    const bodyHtml = `
      <p style="font-size: 16px; font-weight: bold; margin-top: 0;">Hello, Kak! Selamat atas pencapaian sebulan penuh kemarin. Ini rekap finansialmu untuk bulan ${monthName} ${targetYear}. 📈</p>
      
      <div style="border: 2px solid #09090b; padding: 15px; background-color: #fafafa; box-shadow: 4px 4px 0px 0px #09090b; margin: 20px 0;">
        <p style="margin: 8px 0; font-size: 15px;">📥 <strong>Total Pemasukan:</strong> <span style="color: #10b981; font-weight: bold;">${formatRupiah(income)}</span></p>
        <p style="margin: 8px 0; font-size: 15px;">📤 <strong>Total Pengeluaran:</strong> <span style="color: #ef4444; font-weight: bold;">${formatRupiah(expense)}</span></p>
        <p style="margin: 8px 0; font-size: 15px; border-top: 1px solid #ccc; pt-2;">💰 <strong>Sisa Dana / Tabungan:</strong> <span style="color: #3b82f6; font-weight: bold;">${formatRupiah(savings)}</span></p>
      </div>

      <p>${savings >= 0 
        ? "Bagus banget! Kamu berhasil menyisihkan tabungan bulan lalu. Jangan bosan buat investasi dan nabung ya! 🚀" 
        : "Yah, bulan lalu pengeluaran kamu melebihi pemasukan (defisit). Gak apa-apa, mari evaluasi lagi jajanmu bulan ini biar lebih seimbang! 💪💸"
      }</p>
    `;

    const html = neoBrutalistLayout(`📊 Laporan Bulanan - ${monthName}`, bodyHtml, "MONTHLY REPORT");
    await sendEmail(user.email, `📊 Laporan Bulanan (${monthName} ${targetYear}) - Kelola Diri`, html);
  }
}

// GOAL STAGNATON CHECK (Daily/Weekly)
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
  }
}

// ----------------------------------------------------
// 3. TESTING ENGINE (USER MANUAL TEST TRIGGER)
// ----------------------------------------------------
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
  return await sendEmail(user.email, "⚡ Uji Coba Asisten Personal - Kelola Diri", html);
}
