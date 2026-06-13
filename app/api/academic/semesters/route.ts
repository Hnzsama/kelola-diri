import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const semesters = await prisma.semester.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(semesters);
  } catch (error: any) {
    console.error("[SEMESTERS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data semester" },
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
    const { name, isActive } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Nama semester wajib diisi" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check count of existing semesters for default activation
    const count = await prisma.semester.count({
      where: { userId },
    });

    const shouldBeActive = count === 0 ? true : !!isActive;

    if (shouldBeActive) {
      // Deactivate other semesters
      await prisma.semester.updateMany({
        where: { userId },
        data: { isActive: false },
      });
    }

    const newSemester = await prisma.semester.create({
      data: {
        userId,
        name: trimmedName,
        isActive: shouldBeActive,
      },
    });

    return NextResponse.json(newSemester, { status: 201 });
  } catch (error: any) {
    console.error("[SEMESTERS_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat semester baru" },
      { status: 500 }
    );
  }
}
