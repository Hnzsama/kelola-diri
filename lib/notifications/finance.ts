import prisma from "../prisma";
import { sendEmail, neoBrutalistLayout, formatRupiah } from "./shared";

// 1. BUDGET WARNING
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

  // Kirim ke email sekunder yang didaftarkan (jika ada & aktif)
  const secondaryEmails = await prisma.secondaryEmail.findMany({
    where: { userId, budgetWarning: true },
  });
  for (const sec of secondaryEmails) {
    await sendEmail(sec.email, `${subject} (${user.name || "User"})`, html);
  }
}

// 2. DAILY FINANCE SUMMARY (22:00)
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

    // Kirim ke email sekunder yang didaftarkan (jika ada & aktif)
    const secondaryEmails = await prisma.secondaryEmail.findMany({
      where: { userId: user.id, dailyFinanceReport: true },
    });
    for (const sec of secondaryEmails) {
      await sendEmail(sec.email, `💰 Rekap Jajan Hari Ini (${user.name || "User"}) - Kelola Diri`, html);
    }
  }
}

// 3. MONTHLY REPORT (1st of the month)
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
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

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

    // Kirim ke email sekunder yang didaftarkan (jika ada & aktif)
    const secondaryEmails = await prisma.secondaryEmail.findMany({
      where: { userId: user.id, monthlyReport: true },
    });
    for (const sec of secondaryEmails) {
      await sendEmail(sec.email, `📊 Laporan Bulanan (${monthName} ${targetYear}) (${user.name || "User"}) - Kelola Diri`, html);
    }
  }
}

// 4. DAILY FINANCE ALERTS (DEBTS & RECURRING BILLS)
export async function runDailyFinanceAlerts() {
  const users = await prisma.user.findMany({
    include: { notificationPreference: true },
  });

  const tomorrowStart = new Date();
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date();
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const targetDateForBills = new Date();
  targetDateForBills.setDate(targetDateForBills.getDate() + 3);
  const targetBillDay = targetDateForBills.getDate();

  for (const user of users) {
    if (!user.email) continue;
    
    // Find debts/receivables due tomorrow
    const debtsDueTomorrow = await prisma.debtReceivable.findMany({
      where: {
        userId: user.id,
        status: "PENDING",
        dueDate: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
      },
    });

    // Find active recurring bills due in 3 days
    const billsDueSoon = await prisma.recurringBill.findMany({
      where: {
        userId: user.id,
        isActive: true,
        dueDay: targetBillDay,
      },
    });

    if (debtsDueTomorrow.length === 0 && billsDueSoon.length === 0) continue;

    let bodyHtml = "";

    if (debtsDueTomorrow.length > 0) {
      const listHtml = debtsDueTomorrow
        .map((d) => {
          const typeStr = d.type === "DEBT" ? "Hutang ke" : "Piutang dari";
          return `
            <li style="margin-bottom: 12px; padding: 12px; border: 2px solid #09090b; background-color: #ffe4e6; box-shadow: 2px 2px 0px 0px #09090b;">
              <strong>⚠️ Jatuh Tempo Besok: ${typeStr} ${d.contact}</strong><br/>
              <span style="font-size: 15px; font-weight: bold; color: #e11d48;">Nominal: ${formatRupiah(d.amount)}</span><br/>
              <span style="font-size: 12px; color: #666;">Untuk: ${d.purpose}</span>
            </li>
          `;
        })
        .join("");

      bodyHtml += `
        <p style="font-size: 16px; font-weight: bold; margin-top: 0;">⚠️ Ada catatan Hutang/Piutang yang akan jatuh tempo besok!</p>
        <ul style="list-style: none; padding: 0; margin: 15px 0;">
          ${listHtml}
        </ul>
      `;
    }

    if (billsDueSoon.length > 0) {
      const listHtml = billsDueSoon
        .map((b) => {
          return `
            <li style="margin-bottom: 12px; padding: 12px; border: 2px solid #09090b; background-color: #f3e8ff; box-shadow: 2px 2px 0px 0px #09090b;">
              <strong>💸 Tagihan Mendatang (H-3): ${b.name}</strong><br/>
              <span style="font-size: 15px; font-weight: bold; color: #7c3aed;">Nominal: ${formatRupiah(b.amount)}</span><br/>
              <span style="font-size: 12px; color: #666;">Tanggal Tagihan: ${b.dueDay} tiap bulan</span>
            </li>
          `;
        })
        .join("");

      bodyHtml += `
        ${bodyHtml ? "<hr style='border: 0; border-top: 2px dashed #09090b; margin: 25px 0;' />" : ""}
        <p style="font-size: 16px; font-weight: bold; margin-top: 0;">📅 Ada tagihan berulang yang akan jatuh tempo dalam 3 hari!</p>
        <ul style="list-style: none; padding: 0; margin: 15px 0;">
          ${listHtml}
        </ul>
      `;
    }

    const html = neoBrutalistLayout("Pengingat Keuangan", bodyHtml, "ASISTEN KEUANGAN");
    await sendEmail(user.email, "⚠️ Pengingat Keuangan: Tagihan & Jatuh Tempo - Kelola Diri", html);

    // Kirim ke email sekunder yang didaftarkan (jika ada & aktif)
    const secondaryEmails = await prisma.secondaryEmail.findMany({
      where: { userId: user.id, budgetWarning: true },
    });
    for (const sec of secondaryEmails) {
      await sendEmail(sec.email, `⚠️ Pengingat Keuangan: Tagihan & Jatuh Tempo (${user.name || "User"}) - Kelola Diri`, html);
    }
  }
}

