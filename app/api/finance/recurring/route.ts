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
    const bills = await prisma.recurringBill.findMany({
      where: { userId },
      orderBy: { dueDay: "asc" },
    });

    return NextResponse.json(bills);
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
