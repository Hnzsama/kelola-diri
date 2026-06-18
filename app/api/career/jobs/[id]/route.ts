import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const body = await req.json();
    const { companyName, position, jobLink, appliedDate, status, notes } = body;

    // Verify ownership
    const existing = await prisma.jobApplication.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lamaran kerja tidak ditemukan atau bukan milik Anda" }, { status: 404 });
    }

    const updated = await prisma.jobApplication.update({
      where: { id },
      data: {
        companyName: companyName !== undefined ? companyName.trim() : existing.companyName,
        position: position !== undefined ? position.trim() : existing.position,
        jobLink: jobLink !== undefined ? (jobLink ? jobLink.trim() : null) : existing.jobLink,
        appliedDate: appliedDate !== undefined ? new Date(appliedDate) : existing.appliedDate,
        status: status !== undefined ? status : existing.status,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : existing.notes,
      },
    });

    return NextResponse.json({ success: "Lamaran kerja berhasil diperbarui", job: updated });
  } catch (error: any) {
    console.error("PUT Job Application Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui lamaran kerja" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.jobApplication.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lamaran kerja tidak ditemukan atau bukan milik Anda" }, { status: 404 });
    }

    await prisma.jobApplication.delete({
      where: { id },
    });

    return NextResponse.json({ success: "Lamaran kerja berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE Job Application Error:", error);
    return NextResponse.json({ error: "Gagal menghapus lamaran kerja" }, { status: 500 });
  }
}
