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
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const jobs = await prisma.jobApplication.findMany({
      where: { userId: user.id },
      orderBy: { appliedDate: "desc" },
    });

    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error("GET Job Applications Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data lamaran kerja" }, { status: 500 });
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
    const { companyName, position, jobLink, appliedDate, status, notes } = body;

    if (!companyName || !position || !appliedDate) {
      return NextResponse.json({ error: "Nama perusahaan, posisi, dan tanggal lamar wajib diisi" }, { status: 400 });
    }

    const newJob = await prisma.jobApplication.create({
      data: {
        userId: user.id,
        companyName: companyName.trim(),
        position: position.trim(),
        jobLink: jobLink ? jobLink.trim() : null,
        appliedDate: new Date(appliedDate),
        status: status || "WISHLIST",
        notes: notes ? notes.trim() : null,
      },
    });

    return NextResponse.json({ success: "Lamaran kerja berhasil didaftarkan", job: newJob }, { status: 201 });
  } catch (error: any) {
    console.error("POST Job Application Error:", error);
    return NextResponse.json({ error: "Gagal mendaftarkan lamaran kerja" }, { status: 500 });
  }
}
