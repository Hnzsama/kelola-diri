import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEFAULT_CATEGORIES = [
  { name: "Akademik", icon: "📚", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-400/20" },
  { name: "Kesehatan", icon: "💪", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-400/20" },
  { name: "Spiritual", icon: "🕌", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-400/20" },
  { name: "Karier", icon: "💼", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/20" },
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Ambil daftar kategori milik user
    let categories = await prisma.habitCategory.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    // Jika kosong, buatkan kategori default otomatis
    if (categories.length === 0) {
      const created = [];
      for (const cat of DEFAULT_CATEGORIES) {
        const c = await prisma.habitCategory.create({
          data: {
            userId,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
          },
        });
        created.push(c);
      }
      categories = created;
    }

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("[HABIT_CATEGORIES_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kategori habit" },
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

    // Periksa apakah nama kategori sudah terdaftar untuk user tersebut
    const existing = await prisma.habitCategory.findFirst({
      where: { userId, name: name.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "Kategori dengan nama ini sudah ada" }, { status: 400 });
    }

    const newCategory = await prisma.habitCategory.create({
      data: {
        userId,
        name: name.trim(),
        icon: icon ? icon.trim() : "📌",
        color: color || "bg-muted",
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    console.error("[HABIT_CATEGORIES_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat kategori baru" },
      { status: 500 }
    );
  }
}
