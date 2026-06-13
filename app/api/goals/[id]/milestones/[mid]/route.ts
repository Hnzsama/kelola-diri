import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateGoalProgress } from "@/lib/goals";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; mid: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: goalId, mid: milestoneId } = await params;
    const userId = (session.user as any).id;
    const body = await req.json();
    const { title, isCompleted, order } = body;

    // Verify ownership of the goal
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 });
    }

    const milestone = await prisma.goalMilestone.findFirst({
      where: {
        id: milestoneId,
        goalId,
      },
    });

    if (!milestone) {
      return NextResponse.json({ error: "Milestone tidak ditemukan" }, { status: 404 });
    }

    const updatedMilestone = await prisma.goalMilestone.update({
      where: { id: milestoneId },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(isCompleted !== undefined ? { isCompleted } : {}),
        ...(order !== undefined ? { order } : {}),
      },
    });

    // Auto-update goal progress
    const updatedGoal = await updateGoalProgress(goalId);

    return NextResponse.json({
      milestone: updatedMilestone,
      goal: updatedGoal,
    });
  } catch (error: any) {
    console.error("[MILESTONE_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui milestone" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; mid: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: goalId, mid: milestoneId } = await params;
    const userId = (session.user as any).id;

    // Verify ownership
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 });
    }

    const milestone = await prisma.goalMilestone.findFirst({
      where: {
        id: milestoneId,
        goalId,
      },
    });

    if (!milestone) {
      return NextResponse.json({ error: "Milestone tidak ditemukan" }, { status: 404 });
    }

    await prisma.goalMilestone.delete({
      where: { id: milestoneId },
    });

    // Auto-update goal progress
    const updatedGoal = await updateGoalProgress(goalId);

    return NextResponse.json({
      success: true,
      message: "Milestone berhasil dihapus",
      goal: updatedGoal,
    });
  } catch (error: any) {
    console.error("[MILESTONE_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal menghapus milestone" },
      { status: 500 }
    );
  }
}
