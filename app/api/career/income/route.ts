import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
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

    const incomes = await prisma.income.findMany({
      where: { userId: user.id },
      include: { invoice: true },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(incomes);
  } catch (error: any) {
    console.error("GET Incomes Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data pendapatan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
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

    const body = await req.json();
    const { source, amount, date, notes } = body;

    if (!source || amount === undefined || !date) {
      return NextResponse.json({ error: "Kolom wajib (Sumber, Nominal, Tanggal) harus diisi" }, { status: 400 });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Nominal pendapatan tidak valid" }, { status: 400 });
    }

    // Save income record and create corresponding finance transaction in a transaction block
    let newIncome;
    await prisma.$transaction(async (tx) => {
      newIncome = await tx.income.create({
        data: {
          userId: user.id,
          source,
          amount: amountNum,
          date: new Date(date),
          notes: notes ? notes.trim() : null,
        },
      });

      // Find or create "Freelance" or "Karier" category
      const categoryName = source === "FREELANCE" ? "Freelance" : "Gaji / Pendapatan";
      let financeCategory = await tx.financeCategory.findFirst({
        where: { userId: user.id, name: categoryName },
      });
      if (!financeCategory) {
        financeCategory = await tx.financeCategory.create({
          data: {
            userId: user.id,
            name: categoryName,
            icon: "💼",
            color: "#10b981",
          },
        });
      }

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "INCOME",
          amount: amountNum,
          categoryId: financeCategory.id,
          description: notes ? `${source}: ${notes.trim()}` : `Pendapatan Karier (${source})`,
          date: new Date(date),
        },
      });
    });

    return NextResponse.json({ success: "Pendapatan berhasil dicatat", income: newIncome }, { status: 201 });
  } catch (error: any) {
    console.error("POST Manual Income Error:", error);
    return NextResponse.json({ error: "Gagal mencatat pendapatan" }, { status: 500 });
  }
}
