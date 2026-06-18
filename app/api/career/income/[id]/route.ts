import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

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
    const existing = await prisma.income.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Pendapatan tidak ditemukan atau bukan milik Anda" }, { status: 404 });
    }

    await prisma.income.delete({
      where: { id },
    });

    return NextResponse.json({ success: "Pendapatan berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE Income Error:", error);
    return NextResponse.json({ error: "Gagal menghapus pendapatan" }, { status: 500 });
  }
}
