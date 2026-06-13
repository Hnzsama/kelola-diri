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

    // Check course existence and ownership
    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course || course.userId !== userId) {
      return NextResponse.json(
        { error: "Mata kuliah tidak ditemukan atau Anda tidak berwenang" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, code, lecturer, day, startTime, endTime, room, credits, semesterId } = body;

    // Validate inputs
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Nama mata kuliah wajib diisi" }, { status: 400 });
    }
    if (!day || typeof day !== "string" || day.trim() === "") {
      return NextResponse.json({ error: "Hari kuliah wajib diisi" }, { status: 400 });
    }
    if (!startTime || typeof startTime !== "string" || startTime.trim() === "") {
      return NextResponse.json({ error: "Jam mulai kuliah wajib diisi" }, { status: 400 });
    }
    if (!endTime || typeof endTime !== "string" || endTime.trim() === "") {
      return NextResponse.json({ error: "Jam selesai kuliah wajib diisi" }, { status: 400 });
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: "Format jam kuliah harus HH:MM (contoh: 08:00)" },
        { status: 400 }
      );
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        name: name.trim(),
        code: code ? code.trim() : null,
        lecturer: lecturer ? lecturer.trim() : null,
        day: day.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        room: room ? room.trim() : null,
        credits: credits ? parseInt(credits, 10) : 2,
        semesterId: semesterId !== undefined ? semesterId : undefined,
      },
    });

    return NextResponse.json(updatedCourse);
  } catch (error: any) {
    console.error("[COURSE_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui mata kuliah" },
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

    // Check course existence and ownership
    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course || course.userId !== userId) {
      return NextResponse.json(
        { error: "Mata kuliah tidak ditemukan atau Anda tidak berwenang" },
        { status: 404 }
      );
    }

    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({ success: "Mata kuliah berhasil dihapus" });
  } catch (error: any) {
    console.error("[COURSE_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal menghapus mata kuliah" },
      { status: 500 }
    );
  }
}
