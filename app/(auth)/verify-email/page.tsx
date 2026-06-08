import prisma from "@/lib/prisma";
import Link from "next/link";

interface VerifyProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-8 items-center justify-center bg-destructive text-destructive-foreground border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Verifikasi Gagal</h1>
        <p className="text-sm text-muted-foreground">
          Token verifikasi tidak ditemukan atau tidak disertakan.
        </p>
        <div className="mt-4 w-full">
          <Link href="/login" className="w-full inline-flex h-9 items-center justify-center rounded-[var(--radius)] border border-border bg-background px-3 text-sm font-medium hover:bg-muted transition-colors">
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token }
  });

  if (!verificationToken || verificationToken.expires < new Date()) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-8 items-center justify-center bg-destructive text-destructive-foreground border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Token Kedaluwarsa</h1>
        <p className="text-sm text-muted-foreground">
          Tautan verifikasi salah atau sudah kedaluwarsa. Silakan lakukan registrasi ulang atau minta tautan baru.
        </p>
        <div className="mt-4 w-full">
          <Link href="/login" className="w-full inline-flex h-9 items-center justify-center rounded-[var(--radius)] border border-border bg-background px-3 text-sm font-medium hover:bg-muted transition-colors">
            Kembali ke Login
          </Link>
        </div>
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
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex size-8 items-center justify-center bg-green-600 text-white border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold">Verifikasi Berhasil</h1>
      <p className="text-sm text-muted-foreground">
        Akun Anda telah berhasil diverifikasi. Silakan masuk menggunakan email dan kata sandi Anda.
      </p>
      <div className="mt-4 w-full">
        <Link href="/login" className="w-full inline-flex h-9 items-center justify-center rounded-[var(--radius)] border border-border bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          Masuk Sekarang
        </Link>
      </div>
    </div>
  );
}
