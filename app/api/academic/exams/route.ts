import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Filter by active semester
    const activeSemester = await prisma.semester.findFirst({
      where: { userId, isActive: true },
    });

    let semesterFilter: any = {};
    if (activeSemester) {
      semesterFilter = { semesterId: activeSemester.id };
    } else {
      // If semesters exist but none active, return courses with null semester
      const semestersCount = await prisma.semester.count({ where: { userId } });
      if (semestersCount > 0) {
        semesterFilter = { semesterId: null };
      }
    }

    const exams = await prisma.exam.findMany({
      where: {
        course: {
          userId,
          ...semesterFilter,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json(exams);
  } catch (error: any) {
    console.error("[EXAMS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data ujian" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { courseId, title, date, room, type } = body;

    // Validate inputs
    if (!courseId || typeof courseId !== "string") {
      return NextResponse.json({ error: "Mata kuliah wajib dipilih" }, { status: 400 });
    }
    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "Judul ujian wajib diisi" }, { status: 400 });
    }
    if (!date) {
      return NextResponse.json({ error: "Tanggal ujian wajib diisi" }, { status: 400 });
    }

    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Mata kuliah tidak ditemukan atau tidak valid" },
        { status: 404 }
      );
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Format tanggal ujian tidak valid" },
        { status: 400 }
      );
    }

    const newExam = await prisma.exam.create({
      data: {
        courseId,
        title: title.trim(),
        date: parsedDate,
        room: room ? room.trim() : null,
        type: type || "CLOSED_BOOK",
      },
    });

    return NextResponse.json(newExam, { status: 201 });
  } catch (error: any) {
    console.error("[EXAMS_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat ujian baru" },
      { status: 500 }
    );
  }
}
