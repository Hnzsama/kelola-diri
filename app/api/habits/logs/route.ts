import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { habitId, completed, date } = body;

    if (!habitId) {
      return NextResponse.json({ error: "habitId wajib diisi" }, { status: 400 });
    }

    // Verify ownership of the habit
    const existingHabit = await prisma.habit.findUnique({
      where: { id: habitId },
    });

    if (!existingHabit || existingHabit.userId !== userId) {
      return NextResponse.json(
        { error: "Habit tidak ditemukan atau Anda tidak berwenang" },
        { status: 404 }
      );
    }

    // Parse date or default to current date
    const targetDate = date ? new Date(date) : new Date();
    // Normalize date to midnight to fit PostgreSQL DATE column type
    targetDate.setHours(0, 0, 0, 0);

    const log = await prisma.habitLog.upsert({
      where: {
        habitId_date: {
          habitId,
          date: targetDate,
        },
      },
      update: {
        completed: !!completed,
      },
      create: {
        habitId,
        date: targetDate,
        completed: !!completed,
      },
    });

    return NextResponse.json(log);
  } catch (error: any) {
    console.error("[HABITS_LOGS_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal menyimpan catatan harian" },
      { status: 500 }
    );
  }
}
