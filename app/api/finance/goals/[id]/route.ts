import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateGoalProgress } from "@/lib/goals";
import { NextResponse } from "next/server";

export async function PUT(
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
    const { title, targetAmount, currentAmount, deadline, emoji, goalId } = body;

    const goal = await prisma.financialGoal.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: "Target tabungan tidak ditemukan" }, { status: 404 });
    }

    if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
      return NextResponse.json({ error: "Judul target tidak boleh kosong" }, { status: 400 });
    }

    if (targetAmount !== undefined && (typeof targetAmount !== "number" || targetAmount <= 0)) {
      return NextResponse.json({ error: "Target nominal tidak valid" }, { status: 400 });
    }

    if (currentAmount !== undefined && (typeof currentAmount !== "number" || currentAmount < 0)) {
      return NextResponse.json({ error: "Jumlah nominal saat ini tidak valid" }, { status: 400 });
    }

    // Verify linked life goal if provided
    let verifiedGoalId = goalId;
    if (goalId) {
      const existingGoal = await prisma.goal.findFirst({
        where: { id: goalId, userId },
      });
      if (!existingGoal) {
        return NextResponse.json({ error: "Life goal tidak ditemukan" }, { status: 404 });
      }
    } else if (goalId === null) {
      verifiedGoalId = null;
    }

    // Old linked goal in case it changes
    const oldLinkedGoalId = goal.goalId;

    const updatedGoal = await prisma.financialGoal.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(targetAmount !== undefined ? { targetAmount } : {}),
        ...(currentAmount !== undefined ? { currentAmount } : {}),
        ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
        ...(emoji !== undefined ? { emoji: emoji || "💰" } : {}),
        ...(verifiedGoalId !== undefined ? { goalId: verifiedGoalId } : {}),
      },
      include: {
        goal: true,
      },
    });

    // Update parent Goal progress if linked
    if (updatedGoal.goalId) {
      await updateGoalProgress(updatedGoal.goalId);
    }
    if (oldLinkedGoalId && oldLinkedGoalId !== updatedGoal.goalId) {
      await updateGoalProgress(oldLinkedGoalId);
    }

    return NextResponse.json(updatedGoal);
  } catch (error: any) {
    console.error("[FINANCE_GOAL_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui target tabungan" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const goal = await prisma.financialGoal.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: "Target tabungan tidak ditemukan" }, { status: 404 });
    }

    const linkedGoalId = goal.goalId;

    await prisma.financialGoal.delete({
      where: { id },
    });

    // Recalculate parent Goal progress if it was linked
    if (linkedGoalId) {
      await updateGoalProgress(linkedGoalId);
    }

    return NextResponse.json({ success: true, message: "Target tabungan berhasil dihapus" });
  } catch (error: any) {
    console.error("[FINANCE_GOAL_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal menghapus target tabungan" },
      { status: 500 }
    );
  }
}
