import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id: projectId } = await params;
    const body = await req.json();
    const { title, description, dueDate, priority } = body;

    if (!title || !dueDate) {
      return NextResponse.json({ error: "Judul tugas dan tenggat waktu wajib diisi" }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Proyek tidak ditemukan atau bukan milik Anda" }, { status: 404 });
    }

    const newTask = await prisma.projectTask.create({
      data: {
        projectId,
        title: title.trim(),
        description: description ? description.trim() : null,
        dueDate: new Date(dueDate),
        priority: priority || "MEDIUM",
        status: "TODO",
      },
    });

    return NextResponse.json({ success: "Tugas proyek berhasil ditambahkan", task: newTask }, { status: 201 });
  } catch (error: any) {
    console.error("POST Project Task Error:", error);
    return NextResponse.json({ error: "Gagal membuat tugas proyek" }, { status: 500 });
  }
}
