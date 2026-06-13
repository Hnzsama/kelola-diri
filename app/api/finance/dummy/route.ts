import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateGoalProgress } from "@/lib/goals";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Ensure user exists in the database (self-heals if database was reset)
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      await prisma.user.create({
        data: {
          id: userId,
          email: session.user.email || "user@example.com",
          name: session.user.name || "Student User",
        },
      });
    }

    // Clean old finance data
    await prisma.budget.deleteMany({ where: { userId } });
    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.financialGoal.deleteMany({ where: { userId } });
    await prisma.financeCategory.deleteMany({ where: { userId } });

    // Seed default categories
    const categoriesData = [
      { name: "Makan", icon: "🍜", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-400/30" },
      { name: "Transportasi", icon: "⛽", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-400/30" },
      { name: "Kuliah", icon: "📚", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-400/30" },
      { name: "Organisasi", icon: "🏢", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/30" },
      { name: "Freelance", icon: "💻", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-400/30" },
      { name: "Internet", icon: "📱", color: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-400/30" },
      { name: "Hiburan", icon: "🎮", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-400/30" },
      { name: "Sosial", icon: "❤️", color: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-400/30" },
      { name: "Lainnya", icon: "💰", color: "bg-muted text-muted-foreground border-border/30" },
    ];

    const categoryMap: Record<string, string> = {};
    for (const cat of categoriesData) {
      const dbCat = await prisma.financeCategory.create({
        data: {
          userId,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
        },
      });
      categoryMap[cat.name] = dbCat.id;
    }

    // Look up existing life goals to link
    const userGoals = await prisma.goal.findMany({
      where: { userId },
    });
    const ipkGoal = userGoals.find((g) => g.title.includes("IPK") || g.category === "ACADEMIC");
    const reactGoal = userGoals.find((g) => g.title.includes("React") || g.title.includes("IT") || g.category === "CAREER");

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Calculate dynamic previous months
    const prevMonth1 = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear1 = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevMonth2 = prevMonth1 === 1 ? 12 : prevMonth1 - 1;
    const prevYear2 = prevMonth1 === 1 ? prevYear1 - 1 : prevYear1;

    // 1. Seed Budgets (Current month + last 2 months for history)
    const budgetsData = [
      // Current Month (June)
      { categoryName: "Makan", amount: 700000, month: currentMonth, year: currentYear },
      { categoryName: "Transportasi", amount: 250000, month: currentMonth, year: currentYear },
      { categoryName: "Kuliah", amount: 300000, month: currentMonth, year: currentYear },
      { categoryName: "Organisasi", amount: 150000, month: currentMonth, year: currentYear },
      { categoryName: "Internet", amount: 150000, month: currentMonth, year: currentYear },
      { categoryName: "Hiburan", amount: 200000, month: currentMonth, year: currentYear },
      { categoryName: "Sosial", amount: 100000, month: currentMonth, year: currentYear },
      { categoryName: "Lainnya", amount: 150000, month: currentMonth, year: currentYear },

      // Previous Month 1 (May)
      { categoryName: "Makan", amount: 500000, month: prevMonth1, year: prevYear1 },
      { categoryName: "Transportasi", amount: 200000, month: prevMonth1, year: prevYear1 },
      { categoryName: "Internet", amount: 150000, month: prevMonth1, year: prevYear1 },
      { categoryName: "Hiburan", amount: 150000, month: prevMonth1, year: prevYear1 },

      // Previous Month 2 (April)
      { categoryName: "Makan", amount: 600000, month: prevMonth2, year: prevYear2 },
      { categoryName: "Transportasi", amount: 300000, month: prevMonth2, year: prevYear2 },
      { categoryName: "Internet", amount: 120000, month: prevMonth2, year: prevYear2 },
    ];

    await prisma.budget.createMany({
      data: budgetsData.map((b) => ({
        userId,
        categoryId: categoryMap[b.categoryName],
        amount: b.amount,
        month: b.month,
        year: b.year,
      })),
    });

    // 2. Seed Transactions (Current month + some from previous month for stats comparisons)
    const transactionsData = [
      // Current Month
      { type: "INCOME", amount: 2500000, categoryName: "Freelance", description: "Gaji Magang / Freelance UI/UX", date: new Date(currentYear, currentMonth - 1, 2) },
      { type: "INCOME", amount: 1500000, categoryName: "Lainnya", description: "Uang Bulanan Orang Tua", date: new Date(currentYear, currentMonth - 1, 5) },
      { type: "EXPENSE", amount: 50000, categoryName: "Organisasi", description: "Kas Organisasi Himpunan", date: new Date(currentYear, currentMonth - 1, 3) },
      { type: "EXPENSE", amount: 120000, categoryName: "Kuliah", description: "Buku Panduan Kuliah Basis Data", date: new Date(currentYear, currentMonth - 1, 6) },
      { type: "EXPENSE", amount: 350000, categoryName: "Makan", description: "Belanja Bahan Makanan & Warteg", date: new Date(currentYear, currentMonth - 1, 8) },
      { type: "EXPENSE", amount: 150000, categoryName: "Hiburan", description: "Nonton Bioskop & Kopi Hangout", date: new Date(currentYear, currentMonth - 1, 10) },
      { type: "EXPENSE", amount: 80000, categoryName: "Transportasi", description: "Bensin & E-toll Kampus", date: new Date(currentYear, currentMonth - 1, 12) },
      { type: "EXPENSE", amount: 100000, categoryName: "Internet", description: "Paket Data Internet Bulanan", date: new Date(currentYear, currentMonth - 1, 13) },
      { type: "EXPENSE", amount: 50000, categoryName: "Sosial", description: "Donasi Sosial & Kado Teman", date: new Date(currentYear, currentMonth - 1, 14) },

      // Previous Month (May) - Total: Rp 600.000
      { type: "EXPENSE", amount: 300000, categoryName: "Makan", description: "Makan Bulanan Warteg", date: new Date(prevYear1, prevMonth1 - 1, 10) },
      { type: "EXPENSE", amount: 150000, categoryName: "Internet", description: "Paket Data Internet", date: new Date(prevYear1, prevMonth1 - 1, 15) },
      { type: "EXPENSE", amount: 150000, categoryName: "Transportasi", description: "Bensin motor bulanan", date: new Date(prevYear1, prevMonth1 - 1, 20) },
    ];

    await prisma.transaction.createMany({
      data: transactionsData.map((t) => ({
        userId,
        type: t.type,
        amount: t.amount,
        categoryId: categoryMap[t.categoryName],
        date: t.date,
        description: t.description,
      })),
    });

    // 3. Seed Savings Goals (Financial Goals)
    const savingsGoals = [
      {
        title: "Beli Laptop Baru",
        targetAmount: 15000000,
        currentAmount: 8000000,
        deadline: new Date(currentYear + 1, 0, 1),
        emoji: "💻",
        goalId: reactGoal ? reactGoal.id : null,
      },
      {
        title: "Biaya Wisuda Mandiri",
        targetAmount: 3000000,
        currentAmount: 1500000,
        deadline: new Date(currentYear, 11, 31),
        emoji: "🎓",
        goalId: ipkGoal ? ipkGoal.id : null,
      },
    ];

    for (const sg of savingsGoals) {
      const createdFinGoal = await prisma.financialGoal.create({
        data: {
          userId,
          title: sg.title,
          targetAmount: sg.targetAmount,
          currentAmount: sg.currentAmount,
          deadline: sg.deadline,
          emoji: sg.emoji,
          goalId: sg.goalId,
        },
      });

      // Automatically recalculate parent goal progress
      if (createdFinGoal.goalId) {
        await updateGoalProgress(createdFinGoal.goalId);
      }
    }

    return NextResponse.json({
      success: "Data contoh keuangan berhasil di-seed!",
    }, { status: 201 });
  } catch (error: any) {
    console.error("[SEED_DUMMY_FINANCE_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal memproses data contoh keuangan" },
      { status: 500 }
    );
  }
}
