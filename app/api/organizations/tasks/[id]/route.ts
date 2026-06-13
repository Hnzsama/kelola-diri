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
    const body = await req.json();
    const { title, description, dueDate, priority, status, eventId } = body;

    const existing = await prisma.organizationTask.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Tugas tidak ditemukan atau tidak berwenang" }, { status: 404 });
    }

    const updated = await prisma.organizationTask.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : existing.title,
        description: description !== undefined ? (description ? description.trim() : null) : existing.description,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existing.dueDate,
        priority: priority !== undefined ? priority : existing.priority,
        status: status !== undefined ? status : existing.status,
        eventId: eventId !== undefined ? eventId : existing.eventId,
      },
      include: {
        event: {
          include: {
            organization: { select: { id: true, name: true, logoIcon: true } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[ORG_TASK_PUT_ERROR]", error);
    return NextResponse.json({ error: "Gagal memperbarui tugas" }, { status: 500 });
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

    const existing = await prisma.organizationTask.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Tugas tidak ditemukan atau tidak berwenang" }, { status: 404 });
    }

    await prisma.organizationTask.delete({ where: { id } });
    return NextResponse.json({ success: "Tugas berhasil dihapus" });
  } catch (error: any) {
    console.error("[ORG_TASK_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Gagal menghapus tugas" }, { status: 500 });
  }
}
