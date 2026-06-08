"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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
        <h1 className="text-2xl font-bold">Atur Ulang Gagal</h1>
        <p className="text-sm text-muted-foreground">
          Tautan pengaturan ulang kata sandi ini salah, tidak lengkap, atau tidak valid.
        </p>
        <div className="mt-4 w-full">
          <a href="/login" className="w-full inline-flex h-9 items-center justify-center rounded-[var(--radius)] border border-border bg-background px-3 text-sm font-medium hover:bg-muted transition-colors">
            Kembali ke Login
          </a>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok")
      return
    }
    
    if (password.length < 8) {
      toast.error("Kata sandi minimal harus 8 karakter")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Gagal mengatur ulang kata sandi")
      } else {
        toast.success(data.success || "Kata sandi berhasil diatur ulang!")
        setPassword("")
        setConfirmPassword("")
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-8 items-center justify-center bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2">
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
            <h1 className="text-2xl font-bold">Atur Ulang Kata Sandi</h1>
            <FieldDescription>
              Masukkan kata sandi baru Anda di bawah ini.
            </FieldDescription>
          </div>

          <Field>
            <FieldLabel htmlFor="password">Kata Sandi Baru</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirm-password">Konfirmasi Kata Sandi</FieldLabel>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Ulangi kata sandi"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              required
            />
          </Field>

          <Field>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Menyimpan..." : "Simpan Kata Sandi"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Memuat halaman...
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
