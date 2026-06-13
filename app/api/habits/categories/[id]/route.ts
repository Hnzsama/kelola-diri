import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

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
    const { name, icon, color } = body;

    // Verify ownership
    const existingCategory = await prisma.habitCategory.findUnique({
      where: { id },
    });

    if (!existingCategory || existingCategory.userId !== userId) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan atau Anda tidak berwenang" },
        { status: 404 }
      );
    }

    // Periksa apakah nama kategori baru duplikat dengan kategori lain milik user
    if (name && name.trim() !== existingCategory.name) {
      const duplicate = await prisma.habitCategory.findFirst({
        where: {
          userId,
          name: name.trim(),
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Kategori dengan nama ini sudah ada" },
          { status: 400 }
        );
      }
    }

    const updatedCategory = await prisma.habitCategory.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existingCategory.name,
        icon: icon !== undefined ? icon.trim() : existingCategory.icon,
        color: color !== undefined ? color : existingCategory.color,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error: any) {
    console.error("[HABIT_CATEGORY_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui kategori" },
      { status: 500 }
    );
  }
}

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

    // Verify ownership
    const existingCategory = await prisma.habitCategory.findUnique({
      where: { id },
    });

    if (!existingCategory || existingCategory.userId !== userId) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan atau Anda tidak berwenang" },
        { status: 404 }
      );
    }

    // Hapus kategori (Prisma akan melakukan SetNull pada Habits yang terhubung jika schema onDelete: SetNull)
    await prisma.habitCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: "Kategori berhasil dihapus" });
  } catch (error: any) {
    console.error("[HABIT_CATEGORY_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal menghapus kategori" },
      { status: 500 }
    );
  }
}
