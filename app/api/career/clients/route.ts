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

    const clients = await prisma.client.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(clients);
  } catch (error: any) {
    console.error("GET Clients Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data klien" }, { status: 500 });
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
    const { name, company, email, phone, notes } = body;

    if (!name || !company || !email || !phone) {
      return NextResponse.json({ error: "Kolom wajib (Nama, Perusahaan, Email, Telepon) harus diisi" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
    }

    const newClient = await prisma.client.create({
      data: {
        userId: user.id,
        name: name.trim(),
        company: company.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        notes: notes ? notes.trim() : null,
      },
    });

    return NextResponse.json({ success: "Klien berhasil ditambahkan", client: newClient }, { status: 201 });
  } catch (error: any) {
    console.error("POST Client Error:", error);
    return NextResponse.json({ error: "Gagal menambahkan klien" }, { status: 500 });
  }
}
