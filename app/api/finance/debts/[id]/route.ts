import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendTransactionEmailAlert } from "@/lib/notification-engine";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const body = await req.json();
    const { contact, amount, purpose, dueDate, status, paymentMethod } = body;

    const existingDebt = await prisma.debtReceivable.findFirst({
      where: { id, userId },
    });

    if (!existingDebt) {
      return NextResponse.json({ error: "Catatan tidak ditemukan" }, { status: 404 });
    }

    // Check if status is being updated to PAID from PENDING
    const isMarkingPaid = status === "PAID" && existingDebt.status === "PENDING";

    const updatedDebt = await prisma.debtReceivable.update({
      where: { id },
      data: {
        ...(contact ? { contact: contact.trim() } : {}),
        ...(amount !== undefined ? { amount } : {}),
        ...(purpose ? { purpose: purpose.trim() } : {}),
        ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
        ...(status ? { status } : {}),
      },
    });

    // Automatically create transaction if marked as PAID
    if (isMarkingPaid) {
      let category = await prisma.financeCategory.findFirst({
        where: {
          userId,
          name: {
            equals: "Lainnya",
            mode: "insensitive",
          },
        },
      });

      if (!category) {
        category = await prisma.financeCategory.findFirst({
          where: { userId },
        });
      }

      if (category) {
        const isReceivable = existingDebt.type === "RECEIVABLE";
        const newTx = await prisma.transaction.create({
          data: {
            userId,
            type: isReceivable ? "INCOME" : "EXPENSE",
            amount: existingDebt.amount,
            categoryId: category.id,
            paymentMethod: paymentMethod || "TUNAI",
            date: new Date(),
            description: isReceivable
              ? `Pelunasan piutang dari ${existingDebt.contact}: ${existingDebt.purpose}`
              : `Pelunasan hutang ke ${existingDebt.contact}: ${existingDebt.purpose}`,
          },
        });

        // Trigger real-time email notification
        (async () => {
          try {
            await sendTransactionEmailAlert(userId, newTx.id);
          } catch (err) {
            console.error("Failed sending transaction email:", err);
          }
        })();
      }
    }

    return NextResponse.json(updatedDebt);
  } catch (error: any) {
    console.error("[DEBT_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui catatan hutang/piutang" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;

    const existingDebt = await prisma.debtReceivable.findFirst({
      where: { id, userId },
    });

    if (!existingDebt) {
      return NextResponse.json({ error: "Catatan tidak ditemukan" }, { status: 404 });
    }

    await prisma.debtReceivable.delete({
      where: { id },
    });

    return NextResponse.json({ success: "Catatan berhasil dihapus" });
  } catch (error: any) {
    console.error("[DEBT_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal menghapus catatan hutang/piutang" },
      { status: 500 }
    );
  }
}
