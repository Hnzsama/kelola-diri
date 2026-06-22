import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendTransactionEmailAlert } from "@/lib/notification-engine";

export async function POST(
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

    const bill = await prisma.recurringBill.findFirst({
      where: { id, userId },
    });

    if (!bill) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
    }

    // Check if already paid this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const existingTx = await prisma.transaction.findFirst({
      where: {
        userId,
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        description: `Pembayaran tagihan berulang: ${bill.name}`,
      },
    });

    if (existingTx) {
      return NextResponse.json({ error: "Tagihan ini sudah dibayar pada bulan ini" }, { status: 400 });
    }

    // Smart category matching
    const billNameLower = bill.name.toLowerCase();
    let targetCategoryName = "Lainnya";

    if (billNameLower.includes("spotify") || billNameLower.includes("netflix") || billNameLower.includes("canva") || billNameLower.includes("game") || billNameLower.includes("youtube")) {
      targetCategoryName = "Hiburan";
    } else if (billNameLower.includes("vps") || billNameLower.includes("domain") || billNameLower.includes("internet") || billNameLower.includes("wifi") || billNameLower.includes("pulsa") || billNameLower.includes("kuota")) {
      targetCategoryName = "Internet";
    } else if (billNameLower.includes("ukt") || billNameLower.includes("kuliah") || billNameLower.includes("buku") || billNameLower.includes("sks")) {
      targetCategoryName = "Kuliah";
    } else if (billNameLower.includes("kost") || billNameLower.includes("kontrakan") || billNameLower.includes("sewa")) {
      targetCategoryName = "Lainnya"; // Or Kost
    }

    let category = await prisma.financeCategory.findFirst({
      where: {
        userId,
        name: {
          equals: targetCategoryName,
          mode: "insensitive",
        },
      },
    });

    if (!category) {
      // fallback to Lainnya
      category = await prisma.financeCategory.findFirst({
        where: {
          userId,
          name: {
            equals: "Lainnya",
            mode: "insensitive",
          },
        },
      });
    }

    if (!category) {
      // absolute fallback
      category = await prisma.financeCategory.findFirst({
        where: { userId },
      });
    }

    if (!category) {
      return NextResponse.json({ error: "Kategori transaksi tidak ditemukan" }, { status: 400 });
    }

    const newTx = await prisma.transaction.create({
      data: {
        userId,
        type: "EXPENSE",
        amount: bill.amount,
        categoryId: category.id,
        date: new Date(),
        description: `Pembayaran tagihan berulang: ${bill.name}`,
      },
    });

    // Send email alert in the background
    (async () => {
      try {
        await sendTransactionEmailAlert(userId, newTx.id);
      } catch (err) {
        console.error("Failed sending transaction email:", err);
      }
    })();

    return NextResponse.json({ success: "Tagihan berhasil dibayar", transaction: newTx });
  } catch (error: any) {
    console.error("[RECURRING_PAY_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal memproses pembayaran tagihan" },
      { status: 500 }
    );
  }
}
