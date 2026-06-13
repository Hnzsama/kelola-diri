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
    const { title, description, type, date, endDate, location, isArchived } = body;

    const existing = await prisma.organizationEvent.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Event tidak ditemukan atau tidak berwenang" }, { status: 404 });
    }

    const updated = await prisma.organizationEvent.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : existing.title,
        description: description !== undefined ? (description ? description.trim() : null) : existing.description,
        type: type !== undefined ? type : existing.type,
        date: date !== undefined ? new Date(date) : existing.date,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
        location: location !== undefined ? (location ? location.trim() : null) : existing.location,
        isArchived: isArchived !== undefined ? isArchived : existing.isArchived,
      },
      include: {
        organization: { select: { id: true, name: true, logoIcon: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[ORG_EVENT_PUT_ERROR]", error);
    return NextResponse.json({ error: "Gagal memperbarui agenda" }, { status: 500 });
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

    const existing = await prisma.organizationEvent.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Event tidak ditemukan atau tidak berwenang" }, { status: 404 });
    }

    await prisma.organizationEvent.delete({ where: { id } });
    return NextResponse.json({ success: "Agenda berhasil dihapus" });
  } catch (error: any) {
    console.error("[ORG_EVENT_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Gagal menghapus agenda" }, { status: 500 });
  }
}
