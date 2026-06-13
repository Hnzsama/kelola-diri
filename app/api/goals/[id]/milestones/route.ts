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

    const { id: goalId } = await params;
    const userId = (session.user as any).id;
    const body = await req.json();
    const { title, order } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "Judul milestone wajib diisi" }, { status: 400 });
    }

    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 });
    }

    // Determine order automatically if not provided
    let milestoneOrder = order;
    if (milestoneOrder === undefined) {
      const lastMilestone = await prisma.goalMilestone.findFirst({
        where: { goalId },
        orderBy: { order: "desc" },
      });
      milestoneOrder = lastMilestone ? lastMilestone.order + 1 : 0;
    }

    const newMilestone = await prisma.goalMilestone.create({
      data: {
        goalId,
        title: title.trim(),
        isCompleted: false,
        order: milestoneOrder,
      },
    });

    // Auto-update goal progress
    const updatedGoal = await updateGoalProgress(goalId);

    return NextResponse.json({
      milestone: newMilestone,
      goal: updatedGoal,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[MILESTONES_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat milestone baru" },
      { status: 500 }
    );
  }
}
