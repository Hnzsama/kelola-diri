import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const body = await req.json();
    const { name, company, email, phone, notes } = body;

    // Verify ownership
    const existingClient = await prisma.client.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Klien tidak ditemukan atau bukan milik Anda" }, { status: 404 });
    }

    let updatedEmail = existingClient.email;
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
      }
      updatedEmail = email.trim().toLowerCase();
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existingClient.name,
        company: company !== undefined ? company.trim() : existingClient.company,
        email: updatedEmail,
        phone: phone !== undefined ? phone.trim() : existingClient.phone,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : existingClient.notes,
      },
    });

    return NextResponse.json({ success: "Klien berhasil diperbarui", client: updatedClient });
  } catch (error: any) {
    console.error("PUT Client Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui klien" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;

    // Verify ownership
    const existingClient = await prisma.client.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Klien tidak ditemukan atau bukan milik Anda" }, { status: 404 });
    }

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ success: "Klien berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE Client Error:", error);
    return NextResponse.json({ error: "Gagal menghapus klien" }, { status: 500 });
  }
}
