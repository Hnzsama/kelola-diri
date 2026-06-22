import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { amount, direction } = body;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Jumlah nominal tidak valid" }, { status: 400 });
    }

    if (!direction || !["TUNAI_TO_NON_TUNAI", "NON_TUNAI_TO_TUNAI"].includes(direction)) {
      return NextResponse.json({ error: "Arah transfer tidak valid" }, { status: 400 });
    }

    // Find or create "Transfer" category
    let category = await prisma.financeCategory.findFirst({
      where: {
        userId,
        name: {
          equals: "Transfer",
          mode: "insensitive",
        },
      },
    });

    if (!category) {
      category = await prisma.financeCategory.create({
        data: {
          userId,
          name: "Transfer",
          icon: "🔁",
          color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-400/30",
        },
      });
    }

    const isTunaiToNon = direction === "TUNAI_TO_NON_TUNAI";

    // Run both queries atomically inside a database transaction
    await prisma.$transaction([
      // 1. Source reduction (recorded as EXPENSE)
      prisma.transaction.create({
        data: {
          userId,
          type: "EXPENSE",
          amount: amountNum,
          categoryId: category.id,
          paymentMethod: isTunaiToNon ? "TUNAI" : "NON_TUNAI",
          description: isTunaiToNon ? "Alokasi saldo ke Non-Tunai" : "Alokasi saldo ke Tunai",
          date: new Date(),
        },
      }),
      // 2. Destination addition (recorded as INCOME)
      prisma.transaction.create({
        data: {
          userId,
          type: "INCOME",
          amount: amountNum,
          categoryId: category.id,
          paymentMethod: isTunaiToNon ? "NON_TUNAI" : "TUNAI",
          description: isTunaiToNon ? "Alokasi saldo dari Tunai" : "Alokasi saldo dari Non-Tunai",
          date: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ success: "Alokasi saldo berhasil dilakukan!" });
  } catch (error: any) {
    console.error("[TRANSFER_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal memproses alokasi saldo" },
      { status: 500 }
    );
  }
}
