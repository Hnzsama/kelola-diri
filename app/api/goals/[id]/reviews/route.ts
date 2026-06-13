import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
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

    const reviews = await prisma.goalProgressReview.findMany({
      where: { goalId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error("[REVIEWS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengambil review progress" },
      { status: 500 }
    );
  }
}

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
    const { month, year, progress, note } = body;

    if (!month || month < 1 || month > 12) {
      return NextResponse.json({ error: "Bulan tidak valid (1-12)" }, { status: 400 });
    }

    if (!year || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Tahun tidak valid" }, { status: 400 });
    }

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

    // Determine the progress snapshot value
    // If progress is not explicitly passed, use the goal's current progress
    const progressSnapshot = progress !== undefined ? progress : goal.progress;

    const newReview = await prisma.goalProgressReview.create({
      data: {
        goalId,
        userId,
        month,
        year,
        progress: progressSnapshot,
        note: note ? note.trim() : null,
      },
    });

    return NextResponse.json(newReview, { status: 201 });
  } catch (error: any) {
    console.error("[REVIEWS_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat review progress baru" },
      { status: 500 }
    );
  }
}