// 5. TRANSACTION ALERT (REAL-TIME NOTIFICATION)
export async function sendTransactionEmailAlert(userId: string, transactionId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.email) return;

    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { category: true },
    });

    if (!tx) return;

    // Calculate absolute balance
    const allTxs = await prisma.transaction.findMany({ where: { userId } });
    const income = allTxs.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
    const expense = allTxs.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;

    const isExpense = tx.type === "EXPENSE";
    const typeStr = isExpense ? "Pengeluaran" : "Pemasukan";
    const emojiStr = isExpense ? "📤" : "📥";
    const colorStr = isExpense ? "#e11d48" : "#10b981";

    const subject = `${emojiStr} Notifikasi Transaksi: ${typeStr} ${formatRupiah(tx.amount)} - Kelola Diri`;
    const headerTitle = `${emojiStr} Transaksi Dicatat`;

    const bodyHtml = `
      <p style="font-size: 16px; font-weight: bold; margin-top: 0;">Halo, ${user.name || "User"}!</p>
      <p>Sistem mendeteksi pencatatan transaksi baru pada akun Anda. Berikut adalah rincian mutasi kas Anda:</p>
      
      <div style="border: 3px solid #09090b; padding: 20px; background-color: ${isExpense ? "#ffe4e6" : "#ecfdf5"}; box-shadow: 4px 4px 0px 0px #09090b; margin: 20px 0; font-family: monospace;">
        <h3 style="margin: 0 0 15px 0; text-transform: uppercase; border-bottom: 2px solid #09090b; padding-bottom: 5px; color: ${colorStr}; font-size: 14px;">
          Rincian ${typeStr}
        </h3>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Nominal:</strong> <span style="font-size: 18px; font-weight: bold; color: ${colorStr};">${formatRupiah(tx.amount)}</span></p>
        <p style="margin: 5px 0;"><strong>Kategori:</strong> ${tx.category.icon} ${tx.category.name}</p>
        <p style="margin: 5px 0;"><strong>Keterangan:</strong> ${tx.description || "-"}</p>
        <p style="margin: 5px 0;"><strong>Tanggal:</strong> ${tx.date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
      </div>

      <div style="border: 2px solid #09090b; padding: 12px; background-color: #fafafa; box-shadow: 2px 2px 0px 0px #09090b; margin-bottom: 25px; font-family: monospace; font-size: 12px;">
        <strong>Saldo Akun Saat Ini:</strong> ${formatRupiah(balance)}
      </div>

      <p>Lacak dan kelola anggaran belanja Anda secara berkala agar pengeluaran tetap terkontrol. Semangat mengelola diri! 🚀</p>
    `;

    const html = neoBrutalistLayout(headerTitle, bodyHtml, "NOTIFIKASI TRANSAKSI");
    await sendEmail(user.email, subject, html);

    // Kirim ke email sekunder yang didaftarkan (jika ada & aktif)
    const secondaryEmails = await prisma.secondaryEmail.findMany({
      where: { userId, transactionEmail: true },
    });
    for (const sec of secondaryEmails) {
      await sendEmail(sec.email, `${subject} (${user.name || "User"})`, html);
    }
  } catch (error) {
    console.error("Failed sending transaction email notification:", error);
  }
}

