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
      include: { notificationPreference: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let preferences = user.notificationPreference;

    if (!preferences) {
      // Create defaults
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: user.id,
          deadlineTugas: true,
          habitReminder: true,
          agendaOrganisasi: true,
          budgetWarning: true,
          weeklyReview: true,
          dailyFinanceReport: false,
          monthlyReport: false,
        },
      });
    }

    return NextResponse.json(preferences);
  } catch (error: any) {
    console.error("GET Notification Preferences Error:", error);
    return NextResponse.json({ error: "Gagal memuat preferensi notifikasi" }, { status: 500 });
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
    const {
      deadlineTugas,
      habitReminder,
      agendaOrganisasi,
      budgetWarning,
      weeklyReview,
      dailyFinanceReport,
      monthlyReport,
    } = body;

    const updated = await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        deadlineTugas: deadlineTugas ?? true,
        habitReminder: habitReminder ?? true,
        agendaOrganisasi: agendaOrganisasi ?? true,
        budgetWarning: budgetWarning ?? true,
        weeklyReview: weeklyReview ?? true,
        dailyFinanceReport: dailyFinanceReport ?? false,
        monthlyReport: monthlyReport ?? false,
      },
      update: {
        deadlineTugas: deadlineTugas ?? true,
        habitReminder: habitReminder ?? true,
        agendaOrganisasi: agendaOrganisasi ?? true,
        budgetWarning: budgetWarning ?? true,
        weeklyReview: weeklyReview ?? true,
        dailyFinanceReport: dailyFinanceReport ?? false,
        monthlyReport: monthlyReport ?? false,
      },
    });

    return NextResponse.json({ success: "Preferensi notifikasi berhasil disimpan!", preferences: updated });
  } catch (error: any) {
    console.error("POST Notification Preferences Error:", error);
    return NextResponse.json({ error: "Gagal menyimpan preferensi notifikasi" }, { status: 500 });
  }
}
