import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
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
    const { name, amount, dueDay, isActive } = body;

    const existingBill = await prisma.recurringBill.findFirst({
      where: { id, userId },
    });

    if (!existingBill) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
    }

    const updatedBill = await prisma.recurringBill.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(amount !== undefined ? { amount } : {}),
        ...(dueDay !== undefined ? { dueDay } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return NextResponse.json(updatedBill);
  } catch (error: any) {
    console.error("[RECURRING_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui tagihan berulang" },
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

    const existingBill = await prisma.recurringBill.findFirst({
      where: { id, userId },
    });

    if (!existingBill) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
    }

    await prisma.recurringBill.delete({
      where: { id },
    });

    return NextResponse.json({ success: "Tagihan berhasil dihapus" });
  } catch (error: any) {
    console.error("[RECURRING_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal menghapus tagihan berulang" },
      { status: 500 }
    );
  }
}
