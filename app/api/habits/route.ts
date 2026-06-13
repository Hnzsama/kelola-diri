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
    const onlyActive = searchParams.get("active") === "true";

    const habits = await prisma.habit.findMany({
      where: {
        userId,
        ...(onlyActive ? { isActive: true } : {}),
      },
      include: {
        category: true,
        logs: {
          orderBy: { date: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(habits);
  } catch (error: any) {
    console.error("[HABITS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data habit" },
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
    const { name, description, categoryId } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Nama kebiasaan wajib diisi" }, { status: 400 });
    }

    const newHabit = await prisma.habit.create({
      data: {
        userId,
        name: name.trim(),
        description: description ? description.trim() : null,
        categoryId: categoryId || null,
        isActive: true,
      },
    });

    return NextResponse.json(newHabit, { status: 201 });
  } catch (error: any) {
    console.error("[HABITS_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat kebiasaan baru" },
      { status: 500 }
    );
  }
}
