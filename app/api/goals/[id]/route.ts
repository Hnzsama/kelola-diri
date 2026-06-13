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

    const { id } = await params;
    const userId = (session.user as any).id;

    const goal = await prisma.goal.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        milestones: {
          orderBy: { order: "asc" },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(goal);
  } catch (error: any) {
    console.error("[GOALS_GET_DETAIL_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengambil detail goal" },
      { status: 500 }
    );
  }
}

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
    const { title, description, category, status, targetDate, emoji } = body;

    const goal = await prisma.goal.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 });
    }

    if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
      return NextResponse.json({ error: "Judul goal tidak boleh kosong" }, { status: 400 });
    }

    if (category !== undefined && !["ACADEMIC", "ORGANIZATION", "HABIT", "PERSONAL", "CAREER"].includes(category)) {
      return NextResponse.json({ error: "Kategori goal tidak valid" }, { status: 400 });
    }

    if (status !== undefined && !["ACTIVE", "ACHIEVED", "PAUSED", "DROPPED"].includes(status)) {
      return NextResponse.json({ error: "Status goal tidak valid" }, { status: 400 });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description ? description.trim() : null } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(targetDate !== undefined ? { targetDate: targetDate ? new Date(targetDate) : null } : {}),
        ...(emoji !== undefined ? { emoji: emoji || "🎯" } : {}),
      },
      include: {
        milestones: {
          orderBy: { order: "asc" },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(updatedGoal);
  } catch (error: any) {
    console.error("[GOALS_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui goal" },
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

    const goal = await prisma.goal.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 });
    }

    await prisma.goal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Goal berhasil dihapus" });
  } catch (error: any) {
    console.error("[GOALS_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal menghapus goal" },
      { status: 500 }
    );
  }
}
