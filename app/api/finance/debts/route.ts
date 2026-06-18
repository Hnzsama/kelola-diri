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
    const debts = await prisma.debtReceivable.findMany({
      where: { userId },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(debts);
  } catch (error: any) {
    console.error("[DEBTS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data hutang & piutang" },
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
    const { type, contact, amount, purpose, dueDate } = body;

    if (!type || !["DEBT", "RECEIVABLE"].includes(type)) {
      return NextResponse.json({ error: "Tipe harus berupa DEBT atau RECEIVABLE" }, { status: 400 });
    }

    if (!contact || typeof contact !== "string" || contact.trim() === "") {
      return NextResponse.json({ error: "Nama kontak wajib diisi" }, { status: 400 });
    }

    if (amount === undefined || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Jumlah nominal harus angka positif" }, { status: 400 });
    }

    if (!purpose || typeof purpose !== "string" || purpose.trim() === "") {
      return NextResponse.json({ error: "Tujuan/Untuk wajib diisi" }, { status: 400 });
    }

    if (!dueDate) {
      return NextResponse.json({ error: "Tanggal jatuh tempo wajib ditentukan" }, { status: 400 });
    }

    const newDebt = await prisma.debtReceivable.create({
      data: {
        userId,
        type,
        contact: contact.trim(),
        amount,
        purpose: purpose.trim(),
        dueDate: new Date(dueDate),
        status: "PENDING",
      },
    });

    return NextResponse.json(newDebt, { status: 201 });
  } catch (error: any) {
    console.error("[DEBTS_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat catatan hutang/piutang baru" },
      { status: 500 }
    );
  }
}
