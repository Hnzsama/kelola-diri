"use client"

import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { data: session, update } = useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState("profile") // "profile", "preferences", "help"
  const [mounted, setMounted] = useState(false)

  // Profile Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Notification preferences states
  const [deadlineTugas, setDeadlineTugas] = useState(true)
  const [habitReminder, setHabitReminder] = useState(true)
  const [agendaOrganisasi, setAgendaOrganisasi] = useState(true)
  const [budgetWarning, setBudgetWarning] = useState(true)
  const [weeklyReview, setWeeklyReview] = useState(true)
  const [dailyFinanceReport, setDailyFinanceReport] = useState(false)
  const [monthlyReport, setMonthlyReport] = useState(false)
  const [isPrefSaving, setIsPrefSaving] = useState(false)
  const [isPrefLoading, setIsPrefLoading] = useState(true)
  const [isTestEmailSending, setIsTestEmailSending] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (session?.user) {
      fetchPreferences()
    }
  }, [session])

  const fetchPreferences = async () => {
    try {
      setIsPrefLoading(true)
      const res = await fetch("/api/user/notifications")
      if (!res.ok) throw new Error("Gagal mengambil data")
      const data = await res.json()
      setDeadlineTugas(data.deadlineTugas)
      setHabitReminder(data.habitReminder)
      setAgendaOrganisasi(data.agendaOrganisasi)
      setBudgetWarning(data.budgetWarning)
      setWeeklyReview(data.weeklyReview)
      setDailyFinanceReport(data.dailyFinanceReport)
      setMonthlyReport(data.monthlyReport)
    } catch {
      console.error("Gagal memuat preferensi notifikasi")
    } finally {
      setIsPrefLoading(false)
    }
  }

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPrefSaving(true)
    try {
      const res = await fetch("/api/user/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deadlineTugas,
          habitReminder,
          agendaOrganisasi,
          budgetWarning,
          weeklyReview,
          dailyFinanceReport,
          monthlyReport,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan preferensi")
      } else {
        toast.success(data.success || "Preferensi notifikasi berhasil disimpan!")
      }
    } catch {
      toast.error("Terjadi kesalahan sistem")
    } finally {
      setIsPrefSaving(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!session?.user) return
    setIsTestEmailSending(true)
    try {
      const userId = (session.user as any).id
      const res = await fetch(`/api/cron/notifications?type=test-email&secret=DEV_TOKEN&userId=${userId}`)
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Gagal mengirim email uji coba")
      } else {
        toast.success("Email asisten uji coba dikirim! Cek inbox/terminal.")
      }
    } catch {
      toast.error("Terjadi kesalahan sistem")
    } finally {
      setIsTestEmailSending(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "")
      setEmail(session.user.email || "")
    }
  }, [session])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Gagal memperbarui profil")
      } else {
        toast.success(data.success || "Profil berhasil diperbarui!")
        setPassword("")
        await update({ name })
        router.refresh()
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem")
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="w-full px-4 lg:px-6">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Pengaturan</h1>
          <p className="text-muted-foreground">
            Sesuaikan profil, preferensi, dan konfigurasi aplikasi Anda.
          </p>
        </div>
        <div className="flex h-[30vh] items-center justify-center text-muted-foreground">
          Memuat pengaturan...
        </div>
      </div>
    )
  }

  const themes = [
    {
      value: "light",
      label: "Terang",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-5">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ),
    },
    {
      value: "dark",
      label: "Gelap",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-5">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      ),
    },
    {
      value: "system",
      label: "Sistem",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-5">
          <rect width="20" height="14" x="2" y="3" rx="2" />
          <path d="M12 17v4M8 21h8" />
        </svg>
      ),
    },
  ]

  return (
    <div className="w-full px-4 lg:px-6">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Pengaturan</h1>
        <p className="text-muted-foreground">
          Sesuaikan profil, preferensi, dan konfigurasi aplikasi Anda secara menyeluruh.
        </p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Nested Sidebar */}
        <div className="flex flex-row md:flex-col gap-2 w-full md:w-64 shrink-0 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
          <button
            onClick={() => setActiveTab("profile")}
            className={cn(
              "flex items-center gap-3 px-4 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider text-left transition-all cursor-pointer shrink-0 md:w-full",
              activeTab === "profile"
                ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[2px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                : "bg-background text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:bg-muted dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Akun & Profil</span>
          </button>

          <button
            onClick={() => setActiveTab("preferences")}
            className={cn(
              "flex items-center gap-3 px-4 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider text-left transition-all cursor-pointer shrink-0 md:w-full",
              activeTab === "preferences"
                ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[2px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                : "bg-background text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:bg-muted dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Preferensi</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={cn(
              "flex items-center gap-3 px-4 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider text-left transition-all cursor-pointer shrink-0 md:w-full",
              activeTab === "notifications"
                ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[2px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                : "bg-background text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:bg-muted dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <span>Notifikasi</span>
          </button>

          <button
            onClick={() => setActiveTab("help")}
            className={cn(
              "flex items-center gap-3 px-4 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider text-left transition-all cursor-pointer shrink-0 md:w-full",
              activeTab === "help"
                ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[2px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                : "bg-background text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:bg-muted dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
            </svg>
            <span>Bantuan</span>
          </button>
        </div>

        {/* Content Pane */}
        <div className="flex-1 border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:bg-card">
          {activeTab === "profile" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold uppercase font-mono">Akun & Profil</h2>
                <p className="text-sm text-muted-foreground">
                  Kelola informasi data diri dan kata sandi akun Anda.
                </p>
              </div>

              {!session ? (
                <div className="text-sm text-muted-foreground">Memuat sesi...</div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="email">Email (Tidak dapat diubah)</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="bg-muted text-muted-foreground cursor-not-allowed opacity-80"
                      />
                      <FieldDescription>
                        Alamat email terhubung dengan identitas utama Anda.
                      </FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Nama Anda"
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="password">Kata Sandi Baru (Opsional)</FieldLabel>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Kosongkan jika tidak ingin diubah"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      />
                      <FieldDescription>
                        Masukkan minimal 8 karakter jika ingin memperbarui kata sandi Anda.
                      </FieldDescription>
                    </Field>

                    <div className="pt-2">
                      <Button type="submit" disabled={isLoading} className="w-full sm:w-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                        {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                      </Button>
                    </div>
                  </FieldGroup>
                </form>
              )}
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold uppercase font-mono">Preferensi Tampilan</h2>
                <p className="text-sm text-muted-foreground">
                  Pilih mode tampilan antarmuka yang paling nyaman untuk Anda gunakan.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {themes.map((t) => {
                  const isActive = theme === t.value
                  return (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className={cn(
                        "flex flex-col items-center gap-3 justify-center p-6 border-2 border-border transition-all cursor-pointer text-center",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[2px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                          : "bg-background text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:bg-muted dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
                      )}
                    >
                      <div className={cn(
                        "p-2 border-2 border-border rounded-[var(--radius)]",
                        isActive ? "bg-primary-foreground text-primary" : "bg-muted text-foreground"
                      )}>
                        {t.icon}
                      </div>
                      <span className="font-bold text-sm uppercase tracking-wider">{t.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold mb-1">Informasi Penyimpanan</h3>
                <p className="text-xs text-muted-foreground">
                  Kelola Diri menggunakan localStorage browser Anda untuk menyimpan pilihan tema secara langsung. Anda juga bisa mengganti tema dengan cepat melalui tombol di bar atas (navbar).
                </p>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold uppercase font-mono">Asisten Personal & Notifikasi</h2>
                <p className="text-sm text-muted-foreground">
                  Kelola bagaimana asisten personal mengirimkan update dan reminder via email.
                </p>
              </div>

              {isPrefLoading ? (
                <div className="text-sm font-mono text-muted-foreground">Memuat preferensi notifikasi...</div>
              ) : (
                <form onSubmit={handleSaveNotifications} className="space-y-6 font-mono">
                  {/* Preferences Group */}
                  <div className="space-y-4">
                    
                    {/* Item: Deadline Tugas */}
                    <div className="flex items-start gap-3 p-4 border-2 border-border bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                      <input
                        type="checkbox"
                        id="deadlineTugas"
                        checked={deadlineTugas}
                        onChange={(e) => setDeadlineTugas(e.target.checked)}
                        className="mt-1 size-4 accent-primary cursor-pointer border-2 border-border"
                      />
                      <label htmlFor="deadlineTugas" className="cursor-pointer select-none">
                        <span className="block text-sm font-extrabold uppercase">📚 Deadline Tugas (H-1)</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Kirim pengingat harian jam 19:00 jika ada tugas akademik yang jatuh tempo besok pagi/malam.
                        </span>
                      </label>
                    </div>

                    {/* Item: Agenda Organisasi */}
                    <div className="flex items-start gap-3 p-4 border-2 border-border bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                      <input
                        type="checkbox"
                        id="agendaOrganisasi"
                        checked={agendaOrganisasi}
                        onChange={(e) => setAgendaOrganisasi(e.target.checked)}
                        className="mt-1 size-4 accent-primary cursor-pointer border-2 border-border"
                      />
                      <label htmlFor="agendaOrganisasi" className="cursor-pointer select-none">
                        <span className="block text-sm font-extrabold uppercase">🏢 Agenda Organisasi</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Kirim info agenda, rapat, atau deadline program kerja organisasi H-2 secara berkala.
                        </span>
                      </label>
                    </div>

                    {/* Item: Habit Tracker Reminder */}
                    <div className="flex items-start gap-3 p-4 border-2 border-border bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                      <input
                        type="checkbox"
                        id="habitReminder"
                        checked={habitReminder}
                        onChange={(e) => setHabitReminder(e.target.checked)}
                        className="mt-1 size-4 accent-primary cursor-pointer border-2 border-border"
                      />
                      <label htmlFor="habitReminder" className="cursor-pointer select-none">
                        <span className="block text-sm font-extrabold uppercase">🔥 Habit Reminder (21:00)</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Ingatkan jam 21:00 jika ada kebiasaan/habit hari ini yang belum selesai kamu kerjakan.
                        </span>
                      </label>
                    </div>

                    {/* Item: Budget Threshold Warnings */}
                    <div className="flex items-start gap-3 p-4 border-2 border-border bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                      <input
                        type="checkbox"
                        id="budgetWarning"
                        checked={budgetWarning}
                        onChange={(e) => setBudgetWarning(e.target.checked)}
                        className="mt-1 size-4 accent-primary cursor-pointer border-2 border-border"
                      />
                      <label htmlFor="budgetWarning" className="cursor-pointer select-none">
                        <span className="block text-sm font-extrabold uppercase">💸 Peringatan Anggaran (80% & 100%)</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Kirim email instan saat pengeluaran kategori melebihi 80% (waspada) atau 100% (over limit).
                        </span>
                      </label>
                    </div>

                    {/* Item: Weekly Review */}
                    <div className="flex items-start gap-3 p-4 border-2 border-border bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                      <input
                        type="checkbox"
                        id="weeklyReview"
                        checked={weeklyReview}
                        onChange={(e) => setWeeklyReview(e.target.checked)}
                        className="mt-1 size-4 accent-primary cursor-pointer border-2 border-border"
                      />
                      <label htmlFor="weeklyReview" className="cursor-pointer select-none">
                        <span className="block text-sm font-extrabold uppercase">☀️ Weekly Life Review (Minggu Malam)</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Kirim email rekap operasional mingguan (rekap tugas, agenda, habit score, budget, dan status goals stagnan).
                        </span>
                      </label>
                    </div>

                    {/* Item: Daily Finance Summary */}
                    <div className="flex items-start gap-3 p-4 border-2 border-border bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                      <input
                        type="checkbox"
                        id="dailyFinanceReport"
                        checked={dailyFinanceReport}
                        onChange={(e) => setDailyFinanceReport(e.target.checked)}
                        className="mt-1 size-4 accent-primary cursor-pointer border-2 border-border"
                      />
                      <label htmlFor="dailyFinanceReport" className="cursor-pointer select-none">
                        <span className="block text-sm font-extrabold uppercase">💰 Ringkasan Pengeluaran Harian</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Kirim email rangkuman pengeluaran harian jam 22:00 malam. (Default: Nonaktif)
                        </span>
                      </label>
                    </div>

                    {/* Item: Monthly Financial Report */}
                    <div className="flex items-start gap-3 p-4 border-2 border-border bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                      <input
                        type="checkbox"
                        id="monthlyReport"
                        checked={monthlyReport}
                        onChange={(e) => setMonthlyReport(e.target.checked)}
                        className="mt-1 size-4 accent-primary cursor-pointer border-2 border-border"
                      />
                      <label htmlFor="monthlyReport" className="cursor-pointer select-none">
                        <span className="block text-sm font-extrabold uppercase">📊 Laporan Keuangan Bulanan (Tanggal 1)</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Kirim laporan laba rugi bulanan dan rekap tabungan bersih. (Default: Nonaktif)
                        </span>
                      </label>
                    </div>

                  </div>

                  {/* Buttons */}
                  <div className="pt-4 flex flex-col sm:flex-row gap-4 border-t border-border/20">
                    <Button type="submit" disabled={isPrefSaving} className="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                      {isPrefSaving ? "Menyimpan..." : "Simpan Preferensi"}
                    </Button>

                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={isTestEmailSending}
                      className="px-4 py-2 bg-yellow-400 text-black border-2 border-border font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isTestEmailSending ? "Mengirim..." : "⚡ Kirim Email Uji Coba"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === "help" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold uppercase font-mono">Bantuan & Dokumentasi</h2>
                <p className="text-sm text-muted-foreground">
                  Informasi tentang cara menggunakan aplikasi Kelola Diri.
                </p>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-border p-4 bg-muted/20">
                  <h3 className="font-bold text-sm uppercase mb-1">Apa itu Kelola Diri?</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Kelola Diri adalah aplikasi Personal Operating System yang dirancang khusus untuk mahasiswa aktif guna mengelola kegiatan akademik, organisasi, kebiasaan (habit tracker), dan dashboard pribadi dalam satu tempat.
                  </p>
                </div>

                <div className="border-2 border-border p-4 bg-muted/20">
                  <h3 className="font-bold text-sm uppercase mb-1">Bagaimana cara kerja Habit Tracker?</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Anda dapat mencatat kebiasaan harian atau mingguan Anda di modul Habit Tracker. Setiap kebiasaan yang Anda selesaikan akan dicatat dalam database untuk divisualisasikan menjadi statistik kemajuan Anda di dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
