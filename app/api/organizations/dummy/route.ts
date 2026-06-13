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

    // Hapus data lama milik user
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      select: { organizationId: true },
    });
    const orgIds = memberships.map((m) => m.organizationId);

    if (orgIds.length > 0) {
      await prisma.organizationTask.deleteMany({ where: { userId } });
      await prisma.organizationEvent.deleteMany({
        where: { organizationId: { in: orgIds } },
      });
      await prisma.organizationMember.deleteMany({ where: { userId } });
      await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
    }

    // REF_DATE: 2026-06-14 (Minggu)
    const today = new Date("2026-06-14");
    const addDays = (d: Date, n: number) => {
      const copy = new Date(d);
      copy.setDate(d.getDate() + n);
      return copy;
    };

    // =====================
    // Buat 2 Organisasi
    // =====================

    const hima = await prisma.organization.create({
      data: {
        name: "HIMA Teknik Informatika",
        description: "Himpunan Mahasiswa Teknik Informatika — wadah pengembangan kompetensi IT dan kreativitas mahasiswa.",
        period: "2025–2026",
        logoIcon: "💻",
        members: {
          create: {
            userId,
            role: "MEMBER",
            position: "Staff Divisi IT",
            period: "2025–2026",
          },
        },
      },
    });

    const bem = await prisma.organization.create({
      data: {
        name: "BEM Fakultas Teknik",
        description: "Badan Eksekutif Mahasiswa Fakultas Teknik — mengkoordinasikan kegiatan kemahasiswaan tingkat fakultas.",
        period: "2025–2026",
        logoIcon: "🏛️",
        members: {
          create: {
            userId,
            role: "MEMBER",
            position: "Koordinator Media & Publikasi",
            period: "2025–2026",
          },
        },
      },
    });

    // =====================
    // Buat Events HIMA
    // =====================
    const himaMeeting = await prisma.organizationEvent.create({
      data: {
        organizationId: hima.id,
        userId,
        title: "Rapat Divisi IT — Persiapan Seminar",
        description: "Koordinasi tim untuk menyiapkan materi seminar nasional teknologi.",
        type: "MEETING",
        date: addDays(today, 1),
        location: "Ruang Sidang Gedung A Lt.3",
      },
    });

    const himaEvent = await prisma.organizationEvent.create({
      data: {
        organizationId: hima.id,
        userId,
        title: "Seminar Nasional Teknologi AI",
        description: "Seminar menghadirkan pakar AI dari industri dan akademik.",
        type: "SEMINAR",
        date: addDays(today, 8),
        endDate: addDays(today, 8),
        location: "Aula Gedung Kuliah Umum",
      },
    });

    const himaProker = await prisma.organizationEvent.create({
      data: {
        organizationId: hima.id,
        userId,
        title: "Workshop Pemrograman Web Modern",
        description: "Proker tahunan berbasis praktik Next.js dan TypeScript.",
        type: "PROKER",
        date: addDays(today, 15),
        location: "Lab Komputer 2",
      },
    });

    // =====================
    // Buat Events BEM
    // =====================
    const bemMeeting = await prisma.organizationEvent.create({
      data: {
        organizationId: bem.id,
        userId,
        title: "Rapat Panitia PKKMB 2026",
        description: "Persiapan teknis dan logistik penerimaan mahasiswa baru.",
        type: "MEETING",
        date: addDays(today, 3),
        location: "Sekretariat BEM FT",
      },
    });

    const bemEvent = await prisma.organizationEvent.create({
      data: {
        organizationId: bem.id,
        userId,
        title: "Malam Kreasi Mahasiswa FT",
        description: "Festival tahunan menampilkan kreasi seni dan inovasi mahasiswa FT.",
        type: "EVENT",
        date: addDays(today, 21),
        endDate: addDays(today, 22),
        location: "Lapangan Utama Kampus",
      },
    });

    // Arsip lama
    await prisma.organizationEvent.create({
      data: {
        organizationId: hima.id,
        userId,
        title: "Evaluasi Proker Semester Ganjil",
        description: "Evaluasi pencapaian program kerja semester lalu.",
        type: "MEETING",
        date: addDays(today, -30),
        isArchived: true,
        location: "Ruang Rapat HIMA",
      },
    });

    // =====================
    // Buat Tasks
    // =====================
    const tasksData = [
      // HIMA Seminar Tasks
      {
        userId, eventId: himaEvent.id,
        title: "Desain Poster Seminar Nasional",
        description: "Buat poster digital dan cetak ukuran A3 untuk promosi seminar.",
        dueDate: addDays(today, 4), priority: "HIGH", status: "IN_PROGRESS",
      },
      {
        userId, eventId: himaEvent.id,
        title: "Koordinasi Undangan Pembicara",
        description: "Kirim surat undangan resmi ke narasumber dan konfirmasi kehadiran.",
        dueDate: addDays(today, 3), priority: "HIGH", status: "DONE",
      },
      {
        userId, eventId: himaEvent.id,
        title: "Booking Aula & Sound System",
        description: "Reservasi aula dan koordinasi dengan bagian sarana prasarana.",
        dueDate: addDays(today, 5), priority: "MEDIUM", status: "TODO",
      },
      // HIMA Workshop Tasks
      {
        userId, eventId: himaProker.id,
        title: "Susun Modul Workshop",
        description: "Persiapkan slide dan hands-on material untuk workshop.",
        dueDate: addDays(today, 10), priority: "MEDIUM", status: "IN_PROGRESS",
      },
      {
        userId, eventId: himaProker.id,
        title: "Pendaftaran Peserta Workshop",
        description: "Buka dan kelola formulir pendaftaran online.",
        dueDate: addDays(today, 12), priority: "LOW", status: "TODO",
      },
      // BEM PKKMB Tasks
      {
        userId, eventId: bemMeeting.id,
        title: "Buat Konten Media Sosial PKKMB",
        description: "Desain dan jadwalkan posting untuk Instagram dan Tiktok.",
        dueDate: addDays(today, 2), priority: "HIGH", status: "TODO",
      },
      {
        userId, eventId: bemMeeting.id,
        title: "Koordinasi Divisi Konsumsi",
        description: "Rencanakan kebutuhan konsumsi dan anggaran per hari.",
        dueDate: addDays(today, 2), priority: "MEDIUM", status: "DONE",
      },
      // BEM Event
      {
        userId, eventId: bemEvent.id,
        title: "Proposal Sponsorship Malam Kreasi",
        description: "Susun dan kirimkan proposal ke minimal 5 calon sponsor.",
        dueDate: addDays(today, 7), priority: "HIGH", status: "TODO",
      },
    ];

    await prisma.organizationTask.createMany({ data: tasksData });

    return NextResponse.json({
      success: "Data contoh organisasi berhasil dimuat!",
      orgs: 2,
      events: 6,
      tasks: tasksData.length,
    });
  } catch (error: any) {
    console.error("[ORG_DUMMY_POST_ERROR]", error);
    return NextResponse.json({ error: error.message || "Gagal memuat data contoh" }, { status: 500 });
  }
}
