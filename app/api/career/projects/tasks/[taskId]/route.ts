import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { taskId } = await params;
    const body = await req.json();
    const { title, description, dueDate, priority, status } = body;

    // Verify task exists and project belongs to user
    const existingTask = await prisma.projectTask.findFirst({
      where: {
        id: taskId,
        project: { userId: user.id },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Tugas tidak ditemukan atau proyek bukan milik Anda" }, { status: 404 });
    }

    const updatedTask = await prisma.projectTask.update({
      where: { id: taskId },
      data: {
        title: title !== undefined ? title.trim() : existingTask.title,
        description: description !== undefined ? (description ? description.trim() : null) : existingTask.description,
        dueDate: dueDate !== undefined ? new Date(dueDate) : existingTask.dueDate,
        priority: priority !== undefined ? priority : existingTask.priority,
        status: status !== undefined ? status : existingTask.status,
      },
    });

    return NextResponse.json({ success: "Tugas berhasil diperbarui", task: updatedTask });
  } catch (error: any) {
    console.error("PUT Project Task Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui tugas" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { taskId } = await params;

    // Verify task exists and project belongs to user
    const existingTask = await prisma.projectTask.findFirst({
      where: {
        id: taskId,
        project: { userId: user.id },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Tugas tidak ditemukan atau proyek bukan milik Anda" }, { status: 404 });
    }

    await prisma.projectTask.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: "Tugas berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE Project Task Error:", error);
    return NextResponse.json({ error: "Gagal menghapus tugas" }, { status: 500 });
  }
}
