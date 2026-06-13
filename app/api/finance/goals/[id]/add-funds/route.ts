import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateGoalProgress } from "@/lib/goals";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const body = await req.json();
    const { amount } = body;

    if (amount === undefined || typeof amount !== "number" || amount === 0) {
      return NextResponse.json({ error: "Nominal penambahan/penarikan dana harus valid" }, { status: 400 });
    }

    const goal = await prisma.financialGoal.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: "Target tabungan tidak ditemukan" }, { status: 404 });
    }

    const newAmount = goal.currentAmount + amount;
    if (newAmount < 0) {
      return NextResponse.json({ error: "Saldo tabungan tidak boleh negatif" }, { status: 400 });
    }

    const updatedGoal = await prisma.financialGoal.update({
      where: { id },
      data: {
        currentAmount: newAmount,
      },
      include: {
        goal: true,
      },
    });

    // Find "Lainnya" category or fallback to any category of this user
    let category = await prisma.financeCategory.findFirst({
      where: {
        userId,
        name: {
          equals: "Lainnya",
          mode: "insensitive",
        },
      },
    });

    if (!category) {
      category = await prisma.financeCategory.findFirst({
        where: { userId },
      });
    }

    if (!category) {
      return NextResponse.json({ error: "Kategori transaksi default tidak ditemukan. Silakan muat ulang halaman." }, { status: 400 });
    }

    // Automatically log a transaction of category "Lainnya"
    await prisma.transaction.create({
      data: {
        userId,
        type: amount > 0 ? "EXPENSE" : "INCOME",
        amount: Math.abs(amount),
        categoryId: category.id,
        date: new Date(),
        description: amount > 0 
          ? `Alokasi tabungan untuk target: ${goal.title}`
          : `Penarikan tabungan dari target: ${goal.title}`,
      },
    });

    // Update parent Goal progress if linked
    if (updatedGoal.goalId) {
      await updateGoalProgress(updatedGoal.goalId);
    }

    return NextResponse.json(updatedGoal);
  } catch (error: any) {
    console.error("[FINANCE_GOAL_ADD_FUNDS_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal memproses alokasi dana tabungan" },
      { status: 500 }
    );
  }
}
