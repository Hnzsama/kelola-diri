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

    const invoices = await prisma.invoice.findMany({
      where: { userId: user.id },
      include: {
        project: {
          include: { client: true }
        }
      },
      orderBy: { issuedDate: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("GET Invoices Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data invoice" }, { status: 500 });
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
    const { projectId, clientId, invoiceNumber, amount, issuedDate, dueDate } = body;

    if (!projectId || !clientId || amount === undefined || !issuedDate || !dueDate) {
      return NextResponse.json({ error: "Kolom wajib (Proyek, Klien, Nominal, Tanggal Terbit, Jatuh Tempo) harus diisi" }, { status: 400 });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Nominal invoice tidak valid" }, { status: 400 });
    }

    // Verify project and client ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });
    if (!project) {
      return NextResponse.json({ error: "Proyek tidak ditemukan atau bukan milik Anda" }, { status: 400 });
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: user.id },
    });
    if (!client) {
      return NextResponse.json({ error: "Klien tidak ditemukan atau bukan milik Anda" }, { status: 400 });
    }

    // Generate invoice number if not provided
    let finalInvoiceNumber = invoiceNumber ? invoiceNumber.trim() : "";
    if (!finalInvoiceNumber) {
      const year = new Date(issuedDate).getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      finalInvoiceNumber = `INV-${year}-${rand}`;
    }

    // Verify invoice number unique
    const duplicate = await prisma.invoice.findFirst({
      where: { invoiceNumber: finalInvoiceNumber },
    });
    if (duplicate) {
      return NextResponse.json({ error: "Nomor invoice sudah digunakan, gunakan nomor lain" }, { status: 400 });
    }

    const newInvoice = await prisma.invoice.create({
      data: {
        userId: user.id,
        projectId,
        clientId,
        invoiceNumber: finalInvoiceNumber,
        amount: amountNum,
        issuedDate: new Date(issuedDate),
        dueDate: new Date(dueDate),
        status: "DRAFT",
      },
    });

    return NextResponse.json({ success: "Invoice berhasil dibuat", invoice: newInvoice }, { status: 201 });
  } catch (error: any) {
    console.error("POST Invoice Error:", error);
    return NextResponse.json({ error: "Gagal membuat invoice" }, { status: 500 });
  }
}
