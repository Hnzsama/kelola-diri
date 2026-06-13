import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
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

    // Check existence and ownership
    const semester = await prisma.semester.findUnique({
      where: { id },
    });

    if (!semester || semester.userId !== userId) {
      return NextResponse.json(
        { error: "Semester tidak ditemukan atau Anda tidak berwenang" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, isActive } = body;

    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return NextResponse.json({ error: "Nama semester tidak boleh kosong" }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (isActive === true) {
      // Deactivate all other semesters of this user
      await prisma.semester.updateMany({
        where: { userId, NOT: { id } },
        data: { isActive: false },
      });
      updateData.isActive = true;
    } else if (isActive === false) {
      // If setting to false, ensure they have at least one other active semester,
      // otherwise we force it to remain active to prevent 0 active semesters.
      const otherSemestersCount = await prisma.semester.count({
        where: { userId, NOT: { id }, isActive: true },
      });
      if (otherSemestersCount === 0) {
        // Force it to remain active
        updateData.isActive = true;
      } else {
        updateData.isActive = false;
      }
    }

    const updatedSemester = await prisma.semester.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedSemester);
  } catch (error: any) {
    console.error("[SEMESTER_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui semester" },
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

    // Check existence and ownership
    const semester = await prisma.semester.findUnique({
      where: { id },
    });

    if (!semester || semester.userId !== userId) {
      return NextResponse.json(
        { error: "Semester tidak ditemukan atau Anda tidak berwenang" },
        { status: 404 }
      );
    }

    // Perform delete
    await prisma.semester.delete({
      where: { id },
    });

    // If deleted semester was the active one, find another one and make it active
    if (semester.isActive) {
      const nextSemester = await prisma.semester.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      if (nextSemester) {
        await prisma.semester.update({
          where: { id: nextSemester.id },
          data: { isActive: true },
        });
      }
    }

    return NextResponse.json({ success: "Semester berhasil dihapus" });
  } catch (error: any) {
    console.error("[SEMESTER_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal menghapus semester" },
      { status: 500 }
    );
  }
}
