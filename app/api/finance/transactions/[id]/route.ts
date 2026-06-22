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
    const { type, amount, categoryId, date, description, paymentMethod } = body;

    const tx = await prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!tx) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    if (type !== undefined && !["INCOME", "EXPENSE"].includes(type)) {
      return NextResponse.json({ error: "Tipe transaksi tidak valid" }, { status: 400 });
    }

    if (amount !== undefined && (typeof amount !== "number" || amount <= 0)) {
      return NextResponse.json({ error: "Jumlah nominal harus berupa angka positif" }, { status: 400 });
    }

    if (paymentMethod !== undefined && !["TUNAI", "NON_TUNAI"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Metode pembayaran tidak valid" }, { status: 400 });
    }

    if (categoryId !== undefined) {
      if (!categoryId) {
        return NextResponse.json({ error: "Kategori transaksi tidak boleh kosong" }, { status: 400 });
      }
      const categoryExists = await prisma.financeCategory.findFirst({
        where: { id: categoryId, userId },
      });
      if (!categoryExists) {
        return NextResponse.json({ error: "Kategori transaksi tidak ditemukan" }, { status: 404 });
      }
    }

    const updatedTx = await prisma.transaction.update({
      where: { id },
      data: {
        ...(type !== undefined ? { type } : {}),
        ...(amount !== undefined ? { amount } : {}),
        ...(categoryId !== undefined ? { categoryId } : {}),
        ...(date !== undefined ? { date: new Date(date) } : {}),
        ...(description !== undefined ? { description: description ? description.trim() : null } : {}),
        ...(paymentMethod !== undefined ? { paymentMethod } : {}),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(updatedTx);
  } catch (error: any) {
    console.error("[TRANSACTION_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui transaksi" },
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

    const tx = await prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!tx) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Transaksi berhasil dihapus" });
  } catch (error: any) {
    console.error("[TRANSACTION_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal menghapus transaksi" },
      { status: 500 }
    );
  }
}
