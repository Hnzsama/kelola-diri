import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token dan kata sandi baru wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Kata sandi minimal harus 8 karakter" },
        { status: 400 }
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json(
        { error: "Token tidak valid atau telah kedaluwarsa" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password user
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    // Hapus token reset setelah digunakan
    await prisma.passwordResetToken.delete({
      where: { token },
    });

    return NextResponse.json({
      success: "Kata sandi Anda berhasil diatur ulang! Silakan login menggunakan kata sandi baru Anda.",
    });
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan server saat mengatur ulang kata sandi" },
      { status: 500 }
    );
  }
}
