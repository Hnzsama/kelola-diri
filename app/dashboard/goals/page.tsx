"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  progress: number;
  targetDate: string | null;
  emoji: string;
}

interface Stats {
  activeCount: number;
  achievedCount: number;
  averageProgress: number;
  deadlineThisMonthCount: number;
  distribution: { category: string; count: number }[];
  upcoming: Goal[];
}

const CATEGORY_META: Record<string, { label: string; color: string; icon: string }> = {
  ACADEMIC: { label: "Akademik", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-400/30", icon: "📚" },
  ORGANIZATION: { label: "Organisasi", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-400/30", icon: "🏢" },
  HABIT: { label: "Habit", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-400/30", icon: "🔄" },
  PERSONAL: { label: "Personal", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/30", icon: "👤" },
  CAREER: { label: "Karier", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-400/30", icon: "🚀" },
};

export default function GoalDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/goals/stats");
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      setStats(data);
    } catch {
      toast.error("Gagal memuat statistik goal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedDummy = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/goals/dummy", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal membuat data");
        return;
      }
      toast.success(data.success || "Data contoh berhasil dimuat!");
      fetchStats();
    } catch {
      toast.error("Terjadi kesalahan saat memuat data contoh");
    } finally {
      setIsSeeding(false);
    }
  };

  function getStatusBadge(progress: number, status: string) {
    if (status === "ACHIEVED") {
      return { label: "Tercapai", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-400/30" };
    }
    if (progress >= 80) {
      return { label: "Excellent", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-400/30" };
    }
    if (progress >= 50) {
      return { label: "On Track", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-400/30" };
    }
    if (progress >= 25) {
      return { label: "Need Improvement", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/30" };
    }
    return { label: "Behind", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-400/30" };
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const hasGoals = stats && (stats.activeCount > 0 || stats.achievedCount > 0);

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Dashboard Goal</h1>
          <p className="text-muted-foreground">
            Hubungkan Akademik, Organisasi, dan Habit tracker dengan visi & target hidup jangka panjang Anda.
          </p>
        </div>
        {!hasGoals && (
          <button
            onClick={handleSeedDummy}
            disabled={isSeeding}
            className="flex items-center gap-2 px-5 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSeeding ? "Memproses..." : "Muat Data Contoh"}
          </button>
        )}
      </div>

      {!hasGoals ? (
        /* Empty State */
        <div className="border-2 border-dashed border-border p-12 text-center bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-lg font-bold font-mono uppercase mb-1">Belum Ada Goal</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Mulailah merancang target hidup Anda, atau gunakan data contoh untuk melihat demo fitur.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/dashboard/goals/active">
              <button className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-background text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
                Buat Goal Pertama
              </button>
            </Link>
            <button
              onClick={handleSeedDummy}
              disabled={isSeeding}
              className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer"
            >
              {isSeeding ? "Memproses..." : "Muat Data Contoh"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Goal Aktif", value: stats.activeCount, sub: "Sedang Berjalan", color: "text-blue-600 dark:text-blue-400" },
              { label: "Tercapai", value: stats.achievedCount, sub: "Visi Tercapai", color: "text-purple-600 dark:text-purple-400" },
              { label: "Progress Rata-rata", value: `${stats.averageProgress}%`, sub: "Goal Aktif", color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Deadline Bulan Ini", value: stats.deadlineThisMonthCount, sub: "Perlu Fokus", color: "text-rose-600 dark:text-rose-400" },
            ].map((s) => (
              <div key={s.label} className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <h3 className={`text-4xl font-extrabold font-mono mt-2 ${s.color}`}>{s.value}</h3>
                <div className="mt-3 pt-2 border-t border-border/20 text-xs font-mono text-muted-foreground">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-start">
            {/* Top Priorities */}
            <div className="lg:col-span-2 border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-5">
                <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight">🔥 Prioritas Terdekat & Fokus Utama</h3>
                <Link href="/dashboard/goals/active">
                  <button className="px-3 py-1 border-2 border-border font-bold text-[10px] uppercase bg-background shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
                    Lihat Semua
                  </button>
                </Link>
              </div>

              {stats.upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground font-mono italic py-4 text-center">Tidak ada goal aktif.</p>
              ) : (
                <div className="space-y-4">
                  {stats.upcoming.map((g) => {
                    const cat = CATEGORY_META[g.category] || { label: g.category, color: "bg-muted text-foreground border-border/30", icon: "🎯" };
                    const badge = getStatusBadge(g.progress, g.status);
                    const d = g.targetDate ? new Date(g.targetDate) : null;
                    return (
                      <div key={g.id} className="border-2 border-border p-4 bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{g.emoji}</span>
                            <div>
                              <h4 className="font-mono font-bold text-sm uppercase">{g.title}</h4>
                              <span className={`inline-block font-mono text-[9px] px-1.5 py-0.5 border font-bold uppercase mt-1 ${cat.color}`}>
                                {cat.icon} {cat.label}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className={`font-mono text-[10px] px-2 py-0.5 border font-bold uppercase ${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>
                        </div>

                        {g.description && (
                          <p className="text-xs text-muted-foreground mb-4 font-mono">{g.description}</p>
                        )}

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono font-bold uppercase text-muted-foreground">
                            <span>Progress</span>
                            <span>{g.progress}%</span>
                          </div>
                          <div className="w-full h-3 bg-muted border border-border">
                            <div
                              className="h-full bg-primary transition-all duration-300 border-r border-border"
                              style={{ width: `${g.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-border/20 flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                          <span>
                            Target: {d ? d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                          </span>
                          <div className="flex gap-2">
                            <Link href={`/dashboard/goals/roadmap?goalId=${g.id}`}>
                              <span className="text-primary hover:underline font-bold cursor-pointer uppercase">Roadmap ↗</span>
                            </Link>
                            <Link href={`/dashboard/goals/review?goalId=${g.id}`}>
                              <span className="text-primary hover:underline font-bold cursor-pointer uppercase">Review ↗</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Distribution by Category */}
            <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <div className="border-b border-border/20 pb-3 mb-4">
                <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight">📊 Distribusi Kategori</h3>
              </div>
              <div className="space-y-3.5">
                {stats.distribution.map((d) => {
                  const meta = CATEGORY_META[d.category] || { label: d.category, color: "text-muted-foreground", icon: "🎯" };
                  const maxCount = Math.max(...stats.distribution.map((i) => i.count), 1);
                  const pct = Math.round((d.count / maxCount) * 100);
                  return (
                    <div key={d.category} className="space-y-1 font-mono">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold">
                          {meta.icon} {meta.label}
                        </span>
                        <span className="text-muted-foreground font-bold">{d.count} Goal</span>
                      </div>
                      <div className="w-full h-3 bg-muted border border-border">
                        <div
                          className="h-full bg-primary border-r border-border"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cross-Module Connections */}
          <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] mb-8">
            <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight border-b border-border/20 pb-3 mb-4">
              🔗 Koneksi & Penyelarasan Sistem
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-2 border-border p-4 bg-background">
                <div className="text-xl mb-2">📚</div>
                <h4 className="font-mono font-bold text-xs uppercase mb-1">Hubungan Akademik</h4>
                <p className="text-[11px] text-muted-foreground font-mono mb-4">
                  Sempurnakan mata kuliah & submit tugas tepat waktu untuk mencapai target nilai akademik Anda.
                </p>
                <Link href="/dashboard/academic">
                  <span className="text-xs font-mono font-bold uppercase text-primary hover:underline cursor-pointer">
                    Planner Akademik ↗
                  </span>
                </Link>
              </div>

              <div className="border-2 border-border p-4 bg-background">
                <div className="text-xl mb-2">🏢</div>
                <h4 className="font-mono font-bold text-xs uppercase mb-1">Hubungan Organisasi</h4>
                <p className="text-[11px] text-muted-foreground font-mono mb-4">
                  Tuntaskan agenda kerja kepanitiaan dan proker yang sejalan dengan kompetensi organisasi Anda.
                </p>
                <Link href="/dashboard/organizations">
                  <span className="text-xs font-mono font-bold uppercase text-primary hover:underline cursor-pointer">
                    Dashboard Organisasi ↗
                  </span>
                </Link>
              </div>

              <div className="border-2 border-border p-4 bg-background">
                <div className="text-xl mb-2">🔄</div>
                <h4 className="font-mono font-bold text-xs uppercase mb-1">Hubungan Habit</h4>
                <p className="text-[11px] text-muted-foreground font-mono mb-4">
                  Bangun rutinitas harian yang menunjang mastery. Konsistensi kecil menghasilkan pencapaian besar.
                </p>
                <Link href="/dashboard/habits">
                  <span className="text-xs font-mono font-bold uppercase text-primary hover:underline cursor-pointer">
                    Habit Tracker ↗
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
