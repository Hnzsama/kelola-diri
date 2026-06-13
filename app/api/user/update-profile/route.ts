import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name, password } = await req.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Nama tidak boleh kosong" }, { status: 400 })
    }

    const updateData: any = { name }

    if (password && password.trim().length > 0) {
      if (password.length < 8) {
        return NextResponse.json({ error: "Kata sandi minimal harus 8 karakter" }, { status: 400 })
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: updateData
    })

    return NextResponse.json({ success: "Profil berhasil diperbarui!" })
  } catch (error: any) {
    console.error("Update Profile Error:", error)
    return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 })
  }
}
