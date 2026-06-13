import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const now = new Date();
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const y = year ? parseInt(year) : now.getFullYear();

    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        month: m,
        year: y,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(budgets);
  } catch (error: any) {
    console.error("[BUDGETS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data anggaran" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { categoryId, amount, month, year } = body;

    if (!categoryId) {
      return NextResponse.json({ error: "Kategori anggaran wajib diisi" }, { status: 400 });
    }

    const categoryExists = await prisma.financeCategory.findFirst({
      where: { id: categoryId, userId },
    });

    if (!categoryExists) {
      return NextResponse.json({ error: "Kategori anggaran tidak ditemukan" }, { status: 404 });
    }

    if (amount === undefined || typeof amount !== "number" || amount < 0) {
      return NextResponse.json({ error: "Jumlah nominal anggaran tidak valid" }, { status: 400 });
    }

    const now = new Date();
    const m = month !== undefined ? Number(month) : now.getMonth() + 1;
    const y = year !== undefined ? Number(year) : now.getFullYear();

    if (m < 1 || m > 12) {
      return NextResponse.json({ error: "Bulan tidak valid (1-12)" }, { status: 400 });
    }

    // Upsert budget
    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId,
          month: m,
          year: y,
        },
      },
      update: {
        amount,
      },
      create: {
        userId,
        categoryId,
        amount,
        month: m,
        year: y,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(budget);
  } catch (error: any) {
    console.error("[BUDGETS_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal menyimpan anggaran bulanan" },
      { status: 500 }
    );
  }
}
