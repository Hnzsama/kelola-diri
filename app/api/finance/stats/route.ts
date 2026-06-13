import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEFAULT_CATEGORIES = [
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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const now = new Date();
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const y = year ? parseInt(year) : now.getFullYear();

    // Start & End date of selected month
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59, 999);

    // Calculate dynamic previous month dates
    const prevM = m === 1 ? 12 : m - 1;
    const prevY = m === 1 ? y - 1 : y;
    const prevStartDate = new Date(prevY, prevM - 1, 1);
    const prevEndDate = new Date(prevY, prevM, 0, 23, 59, 59, 999);

    // Fetch transactions of selected month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Fetch transactions of previous month (expenses only for comparisons)
    const prevMonthExpenseTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: "EXPENSE",
        date: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      },
    });

    // Fetch budgets for selected month
    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        month: m,
        year: y,
      },
    });

    // Fetch all budgets of selected year for category budget history
    const yearlyBudgets = await prisma.budget.findMany({
      where: {
        userId,
        year: y,
      },
    });

    // Fetch savings goals (all time)
    const finGoals = await prisma.financialGoal.findMany({
      where: { userId },
      include: {
        goal: true,
      },
      orderBy: { createdAt: "desc" },
    });
    const totalSavings = finGoals.reduce((sum, fg) => sum + fg.currentAmount, 0);

    // Calculate income & expense for current month
    const totalIncome = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = totalIncome - totalExpense;

    // Calculate expense for previous month
    const prevMonthExpense = prevMonthExpenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Fetch user categories dynamically
    let userCategories = await prisma.financeCategory.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    if (userCategories.length === 0) {
      await prisma.financeCategory.createMany({
        data: DEFAULT_CATEGORIES.map((c) => ({
          userId,
          name: c.name,
          icon: c.icon,
          color: c.color,
        })),
      });

      userCategories = await prisma.financeCategory.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
    }

    // Category breakdown and Budget vs Spent comparison
    const budgetVsSpent = userCategories.map((cat) => {
      const budgetObj = budgets.find((b) => b.categoryId === cat.id);
      const budgetLimit = budgetObj ? budgetObj.amount : 0;
      
      const actualSpent = transactions
        .filter((t) => t.type === "EXPENSE" && t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        budget: budgetLimit,
        spent: actualSpent,
      };
    });

    return NextResponse.json({
      balance: currentBalance,
      income: totalIncome,
      expense: totalExpense,
      savings: totalSavings,
      prevMonthExpense,
      budgetVsSpent,
      yearlyBudgets,
      savingsGoals: finGoals,
    });
  } catch (error: any) {
    console.error("[FINANCE_STATS_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data statistik keuangan" },
      { status: 500 }
    );
  }
}
