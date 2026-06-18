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

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId: user.id },
      include: {
        project: {
          include: { client: true }
        }
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("GET Invoice Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data invoice" }, { status: 500 });
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
    const { status } = body;

    // Verify ownership
    const existing = await prisma.invoice.findFirst({
      where: { id, userId: user.id },
      include: { project: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Invoice tidak ditemukan atau bukan milik Anda" }, { status: 404 });
    }

    const isTransitioningToPaid = status === "PAID" && existing.status !== "PAID";

    if (isTransitioningToPaid) {
      // Run database transaction for atomic consistency
      await prisma.$transaction(async (tx) => {
        // 1. Update invoice status
        await tx.invoice.update({
          where: { id },
          data: { status: "PAID" },
        });

        // 2. Create Income record
        await tx.income.create({
          data: {
            userId: user.id,
            invoiceId: id,
            source: "FREELANCE",
            amount: existing.amount,
            date: new Date(),
            notes: `Pelunasan Invoice ${existing.invoiceNumber} untuk Proyek ${existing.project.name}`,
          },
        });

        // 3. Create Finance Transaction
        // Find or create "Freelance" category for this user
        let financeCategory = await tx.financeCategory.findFirst({
          where: { userId: user.id, name: "Freelance" },
        });
        if (!financeCategory) {
          financeCategory = await tx.financeCategory.create({
            data: {
              userId: user.id,
              name: "Freelance",
              icon: "💼",
              color: "#10b981", // Emerald green for income
            },
          });
        }

        await tx.transaction.create({
          data: {
            userId: user.id,
            type: "INCOME",
            amount: existing.amount,
            categoryId: financeCategory.id,
            projectId: existing.projectId,
            description: `Lunas Invoice ${existing.invoiceNumber} - Proyek ${existing.project.name}`,
            date: new Date(),
          },
        });

        // 4. Update Goal Progress if project is linked to FinancialGoal
        if (existing.project.financialGoalId) {
          const goal = await tx.financialGoal.findUnique({
            where: { id: existing.project.financialGoalId },
          });
          if (goal) {
            await tx.financialGoal.update({
              where: { id: existing.project.financialGoalId },
              data: {
                currentAmount: goal.currentAmount + existing.amount,
              },
            });
          }
        }
      });

      const updated = await prisma.invoice.findUnique({
        where: { id },
        include: { project: { include: { client: true } } },
      });

      return NextResponse.json({ success: "Invoice berhasil dilunasi, keuangan & target tabungan terupdate!", invoice: updated });
    } else {
      // Normal update
      const updated = await prisma.invoice.update({
        where: { id },
        data: {
          status: status || existing.status,
        },
        include: { project: { include: { client: true } } },
      });
      return NextResponse.json({ success: "Invoice berhasil diperbarui", invoice: updated });
    }
  } catch (error: any) {
    console.error("PUT Invoice Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui invoice" }, { status: 500 });
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
    const existing = await prisma.invoice.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Invoice tidak ditemukan atau bukan milik Anda" }, { status: 404 });
    }

    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: "Invoice berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE Invoice Error:", error);
    return NextResponse.json({ error: "Gagal menghapus invoice" }, { status: 500 });
  }
}
