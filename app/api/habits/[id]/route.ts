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
    const { name, description, categoryId, isActive } = body;

    // Verify ownership
    const existingHabit = await prisma.habit.findUnique({
      where: { id },
    });

    if (!existingHabit || existingHabit.userId !== userId) {
      return NextResponse.json(
        { error: "Habit tidak ditemukan atau Anda tidak berwenang" },
        { status: 404 }
      );
    }

    const updatedHabit = await prisma.habit.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existingHabit.name,
        description: description !== undefined ? (description ? description.trim() : null) : existingHabit.description,
        categoryId: categoryId !== undefined ? categoryId : existingHabit.categoryId,
        isActive: isActive !== undefined ? isActive : existingHabit.isActive,
      },
    });

    return NextResponse.json(updatedHabit);
  } catch (error: any) {
    console.error("[HABIT_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui kebiasaan" },
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
    const existingHabit = await prisma.habit.findUnique({
      where: { id },
    });

    if (!existingHabit || existingHabit.userId !== userId) {
      return NextResponse.json(
        { error: "Habit tidak ditemukan atau Anda tidak berwenang" },
        { status: 404 }
      );
    }

    await prisma.habit.delete({
      where: { id },
    });

    return NextResponse.json({ success: "Habit berhasil dihapus" });
  } catch (error: any) {
    console.error("[HABIT_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal menghapus kebiasaan" },
      { status: 500 }
    );
  }
}
