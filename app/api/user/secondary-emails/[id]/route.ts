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
    const {
      email,
      label,
      deadlineTugas,
      habitReminder,
      agendaOrganisasi,
      budgetWarning,
      weeklyReview,
      dailyFinanceReport,
      monthlyReport,
      transactionEmail,
    } = body;

    // Verify ownership
    const existing = await prisma.secondaryEmail.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Data tidak ditemukan atau bukan milik Anda" }, { status: 404 });
    }

    // Validation if values are passed
    let updatedEmail = existing.email;
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
      }
      updatedEmail = email.trim().toLowerCase();
    }

    let updatedLabel = existing.label;
    if (label !== undefined) {
      if (label.trim().length === 0 || label.length > 50) {
        return NextResponse.json({ error: "Label tidak valid (maksimal 50 karakter)" }, { status: 400 });
      }
      updatedLabel = label.trim();
    }

    const updated = await prisma.secondaryEmail.update({
      where: { id },
      data: {
        email: updatedEmail,
        label: updatedLabel,
        deadlineTugas: deadlineTugas ?? existing.deadlineTugas,
        habitReminder: habitReminder ?? existing.habitReminder,
        agendaOrganisasi: agendaOrganisasi ?? existing.agendaOrganisasi,
        budgetWarning: budgetWarning ?? existing.budgetWarning,
        weeklyReview: weeklyReview ?? existing.weeklyReview,
        dailyFinanceReport: dailyFinanceReport ?? existing.dailyFinanceReport,
        monthlyReport: monthlyReport ?? existing.monthlyReport,
        transactionEmail: transactionEmail ?? existing.transactionEmail,
      },
    });

    return NextResponse.json({ success: "Email sekunder berhasil diperbarui", email: updated });
  } catch (error: any) {
    console.error("PUT Secondary Email Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui email sekunder" }, { status: 500 });
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
    const existing = await prisma.secondaryEmail.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Data tidak ditemukan atau bukan milik Anda" }, { status: 404 });
    }

    await prisma.secondaryEmail.delete({
      where: { id },
    });

    return NextResponse.json({ success: "Email sekunder berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE Secondary Email Error:", error);
    return NextResponse.json({ error: "Gagal menghapus email sekunder" }, { status: 500 });
  }
}
