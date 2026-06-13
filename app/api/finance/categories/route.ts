import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEFAULT_CATEGORIES = [
  { name: "Makan", icon: "🍜", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-400/30" },
  { name: "Transportasi", icon: "⛽", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-400/30" },
  { name: "Kuliah", icon: "📚", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-400/30" },
  { name: "Organisasi", icon: "🏢", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/30" },
  { name: "Freelance", icon: "💻", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-400/30" },
  { name: "Internet", icon: "📱", color: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-400/30" },
  { name: "Hiburan", icon: "🎮", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-400/30" },
  { name: "Sosial", icon: "❤️", color: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-400/30" },
  { name: "Lainnya", icon: "💰", color: "bg-muted text-muted-foreground border-border/30" },
];

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Fetch existing categories
    let categories = await prisma.financeCategory.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    // Auto-seed if empty
    if (categories.length === 0) {
      await prisma.financeCategory.createMany({
        data: DEFAULT_CATEGORIES.map((c) => ({
          userId,
          name: c.name,
          icon: c.icon,
          color: c.color,
        })),
      });

      categories = await prisma.financeCategory.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
    }

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("[FINANCE_CATEGORIES_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kategori keuangan" },
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
    const { name, icon, color } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
    }

    // Check limit of categories (e.g. 20)
    const count = await prisma.financeCategory.count({ where: { userId } });
    if (count >= 20) {
      return NextResponse.json(
        { error: "Mencapai batas maksimal (20 kategori). Silakan hapus kategori yang tidak terpakai." },
        { status: 400 }
      );
    }

    // Check duplicate
    const existing = await prisma.financeCategory.findFirst({
      where: {
        userId,
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Kategori dengan nama tersebut sudah ada" }, { status: 400 });
    }

    const newCategory = await prisma.financeCategory.create({
      data: {
        userId,
        name: name.trim(),
        icon: icon || "💰",
        color: color || "bg-muted text-muted-foreground border-border/30",
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    console.error("[FINANCE_CATEGORIES_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat kategori baru" },
      { status: 500 }
    );
  }
}
