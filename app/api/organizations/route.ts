import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Ambil semua organisasi yang diikuti user (via membership)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            members: { select: { id: true } },
            events: {
              where: { isArchived: false },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json(memberships);
  } catch (error: any) {
    console.error("[ORG_GET_ERROR]", error);
    return NextResponse.json({ error: "Gagal memuat data organisasi" }, { status: 500 });
  }
}

// POST: Tambah organisasi baru + otomatis jadikan user sebagai anggota
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const body = await req.json();
    const { name, description, period, logoIcon, position, role } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Nama organisasi wajib diisi" }, { status: 400 });
    }

    // Buat organisasi dan langsung tambahkan user sebagai anggota
    const organization = await prisma.organization.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        period: period ? period.trim() : null,
        logoIcon: logoIcon ? logoIcon.trim() : "🏢",
        members: {
          create: {
            userId,
            role: role || "MEMBER",
            position: position ? position.trim() : null,
            period: period ? period.trim() : null,
          },
        },
      },
      include: {
        members: { where: { userId } },
      },
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error: any) {
    console.error("[ORG_POST_ERROR]", error);
    return NextResponse.json({ error: "Gagal membuat organisasi" }, { status: 500 });
  }
}
