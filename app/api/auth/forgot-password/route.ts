import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email wajib diisi" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Mengembalikan sukses walaupun email tidak ditemukan demi alasan keamanan (user enumeration prevention)
    if (!user || !user.password) {
      return NextResponse.json({
        success: "Jika email Anda terdaftar, instruksi pemulihan kata sandi telah dikirim.",
      });
    }

    // Buat token reset password
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 Jam

    // Hapus token lama jika ada
    await prisma.passwordResetToken.deleteMany({
      where: { email }
    });

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    // Kirim email link reset password
    await sendPasswordResetEmail(email, token);

    return NextResponse.json({
      success: "Jika email Anda terdaftar, instruksi pemulihan kata sandi telah dikirim.",
    });
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan server saat memproses forgot password" },
      { status: 500 }
    );
  }
}
