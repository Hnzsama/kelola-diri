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

    // Check exam existence and ownership
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!exam || exam.course.userId !== userId) {
      return NextResponse.json(
        { error: "Ujian tidak ditemukan atau Anda tidak berwenang" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { title, date, room, type } = body;

    // Build update payload
    const updateData: any = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim() === "") {
        return NextResponse.json({ error: "Judul ujian tidak boleh kosong" }, { status: 400 });
      }
      updateData.title = title.trim();
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "Format tanggal tidak valid" }, { status: 400 });
      }
      updateData.date = parsedDate;
    }

    if (room !== undefined) {
      updateData.room = room ? room.trim() : null;
    }

    if (type !== undefined) {
      updateData.type = type;
    }

    const updatedExam = await prisma.exam.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedExam);
  } catch (error: any) {
    console.error("[EXAM_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui ujian" },
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

    // Check exam existence and ownership
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!exam || exam.course.userId !== userId) {
      return NextResponse.json(
        { error: "Ujian tidak ditemukan atau Anda tidak berwenang" },
        { status: 404 }
      );
    }

    await prisma.exam.delete({
      where: { id },
    });

    return NextResponse.json({ success: "Ujian berhasil dihapus" });
  } catch (error: any) {
    console.error("[EXAM_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal menghapus ujian" },
      { status: 500 }
    );
  }
}
