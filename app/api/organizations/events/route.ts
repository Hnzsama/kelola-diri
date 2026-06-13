import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Ambil semua event organisasi milik user (via membership)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const archived = searchParams.get("archived") === "true";
    const orgId = searchParams.get("orgId");

    // Ambil semua organisasi yang diikuti user
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      select: { organizationId: true },
    });
    const orgIds = memberships.map((m) => m.organizationId);

    const events = await prisma.organizationEvent.findMany({
      where: {
        organizationId: { in: orgIds },
        isArchived: archived,
        ...(orgId ? { organizationId: orgId } : {}),
      },
      include: {
        organization: { select: { id: true, name: true, logoIcon: true } },
        tasks: { where: { userId }, select: { id: true, status: true } },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(events);
  } catch (error: any) {
    console.error("[ORG_EVENTS_GET_ERROR]", error);
    return NextResponse.json({ error: "Gagal memuat agenda" }, { status: 500 });
  }
}

// POST: Buat event baru
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const body = await req.json();
    const { organizationId, title, description, type, date, endDate, location } = body;

    if (!organizationId || !title || !date) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Pastikan user adalah anggota organisasi tersebut
    const membership = await prisma.organizationMember.findFirst({
      where: { userId, organizationId },
    });
    if (!membership) {
      return NextResponse.json({ error: "Anda bukan anggota organisasi ini" }, { status: 403 });
    }

    const event = await prisma.organizationEvent.create({
      data: {
        organizationId,
        userId,
        title: title.trim(),
        description: description ? description.trim() : null,
        type: type || "OTHER",
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        location: location ? location.trim() : null,
      },
      include: {
        organization: { select: { id: true, name: true, logoIcon: true } },
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error("[ORG_EVENTS_POST_ERROR]", error);
    return NextResponse.json({ error: "Gagal membuat agenda" }, { status: 500 });
  }
}
