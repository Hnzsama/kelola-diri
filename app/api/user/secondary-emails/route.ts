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
      include: { secondaryEmails: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user.secondaryEmails || []);
  } catch (error: any) {
    console.error("GET Secondary Emails Error:", error);
    return NextResponse.json({ error: "Gagal memuat email sekunder" }, { status: 500 });
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
    const { email, label } = body;

    // Validate email format and label presence
    if (!email || !label) {
      return NextResponse.json({ error: "Email dan label wajib diisi" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
    }

    if (label.trim().length === 0 || label.length > 50) {
      return NextResponse.json({ error: "Label tidak valid (maksimal 50 karakter)" }, { status: 400 });
    }

    const newSec = await prisma.secondaryEmail.create({
      data: {
        userId: user.id,
        email: email.trim().toLowerCase(),
        label: label.trim(),
        deadlineTugas: false,
        habitReminder: false,
        agendaOrganisasi: false,
        budgetWarning: false,
        weeklyReview: false,
        dailyFinanceReport: false,
        monthlyReport: false,
        transactionEmail: false,
      },
    });

    return NextResponse.json({ success: "Email sekunder berhasil ditambahkan", email: newSec });
  } catch (error: any) {
    console.error("POST Secondary Email Error:", error);
    return NextResponse.json({ error: "Gagal menambahkan email sekunder" }, { status: 500 });
  }
}
