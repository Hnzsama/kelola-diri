import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// PUT: Update membership (jabatan, periode, role)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const userId = (session.user as any).id;
    const body = await req.json();
    const { name, description, period, logoIcon, position, role } = body;

    // Cari membership user di organisasi ini
    const membership = await prisma.organizationMember.findFirst({
      where: { userId, organizationId: id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "Organisasi tidak ditemukan" }, { status: 404 });
    }

    // Update data organisasi dan membership sekaligus
    const [updatedOrg, updatedMembership] = await Promise.all([
      prisma.organization.update({
        where: { id },
        data: {
          name: name !== undefined ? name.trim() : membership.organization.name,
          description: description !== undefined ? (description ? description.trim() : null) : membership.organization.description,
          period: period !== undefined ? (period ? period.trim() : null) : membership.organization.period,
          logoIcon: logoIcon !== undefined ? logoIcon.trim() : membership.organization.logoIcon,
        },
      }),
      prisma.organizationMember.update({
        where: { id: membership.id },
        data: {
          position: position !== undefined ? (position ? position.trim() : null) : membership.position,
          period: period !== undefined ? (period ? period.trim() : null) : membership.period,
          role: role !== undefined ? role : membership.role,
        },
      }),
    ]);

    return NextResponse.json({ organization: updatedOrg, membership: updatedMembership });
  } catch (error: any) {
    console.error("[ORG_PUT_ERROR]", error);
    return NextResponse.json({ error: "Gagal memperbarui organisasi" }, { status: 500 });
  }
}

// DELETE: Hapus membership (keluar dari organisasi)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const userId = (session.user as any).id;

    // Cari membership user
    const membership = await prisma.organizationMember.findFirst({
      where: { userId, organizationId: id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Organisasi tidak ditemukan" }, { status: 404 });
    }

    // Hapus membership, bukan organisasinya
    await prisma.organizationMember.delete({
      where: { id: membership.id },
    });

    return NextResponse.json({ success: "Berhasil keluar dari organisasi" });
  } catch (error: any) {
    console.error("[ORG_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Gagal menghapus organisasi" }, { status: 500 });
  }
}
