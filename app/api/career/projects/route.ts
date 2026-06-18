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

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      include: {
        client: true,
        tasks: true,
        invoices: true,
      },
      orderBy: { endDate: "asc" },
    });

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error("GET Projects Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data proyek" }, { status: 500 });
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
    const { clientId, name, description, contractValue, startDate, endDate, financialGoalId } = body;

    if (!clientId || !name || contractValue === undefined || !startDate || !endDate) {
      return NextResponse.json({ error: "Kolom wajib (Klien, Nama, Kontrak, Tanggal Mulai & Tenggat) harus diisi" }, { status: 400 });
    }

    const valueNum = parseFloat(contractValue);
    if (isNaN(valueNum) || valueNum < 0) {
      return NextResponse.json({ error: "Nilai kontrak tidak valid" }, { status: 400 });
    }

    // Verify client ownership
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: user.id },
    });
    if (!client) {
      return NextResponse.json({ error: "Klien tidak ditemukan atau bukan milik Anda" }, { status: 400 });
    }

    // Verify financialGoal ownership if provided
    if (financialGoalId) {
      const goal = await prisma.financialGoal.findFirst({
        where: { id: financialGoalId, userId: user.id },
      });
      if (!goal) {
        return NextResponse.json({ error: "Target tabungan tidak ditemukan atau bukan milik Anda" }, { status: 400 });
      }
    }

    const newProject = await prisma.project.create({
      data: {
        userId: user.id,
        clientId,
        name: name.trim(),
        description: description ? description.trim() : null,
        contractValue: valueNum,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "PLANNING",
        financialGoalId: financialGoalId || null,
      },
      include: {
        client: true,
      },
    });

    return NextResponse.json({ success: "Proyek berhasil dibuat", project: newProject }, { status: 201 });
  } catch (error: any) {
    console.error("POST Project Error:", error);
    return NextResponse.json({ error: "Gagal membuat proyek" }, { status: 500 });
  }
}
