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
    const today = new Date();
    const currentDay = today.getDate();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // Fetch all required data concurrently
    const [
      transactions,
      prevMonthExpenseTransactions,
      budgets,
      yearlyBudgets,
      finGoals,
      transactionSums,
      pendingDebtsReceivables,
      recurringBills,
      paidBillsThisMonth,
      allPendingDebts,
      userCategories
    ] = await Promise.all([
      // 1. Transactions of selected month
      prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      // 2. Transactions of previous month (expenses only for comparisons)
      prisma.transaction.findMany({
        where: {
          userId,
          type: "EXPENSE",
          date: {
            gte: prevStartDate,
            lte: prevEndDate,
          },
        },
      }),
      // 3. Budgets for selected month
      prisma.budget.findMany({
        where: {
          userId,
          month: m,
          year: y,
        },
      }),
      // 4. All budgets of selected year for category budget history
      prisma.budget.findMany({
        where: {
          userId,
          year: y,
        },
      }),
      // 5. Savings goals (all time)
      prisma.financialGoal.findMany({
        where: { userId },
        include: {
          goal: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      // 6. Aggregate sums of all-time transactions for absolute balance
      prisma.transaction.groupBy({
        by: ["type"],
        where: { userId },
        _sum: {
          amount: true,
        },
      }),
      // 7. Pending debts/receivables this month
      prisma.debtReceivable.findMany({
        where: {
          userId,
          status: "PENDING",
          dueDate: {
            gte: today,
            lte: endOfMonth
          }
        }
      }),
      // 8. Recurring bills
      prisma.recurringBill.findMany({
        where: { userId, isActive: true }
      }),
      // 9. Paid bills this month
      prisma.transaction.findMany({
        where: {
          userId,
          type: "EXPENSE",
          date: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1),
            lte: endOfMonth,
          },
          description: {
            startsWith: "Pembayaran tagihan berulang:",
          },
        },
      }),
      // 10. All pending debts (unbounded timeline for total hutang/piutang cards)
      prisma.debtReceivable.findMany({
        where: { userId, status: "PENDING" }
      }),
      // 11. Fetch user categories
      prisma.financeCategory.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      })
    ]);

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

    // Parse aggregated sums for all-time balance
    let allTimeIncome = 0;
    let allTimeExpense = 0;
    for (const group of transactionSums) {
      if (group.type === "INCOME") {
        allTimeIncome = group._sum.amount || 0;
      } else if (group.type === "EXPENSE") {
        allTimeExpense = group._sum.amount || 0;
      }
    }
    const absoluteBalance = allTimeIncome - allTimeExpense;

    const pendingReceivablesThisMonth = pendingDebtsReceivables.filter(d => d.type === "RECEIVABLE").reduce((sum, d) => sum + d.amount, 0);
    const pendingDebtsThisMonth = pendingDebtsReceivables.filter(d => d.type === "DEBT").reduce((sum, d) => sum + d.amount, 0);

    const paidBillNames = paidBillsThisMonth.map(tx => {
      return tx.description ? tx.description.replace("Pembayaran tagihan berulang: ", "") : "";
    });

    const unpaidRecurringBills = recurringBills.filter(
      b => !paidBillNames.includes(b.name)
    );
    
    const upcomingRecurringBillsThisMonth = unpaidRecurringBills.reduce((sum, b) => sum + b.amount, 0);

    const projectedBalance = absoluteBalance + pendingReceivablesThisMonth - pendingDebtsThisMonth - upcomingRecurringBillsThisMonth;

    const totalPiutang = allPendingDebts.filter(d => d.type === "RECEIVABLE").reduce((sum, d) => sum + d.amount, 0);
    const totalHutang = allPendingDebts.filter(d => d.type === "DEBT").reduce((sum, d) => sum + d.amount, 0);

    // Final variable check for category initialization
    let finalCategories = userCategories;

    if (finalCategories.length === 0) {
      await prisma.financeCategory.createMany({
        data: DEFAULT_CATEGORIES.map((c) => ({
          userId,
          name: c.name,
          icon: c.icon,
          color: c.color,
        })),
      });

      finalCategories = await prisma.financeCategory.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
    }

    // Category breakdown and Budget vs Spent comparison
    const budgetVsSpent = finalCategories.map((cat) => {
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
      absoluteBalance,
      income: totalIncome,
      expense: totalExpense,
      savings: totalSavings,
      prevMonthExpense,
      budgetVsSpent,
      yearlyBudgets,
      savingsGoals: finGoals,
      totalPiutang,
      totalHutang,
      projectedBalance,
      pendingReceivablesThisMonth,
      pendingDebtsThisMonth,
      upcomingRecurringBillsThisMonth,
    });
  } catch (error: any) {
    console.error("[FINANCE_STATS_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data statistik keuangan" },
      { status: 500 }
    );
  }
}
