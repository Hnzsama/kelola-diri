import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Bersihkan habit dan kategori lama
    await prisma.habit.deleteMany({
      where: { userId },
    });
    await prisma.habitCategory.deleteMany({
      where: { userId },
    });

    const categoriesData = [
      { name: "Akademik", icon: "📚", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-400/20" },
      { name: "Kesehatan", icon: "💪", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-400/20" },
      { name: "Spiritual", icon: "🕌", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-400/20" },
      { name: "Karier", icon: "💼", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/20" },
    ];

    const categoryMap: { [key: string]: string } = {};
    for (const cat of categoriesData) {
      const created = await prisma.habitCategory.create({
        data: {
          userId,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
        },
      });
      categoryMap[cat.name] = created.id;
    }

    const mockHabits = [
      {
        name: "Belajar Mandiri 1 Jam",
        description: "Review materi kuliah atau membaca jurnal/buku penunjang akademik.",
        categoryName: "Akademik",
        probability: 0.82,
      },
      {
        name: "Review Catatan Kuliah",
        description: "Membaca kembali catatan atau slide dosen sepulang kuliah.",
        categoryName: "Akademik",
        probability: 0.65,
      },
      {
        name: "Olahraga 30 Menit",
        description: "Jogging, push-up, atau stretching agar tubuh tetap bugar.",
        categoryName: "Kesehatan",
        probability: 0.42,
      },
      {
        name: "Tidur Cukup 7 Jam",
        description: "Menjaga ritme sirkadian dengan tidur sebelum pukul 23:00.",
        categoryName: "Kesehatan",
        probability: 0.58,
      },
      {
        name: "Sholat Tepat Waktu",
        description: "Mengutamakan ibadah di awal waktu secara disiplin.",
        categoryName: "Spiritual",
        probability: 0.90,
      },
      {
        name: "Latihan Coding React",
        description: "Latihan membuat komponen frontend dan mempelajari dokumentasi teknologi modern.",
        categoryName: "Karier",
        probability: 0.72,
      },
    ];

    const habits = [];
    for (const h of mockHabits) {
      const categoryId = categoryMap[h.categoryName];
      const habit = await prisma.habit.create({
        data: {
          userId,
          name: h.name,
          description: h.description,
          categoryId: categoryId || null,
          isActive: true,
        },
      });
      habits.push({ ...habit, probability: h.probability });
    }

    // Generate data log untuk 90 hari terakhir
    const REF_DATE = new Date("2026-06-14");
    const logsData = [];

    for (let i = 0; i < 90; i++) {
      const logDate = new Date(REF_DATE);
      logDate.setDate(REF_DATE.getDate() - i);
      logDate.setHours(0, 0, 0, 0);

      for (const h of habits) {
        // Menggunakan pseudo-random deterministik berdasarkan tanggal dan ID habit agar konsisten
        const hash = Math.sin(logDate.getTime() + h.id.charCodeAt(0)) * 10000;
        const rand = hash - Math.floor(hash);
        const completed = rand < h.probability;

        // Khusus hari ini (indeks i = 0), mari buat sebagian tidak tercentang agar dapat digunakan untuk demo checklist
        let isTodayCompleted = completed;
        if (i === 0) {
          isTodayCompleted = rand < 0.5; // 50% kemungkinan selesai hari ini
        }

        logsData.push({
          habitId: h.id,
          date: logDate,
          completed: isTodayCompleted,
        });
      }
    }

    // Input log ke database secara massal (bulk insert)
    await prisma.habitLog.createMany({
      data: logsData,
    });

    return NextResponse.json({
      success: "Data contoh habit tracker berhasil dibuat!",
      habitsCreated: habits.length,
      logsCreated: logsData.length,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[SEED_DUMMY_HABITS_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat data contoh habit tracker" },
      { status: 500 }
    );
  }
}
