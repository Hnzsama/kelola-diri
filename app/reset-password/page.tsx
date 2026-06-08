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
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <h1 className="text-2xl font-bold text-red-500">Token Pemulihan Tidak Valid</h1>
        <p className="mt-2 text-muted-foreground">Tautan pengaturan ulang kata sandi ini salah atau tidak lengkap.</p>
        <a href="/login" className="mt-4 text-primary underline">Kembali ke Login</a>
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
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
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
                  onChange={(e) => setPassword(e.target.value)}
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
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
      </div>
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
