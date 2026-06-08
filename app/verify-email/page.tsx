import prisma from "@/lib/prisma";
import Link from "next/link";

interface VerifyProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <h1 className="text-2xl font-bold text-red-500">Token Tidak Valid</h1>
        <p className="mt-2 text-muted-foreground">Token verifikasi tidak ditemukan.</p>
        <Link href="/login" className="mt-4 text-primary underline">Kembali ke Login</Link>
      </div>
    );
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token }
  });

  if (!verificationToken || verificationToken.expires < new Date()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <h1 className="text-2xl font-bold text-red-500">Token Kedaluwarsa</h1>
        <p className="mt-2 text-muted-foreground">Token verifikasi salah atau sudah kedaluwarsa.</p>
        <Link href="/login" className="mt-4 text-primary underline">Kembali ke Login</Link>
      </div>
    );
  }

  // Update emailVerified status
  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() }
  });

  // Hapus token verifikasi setelah digunakan
  await prisma.verificationToken.delete({
    where: { token }
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="w-full max-w-md border rounded-lg bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-green-600">Email Berhasil Diverifikasi!</h1>
        <p className="mt-3 text-muted-foreground">
          Akun Anda telah berhasil diverifikasi dan sekarang aktif. Silakan masuk menggunakan email dan kata sandi Anda.
        </p>
        <Link href="/login" className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
          Masuk Sekarang
        </Link>
      </div>
    </div>
  );
}
