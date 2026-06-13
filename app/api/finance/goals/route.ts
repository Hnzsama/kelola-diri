import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const goals = await prisma.financialGoal.findMany({
      where: { userId },
      include: {
        goal: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(goals);
  } catch (error: any) {
    console.error("[FINANCE_GOALS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengambil target tabungan" },
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
    const { title, targetAmount, currentAmount, deadline, emoji, goalId } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "Judul target wajib diisi" }, { status: 400 });
    }

    if (targetAmount === undefined || typeof targetAmount !== "number" || targetAmount <= 0) {
      return NextResponse.json({ error: "Target nominal tabungan tidak valid" }, { status: 400 });
    }

    // Verify linked life goal if provided
    if (goalId) {
      const existingGoal = await prisma.goal.findFirst({
        where: { id: goalId, userId },
      });
      if (!existingGoal) {
        return NextResponse.json({ error: "Life goal yang ditargetkan tidak ditemukan" }, { status: 404 });
      }
    }

    const goal = await prisma.financialGoal.create({
      data: {
        userId,
        title: title.trim(),
        targetAmount,
        currentAmount: currentAmount !== undefined ? currentAmount : 0,
        deadline: deadline ? new Date(deadline) : null,
        emoji: emoji || "💰",
        goalId: goalId || null,
      },
      include: {
        goal: true,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error: any) {
    console.error("[FINANCE_GOALS_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat target tabungan baru" },
      { status: 500 }
    );
  }
}
