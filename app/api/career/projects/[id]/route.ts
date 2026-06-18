import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
      include: {
        client: true,
        tasks: { orderBy: { dueDate: "asc" } },
        invoices: { orderBy: { dueDate: "asc" } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Proyek tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error: any) {
    console.error("GET Project Detail Error:", error);
    return NextResponse.json({ error: "Gagal mengambil detail proyek" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const body = await req.json();
    const { name, description, contractValue, startDate, endDate, status, financialGoalId } = body;

    // Verify ownership
    const existingProject = await prisma.project.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Proyek tidak ditemukan atau bukan milik Anda" }, { status: 404 });
    }

    // Validate inputs if passed
    let valueNum = existingProject.contractValue;
    if (contractValue !== undefined) {
      valueNum = parseFloat(contractValue);
      if (isNaN(valueNum) || valueNum < 0) {
        return NextResponse.json({ error: "Nilai kontrak tidak valid" }, { status: 400 });
      }
    }

    if (financialGoalId) {
      const goal = await prisma.financialGoal.findFirst({
        where: { id: financialGoalId, userId: user.id },
      });
      if (!goal) {
        return NextResponse.json({ error: "Target tabungan tidak ditemukan atau bukan milik Anda" }, { status: 400 });
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existingProject.name,
        description: description !== undefined ? (description ? description.trim() : null) : existingProject.description,
        contractValue: valueNum,
        startDate: startDate !== undefined ? new Date(startDate) : existingProject.startDate,
        endDate: endDate !== undefined ? new Date(endDate) : existingProject.endDate,
        status: status !== undefined ? status : existingProject.status,
        financialGoalId: financialGoalId !== undefined ? (financialGoalId || null) : existingProject.financialGoalId,
      },
      include: {
        client: true,
      },
    });

    return NextResponse.json({ success: "Proyek berhasil diperbarui", project: updatedProject });
  } catch (error: any) {
    console.error("PUT Project Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui proyek" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;

    // Verify ownership
    const existingProject = await prisma.project.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Proyek tidak ditemukan atau bukan milik Anda" }, { status: 404 });
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: "Proyek berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE Project Error:", error);
    return NextResponse.json({ error: "Gagal menghapus proyek" }, { status: 500 });
  }
}
