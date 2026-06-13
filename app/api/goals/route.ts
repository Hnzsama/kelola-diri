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
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const goals = await prisma.goal.findMany({
      where: {
        userId,
        ...(category ? { category } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        milestones: {
          orderBy: { order: "asc" },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(goals);
  } catch (error: any) {
    console.error("[GOALS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data goal" },
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
    const { title, description, category, targetDate, emoji } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "Judul goal wajib diisi" }, { status: 400 });
    }

    if (!category || !["ACADEMIC", "ORGANIZATION", "HABIT", "PERSONAL", "CAREER"].includes(category)) {
      return NextResponse.json({ error: "Kategori goal tidak valid" }, { status: 400 });
    }

    const newGoal = await prisma.goal.create({
      data: {
        userId,
        title: title.trim(),
        description: description ? description.trim() : null,
        category,
        targetDate: targetDate ? new Date(targetDate) : null,
        emoji: emoji || "🎯",
        status: "ACTIVE",
        progress: 0,
      },
      include: {
        milestones: true,
        reviews: true,
      },
    });

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error: any) {
    console.error("[GOALS_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat goal baru" },
      { status: 500 }
    );
  }
}
