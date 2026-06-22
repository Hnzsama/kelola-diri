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
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const paidTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        description: {
          startsWith: "Pembayaran tagihan berulang:",
        },
      },
    });

    const bills = await prisma.recurringBill.findMany({
      where: { userId },
      orderBy: { dueDay: "asc" },
    });

    const billsWithPaidStatus = bills.map(bill => {
      const isPaidThisMonth = paidTransactions.some(
        tx => tx.description === `Pembayaran tagihan berulang: ${bill.name}`
      );
      return {
        ...bill,
        isPaidThisMonth,
      };
    });

    return NextResponse.json(billsWithPaidStatus);
  } catch (error: any) {
    console.error("[RECURRING_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data tagihan berulang" },
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
    const { name, amount, dueDay } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Nama tagihan wajib diisi" }, { status: 400 });
    }

    if (amount === undefined || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Nominal tagihan harus berupa angka positif" }, { status: 400 });
    }

    if (dueDay === undefined || typeof dueDay !== "number" || dueDay < 1 || dueDay > 31) {
      return NextResponse.json({ error: "Tanggal jatuh tempo bulanan harus antara 1-31" }, { status: 400 });
    }

    const newBill = await prisma.recurringBill.create({
      data: {
        userId,
        name: name.trim(),
        amount,
        dueDay,
        isActive: true,
      },
    });

    return NextResponse.json(newBill, { status: 201 });
  } catch (error: any) {
    console.error("[RECURRING_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat tagihan berulang baru" },
      { status: 500 }
    );
  }
}
