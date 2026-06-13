import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const paramSemesterId = searchParams.get("semesterId");

    let semesterFilter: any = {};

    if (paramSemesterId) {
      if (paramSemesterId !== "ALL") {
        semesterFilter = { semesterId: paramSemesterId };
      }
    } else {
      // Default: Filter by active semester
      const activeSemester = await prisma.semester.findFirst({
        where: { userId, isActive: true },
      });

      if (activeSemester) {
        semesterFilter = { semesterId: activeSemester.id };
      } else {
        // If no semesters exist, return courses with null semester or all
        // To be safe for users with old courses, if there are no semesters at all, don't filter
        const semestersCount = await prisma.semester.count({ where: { userId } });
        if (semestersCount > 0) {
          semesterFilter = { semesterId: null };
        }
      }
    }

    const courses = await prisma.course.findMany({
      where: {
        userId,
        ...semesterFilter,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(courses);
  } catch (error: any) {
    console.error("[COURSES_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data mata kuliah" },
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
    const { name, code, lecturer, day, startTime, endTime, room, credits, semesterId } = body;

    // Validate required inputs
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Nama mata kuliah wajib diisi" }, { status: 400 });
    }
    if (!day || typeof day !== "string" || day.trim() === "") {
      return NextResponse.json({ error: "Hari kuliah wajib diisi" }, { status: 400 });
    }
    if (!startTime || typeof startTime !== "string" || startTime.trim() === "") {
      return NextResponse.json({ error: "Jam mulai kuliah wajib diisi" }, { status: 400 });
    }
    if (!endTime || typeof endTime !== "string" || endTime.trim() === "") {
      return NextResponse.json({ error: "Jam selesai kuliah wajib diisi" }, { status: 400 });
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: "Format jam kuliah harus HH:MM (contoh: 08:00)" },
        { status: 400 }
      );
    }

    // Default to active semester if not provided
    let targetSemesterId = semesterId || null;
    if (!targetSemesterId) {
      const activeSemester = await prisma.semester.findFirst({
        where: { userId, isActive: true },
      });
      if (activeSemester) {
        targetSemesterId = activeSemester.id;
      }
    }

    const newCourse = await prisma.course.create({
      data: {
        userId,
        semesterId: targetSemesterId,
        name: name.trim(),
        code: code ? code.trim() : null,
        lecturer: lecturer ? lecturer.trim() : null,
        day: day.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        room: room ? room.trim() : null,
        credits: credits ? parseInt(credits, 10) : 2,
      },
    });

    return NextResponse.json(newCourse, { status: 201 });
  } catch (error: any) {
    console.error("[COURSES_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat mata kuliah baru" },
      { status: 500 }
    );
  }
}
