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

    // Clean up old goals, milestones, and reviews for this user
    await prisma.goalProgressReview.deleteMany({
      where: { userId },
    });
    // GoalMilestone cascades via Goal or we can delete manually
    await prisma.goalMilestone.deleteMany({
      where: {
        goal: { userId },
      },
    });
    await prisma.goal.deleteMany({
      where: { userId },
    });

    const goalsData = [
      {
        title: "IPK 3.75",
        description: "Mencapai IPK 3.75 pada semester ini sebagai syarat mendaftar beasiswa internasional.",
        category: "ACADEMIC",
        emoji: "🎯",
        targetDate: new Date("2026-12-31"),
        status: "ACTIVE",
        milestones: [
          { title: "Lulus Semester 5 dengan nilai minimal B+", isCompleted: true, order: 0 },
          { title: "Selesaikan Tugas Akhir Bab 1-3", isCompleted: true, order: 1 },
          { title: "Lulus Ujian Tengah Semester dengan nilai A", isCompleted: true, order: 2 },
          { title: "Submit Proposal Tugas Akhir", isCompleted: false, order: 3 },
          { title: "Ujian Akhir Semester dengan nilai memuaskan", isCompleted: false, order: 4 },
        ],
        reviews: [
          { month: 4, year: 2026, progress: 20, note: "Fokus belajar di perpustakaan secara rutin setiap sore." },
          { month: 5, year: 2026, progress: 40, note: "Draft Bab 1-3 Tugas Akhir selesai ditulis dan siap bimbingan." },
          { month: 6, year: 2026, progress: 60, note: "Menyiapkan berkas UAS dan menyempurnakan draf proposal." },
        ],
      },
      {
        title: "Menjadi Ketua Divisi IT",
        description: "Mempersiapkan diri, kompetensi, dan visi-misi untuk mencalonkan diri sebagai Ketua Divisi IT di Himpunan Mahasiswa.",
        category: "ORGANIZATION",
        emoji: "💻",
        targetDate: new Date("2027-06-30"),
        status: "ACTIVE",
        milestones: [
          { title: "Ikuti Pelatihan Kepemimpinan Organisasi", isCompleted: true, order: 0 },
          { title: "Rancang draft Program Kerja IT Unggulan", isCompleted: false, order: 1 },
          { title: "Diskusi & interview dengan Ketua Divisi saat ini", isCompleted: false, order: 2 },
          { title: "Ajukan visi-misi dalam forum musyawarah mahasiswa", isCompleted: false, order: 3 },
        ],
        reviews: [
          { month: 5, year: 2026, progress: 25, note: "Pelatihan kepemimpinan selesai diikuti dengan hasil memuaskan." },
          { month: 6, year: 2026, progress: 25, note: "Mulai menyusun kerangka program kerja IT untuk periode depan." },
        ],
      },
      {
        title: "Kuasai React & Next.js",
        description: "Mempelajari ekosistem React modern & Next.js App Router secara mendalam untuk mempersiapkan portofolio magang Web Developer.",
        category: "CAREER",
        emoji: "🚀",
        targetDate: new Date("2026-09-30"),
        status: "ACTIVE",
        milestones: [
          { title: "Pelajari fundamental HTML, CSS, dan JavaScript Modern", isCompleted: true, order: 0 },
          { title: "Selesaikan Course React JS Dasar (Codedamn / Udemy)", isCompleted: true, order: 1 },
          { title: "Bangun 3 Project Portofolio sederhana dengan React", isCompleted: true, order: 2 },
          { title: "Mulai mempelajari Next.js App Router dan Tailwind CSS", isCompleted: false, order: 3 },
          { title: "Deploy website portofolio pribadi ke Vercel", isCompleted: false, order: 4 },
          { title: "Melamar lowongan magang Web Developer di 5 perusahaan", isCompleted: false, order: 5 },
        ],
        reviews: [
          { month: 4, year: 2026, progress: 17, note: "Pemahaman JS Modern sudah bagus, mulai masuk ke React." },
          { month: 5, year: 2026, progress: 33, note: "React dasar rampung, sedang membuat portofolio sederhana." },
          { month: 6, year: 2026, progress: 50, note: "React portfolio selesai 3 buah. Siap beralih ke Next.js." },
        ],
      },
    ];

    for (const gd of goalsData) {
      // Calculate progress automatically based on completed milestones
      const total = gd.milestones.length;
      const completed = gd.milestones.filter((m) => m.isCompleted).length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      const createdGoal = await prisma.goal.create({
        data: {
          userId,
          title: gd.title,
          description: gd.description,
          category: gd.category,
          emoji: gd.emoji,
          targetDate: gd.targetDate,
          status: gd.status,
          progress,
        },
      });

      // Create milestones
      await prisma.goalMilestone.createMany({
        data: gd.milestones.map((m) => ({
          goalId: createdGoal.id,
          title: m.title,
          isCompleted: m.isCompleted,
          order: m.order,
        })),
      });

      // Create reviews
      await prisma.goalProgressReview.createMany({
        data: gd.reviews.map((r) => ({
          goalId: createdGoal.id,
          userId,
          month: r.month,
          year: r.year,
          progress: r.progress,
          note: r.note,
        })),
      });
    }

    return NextResponse.json({
      success: "Data contoh Goal & Life Planning berhasil dibuat!",
    }, { status: 201 });
  } catch (error: any) {
    console.error("[SEED_DUMMY_GOALS_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat data contoh Goal" },
      { status: 500 }
    );
  }
}
