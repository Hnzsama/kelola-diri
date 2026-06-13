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

    // Check assignment existence and ownership
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!assignment || assignment.course.userId !== userId) {
      return NextResponse.json(
        { error: "Tugas tidak ditemukan atau Anda tidak berwenang" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { title, description, dueDate, priority, status } = body;

    // Build update payload
    const updateData: any = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim() === "") {
        return NextResponse.json({ error: "Judul tugas tidak boleh kosong" }, { status: 400 });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    if (dueDate !== undefined) {
      const parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return NextResponse.json({ error: "Format tanggal tidak valid" }, { status: 400 });
      }
      updateData.dueDate = parsedDueDate;
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    if (status !== undefined) {
      if (!["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
        return NextResponse.json({ error: "Status tugas tidak valid" }, { status: 400 });
      }
      updateData.status = status;
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedAssignment);
  } catch (error: any) {
    console.error("[ASSIGNMENT_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui tugas" },
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

    // Check assignment existence and ownership
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!assignment || assignment.course.userId !== userId) {
      return NextResponse.json(
        { error: "Tugas tidak ditemukan atau Anda tidak berwenang" },
        { status: 404 }
      );
    }

    await prisma.assignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: "Tugas berhasil dihapus" });
  } catch (error: any) {
    console.error("[ASSIGNMENT_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal menghapus tugas" },
      { status: 500 }
    );
  }
}
