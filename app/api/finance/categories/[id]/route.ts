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
    const { name, icon, color } = body;

    const category = await prisma.financeCategory.findFirst({
      where: { id, userId },
    });

    if (!category) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return NextResponse.json({ error: "Nama kategori tidak boleh kosong" }, { status: 400 });
      }

      // Check name conflict
      const nameConflict = await prisma.financeCategory.findFirst({
        where: {
          userId,
          id: { not: id },
          name: {
            equals: name.trim(),
            mode: "insensitive",
          },
        },
      });

      if (nameConflict) {
        return NextResponse.json({ error: "Kategori dengan nama tersebut sudah ada" }, { status: 400 });
      }
    }

    const updated = await prisma.financeCategory.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(icon !== undefined ? { icon: icon || "💰" } : {}),
        ...(color !== undefined ? { color: color || "bg-muted text-muted-foreground border-border/30" } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[FINANCE_CATEGORY_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui kategori" },
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

    const category = await prisma.financeCategory.findFirst({
      where: { id, userId },
    });

    if (!category) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    // Restriction check: look for transactions
    const txCount = await prisma.transaction.count({
      where: { categoryId: id },
    });

    if (txCount > 0) {
      return NextResponse.json(
        { error: `Kategori tidak bisa dihapus karena masih digunakan oleh ${txCount} catatan transaksi. Ubah atau hapus transaksi tersebut terlebih dahulu.` },
        { status: 400 }
      );
    }

    // Restriction check: look for budgets
    const budgetCount = await prisma.budget.count({
      where: { categoryId: id },
    });

    if (budgetCount > 0) {
      return NextResponse.json(
        { error: `Kategori tidak bisa dihapus karena telah diatur dalam ${budgetCount} batas anggaran bulanan. Hapus anggaran kategori ini terlebih dahulu.` },
        { status: 400 }
      );
    }

    await prisma.financeCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Kategori berhasil dihapus" });
  } catch (error: any) {
    console.error("[FINANCE_CATEGORY_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal menghapus kategori" },
      { status: 500 }
    );
  }
}
