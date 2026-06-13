import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Semua tugas kepanitiaan milik user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const eventId = searchParams.get("eventId");

    const tasks = await prisma.organizationTask.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
        ...(eventId ? { eventId } : {}),
      },
      include: {
        event: {
          include: {
            organization: { select: { id: true, name: true, logoIcon: true } },
          },
        },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error("[ORG_TASKS_GET_ERROR]", error);
    return NextResponse.json({ error: "Gagal memuat tugas kepanitiaan" }, { status: 500 });
  }
}

// POST: Buat tugas baru
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const body = await req.json();
    const { eventId, title, description, dueDate, priority, status } = body;

    if (!title || title.trim() === "") {
      return NextResponse.json({ error: "Judul tugas wajib diisi" }, { status: 400 });
    }

    // Jika eventId diberikan, pastikan user adalah anggota organisasi dari event tersebut
    if (eventId) {
      const event = await prisma.organizationEvent.findUnique({
        where: { id: eventId },
        select: { organizationId: true },
      });
      if (event) {
        const membership = await prisma.organizationMember.findFirst({
          where: { userId, organizationId: event.organizationId },
        });
        if (!membership) {
          return NextResponse.json({ error: "Anda bukan anggota organisasi terkait" }, { status: 403 });
        }
      }
    }

    const task = await prisma.organizationTask.create({
      data: {
        userId,
        eventId: eventId || null,
        title: title.trim(),
        description: description ? description.trim() : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || "MEDIUM",
        status: status || "TODO",
      },
      include: {
        event: {
          include: {
            organization: { select: { id: true, name: true, logoIcon: true } },
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error("[ORG_TASKS_POST_ERROR]", error);
    return NextResponse.json({ error: "Gagal membuat tugas" }, { status: 500 });
  }
}
