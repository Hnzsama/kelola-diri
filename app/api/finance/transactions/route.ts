import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendTransactionEmailAlert } from "@/lib/notification-engine";

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

    const filter: any = { userId };

    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0, 23, 59, 59, 999);
      filter.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: filter,
      include: {
        category: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error("[TRANSACTIONS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data transaksi" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { type, amount, categoryId, date, description } = body;

    if (!type || !["INCOME", "EXPENSE"].includes(type)) {
      return NextResponse.json({ error: "Tipe transaksi tidak valid" }, { status: 400 });
    }

    if (amount === undefined || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Jumlah nominal harus berupa angka positif" }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Kategori transaksi wajib ditentukan" }, { status: 400 });
    }

    const categoryExists = await prisma.financeCategory.findFirst({
      where: { id: categoryId, userId },
    });

    if (!categoryExists) {
      return NextResponse.json({ error: "Kategori transaksi tidak ditemukan" }, { status: 404 });
    }

    const txDate = date ? new Date(date) : new Date();
    const newTransaction = await prisma.transaction.create({
      data: {
        userId,
        type,
        amount,
        categoryId,
        date: txDate,
        description: description ? description.trim() : null,
      },
      include: {
        category: true,
      },
    });

    // Check budget thresholds asynchronously if type is EXPENSE
    if (type === "EXPENSE") {
      (async () => {
        try {
          const month = txDate.getMonth() + 1;
          const year = txDate.getFullYear();
          const budget = await prisma.budget.findUnique({
            where: {
              userId_categoryId_month_year: {
                userId,
                categoryId,
                month,
                year,
              },
            },
          });

          if (budget && budget.amount > 0) {
            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
            const spentAggregate = await prisma.transaction.aggregate({
              where: {
                userId,
                categoryId,
                type: "EXPENSE",
                date: {
                  gte: startOfMonth,
                  lte: endOfMonth,
                },
              },
              _sum: {
                amount: true,
              },
            });

            const spentAmount = spentAggregate._sum.amount || 0;
            const prevSpent = spentAmount - amount;

            const { sendBudgetWarning } = await import("@/lib/notification-engine");
            
            // Check threshold crossings
            if (prevSpent < 0.8 * budget.amount && spentAmount >= 0.8 * budget.amount && spentAmount < budget.amount) {
              await sendBudgetWarning(userId, newTransaction.category.name, budget.amount, spentAmount);
            } else if (prevSpent < budget.amount && spentAmount >= budget.amount) {
              await sendBudgetWarning(userId, newTransaction.category.name, budget.amount, spentAmount);
            }
          }
        } catch (err) {
          console.error("Failed checking budget warning:", err);
        }
      })();
    }

    // Send real-time email alert for transaction
    (async () => {
      try {
        await sendTransactionEmailAlert(userId, newTransaction.id);
      } catch (err) {
        console.error("Failed sending transaction email:", err);
      }
    })();

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error: any) {
    console.error("[TRANSACTIONS_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat transaksi baru" },
      { status: 500 }
    );
  }
}
