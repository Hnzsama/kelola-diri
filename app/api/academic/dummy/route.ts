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

    // Hapus data mata kuliah, tugas, dan ujian lama agar data contoh baru dapat terbuat dengan bersih
    await prisma.course.deleteMany({
      where: { userId },
    });

    // 1. Create Active Semester first if user has no semesters
    let activeSemester = await prisma.semester.findFirst({
      where: { userId, isActive: true },
    });

    if (!activeSemester) {
      // Deactivate others just in case
      await prisma.semester.updateMany({
        where: { userId },
        data: { isActive: false },
      });

      activeSemester = await prisma.semester.create({
        data: {
          userId,
          name: "Semester Genap 2025/2026",
          isActive: true,
        },
      });
    }

    // 2. Create Courses
    const coursesData = [
      {
        name: "Basis Data",
        code: "IF223",
        lecturer: "Dr. Budi Santoso",
        day: "Senin",
        startTime: "08:00",
        endTime: "10:30",
        room: "Lab Komputer 3",
        credits: 3,
      },
      {
        name: "Pemrograman Web",
        code: "IF224",
        lecturer: "Ir. Rina Wijaya",
        day: "Rabu",
        startTime: "13:00",
        endTime: "15:30",
        room: "Ruang A-402",
        credits: 3,
      },
      {
        name: "Kecerdasan Buatan",
        code: "IF225",
        lecturer: "Prof. Agus Raharjo",
        day: "Jumat",
        startTime: "09:00",
        endTime: "12:00",
        room: "Aula Ilmu Komputer",
        credits: 4,
      },
      {
        name: "Sistem Operasi",
        code: "IF226",
        lecturer: "Drs. Eko Prasetyo",
        day: "Kamis",
        startTime: "10:00",
        endTime: "12:30",
        room: "Ruang B-201",
        credits: 3,
      },
    ];

    const courses = [];
    for (const cData of coursesData) {
      const course = await prisma.course.create({
        data: {
          userId,
          semesterId: activeSemester.id,
          ...cData,
        },
      });
      courses.push(course);
    }

    // Map course name to course object for easy reference
    const courseMap = courses.reduce((acc: any, c: any) => {
      acc[c.name] = c;
      return acc;
    }, {});

    // Target current mock time: 2026-06-14 (Sunday)
    // 2026-06-14: Minggu
    // 2026-06-15: Senin (UTS Basis Data, Assignment Deadline UTS)
    // 2026-06-16: Selasa
    // 2026-06-17: Rabu
    // 2026-06-18: Kamis (Presentasi Paper Artificial Intelligence)
    // 2026-06-19: Jumat (Proposal Proyek Web App)
    // 2026-06-20: Sabtu
    // 2026-06-23: Selasa (Laporan Praktikum Sistem Operasi)
    // 2026-06-26: Jumat (UTS Kecerdasan Buatan)

    // 3. Create Assignments
    const assignmentsData = [
      {
        courseName: "Basis Data",
        title: "Tugas Normalisasi Database",
        description: "Lakukan normalisasi hingga bentuk 3NF dari ERD perpustakaan yang diberikan.",
        dueDate: new Date("2026-06-16T23:59:00Z"),
        priority: "HIGH",
        status: "TODO",
      },
      {
        courseName: "Pemrograman Web",
        title: "Proposal Proyek Web App",
        description: "Buat proposal proyek akhir menggunakan Next.js dan Tailwind CSS.",
        dueDate: new Date("2026-06-19T23:59:00Z"),
        priority: "MEDIUM",
        status: "IN_PROGRESS",
      },
      {
        courseName: "Kecerdasan Buatan",
        title: "Presentasi Paper Neural Networks",
        description: "Review paper bertema CNN dan presentasikan di depan kelas menggunakan slides.",
        dueDate: new Date("2026-06-18T14:00:00Z"),
        priority: "HIGH",
        status: "TODO",
      },
      {
        courseName: "Sistem Operasi",
        title: "Laporan Praktikum Manajemen Memori",
        description: "Dokumentasikan hasil praktikum simulasi algoritma First-Fit dan Best-Fit.",
        dueDate: new Date("2026-06-23T23:59:00Z"),
        priority: "LOW",
        status: "TODO",
      },
    ];

    for (const aData of assignmentsData) {
      const course = courseMap[aData.courseName];
      if (course) {
        await prisma.assignment.create({
          data: {
            courseId: course.id,
            title: aData.title,
            description: aData.description,
            dueDate: aData.dueDate,
            priority: aData.priority,
            status: aData.status,
          },
        });
      }
    }

    // 4. Create Exams
    const examsData = [
      {
        courseName: "Basis Data",
        title: "UTS Basis Data (Teori)",
        date: new Date("2026-06-15T08:00:00Z"),
        room: "Gedung C-101",
        type: "CLOSED_BOOK",
      },
      {
        courseName: "Kecerdasan Buatan",
        title: "UTS Kecerdasan Buatan (Praktikum)",
        date: new Date("2026-06-26T09:00:00Z"),
        room: "Lab Komputer 1",
        type: "OPEN_BOOK",
      },
    ];

    for (const eData of examsData) {
      const course = courseMap[eData.courseName];
      if (course) {
        await prisma.exam.create({
          data: {
            courseId: course.id,
            title: eData.title,
            date: eData.date,
            room: eData.room,
            type: eData.type,
          },
        });
      }
    }

    return NextResponse.json({
      success: "Data dummy akademik berhasil dibuat!",
      semesterName: activeSemester.name,
      coursesCreated: courses.length,
      assignmentsCreated: assignmentsData.length,
      examsCreated: examsData.length,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[SEED_DUMMY_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat data dummy akademik" },
      { status: 500 }
    );
  }
}
