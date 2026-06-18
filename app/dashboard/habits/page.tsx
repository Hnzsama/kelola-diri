"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { calculateStreaks, calculateCompletionRate } from "@/lib/habit-utils";

interface HabitLog {
  date: string;
  completed: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Habit {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  category: Category | null;
  isActive: boolean;
  createdAt: string;
  logs: HabitLog[];
}

const DAYS_INDONESIAN = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const REF_DATE = new Date("2026-06-14"); // Mock date

export default function HabitDashboardPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/habits");
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      setHabits(data);
    } catch (error) {
      toast.error("Gagal memuat data kebiasaan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedDummy = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/habits/dummy", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal memuat data contoh");
      } else {
        toast.success(data.success || "Data contoh berhasil dimuat!");
        fetchHabits();
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSeeding(false);
    }
  };

  // 1. STATS METRICS
  const activeHabitsCount = habits.filter((h) => h.isActive).length;
  
  // Progres Hari Ini
  const todayStr = REF_DATE.toISOString().split("T")[0];
  const activeHabits = habits.filter((h) => h.isActive);
  const totalActiveToday = activeHabits.length;
  const completedTodayCount = activeHabits.filter((h) => 
    h.logs.some((l) => new Date(l.date).toISOString().split("T")[0] === todayStr && l.completed)
  ).length;
  const todayProgress = totalActiveToday > 0 ? Math.round((completedTodayCount / totalActiveToday) * 100) : 0;

  // Streak kalkulasi
  let maxCurrentStreak = 0;
  let maxBestStreak = 0;
  
  habits.forEach((h) => {
    const { currentStreak, bestStreak } = calculateStreaks(h.logs, REF_DATE);
    if (currentStreak > maxCurrentStreak) maxCurrentStreak = currentStreak;
    if (bestStreak > maxBestStreak) maxBestStreak = bestStreak;
  });

  // 2. HEATMAP DATA GENERATION
  // Bentuk array 90 hari terakhir
  const heatmapDates: Date[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(REF_DATE);
    d.setDate(REF_DATE.getDate() - i);
    d.setHours(0, 0, 0, 0);
    heatmapDates.push(d);
  }

  // Map untuk penghitungan log harian
  const dailyLogsMap: { [key: string]: { completed: number; total: number } } = {};
  habits.forEach((h) => {
    h.logs.forEach((l) => {
      const dateKey = new Date(l.date).toISOString().split("T")[0];
      if (!dailyLogsMap[dateKey]) {
        dailyLogsMap[dateKey] = { completed: 0, total: 0 };
      }
      if (l.completed) {
        dailyLogsMap[dateKey].completed++;
      }
      dailyLogsMap[dateKey].total++;
    });
  });

  // Susun cells untuk grid calendar
  const startDayOfWeek = heatmapDates[0].getDay(); // 0: Minggu, 1: Senin, dsb.
  interface GridCell {
    isDummy: boolean;
    date: Date | null;
    count: number;
  }
  const gridCells: GridCell[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    gridCells.push({ isDummy: true, date: null, count: 0 });
  }
  heatmapDates.forEach((date) => {
    const dateKey = date.toISOString().split("T")[0];
    const completedCount = dailyLogsMap[dateKey]?.completed || 0;
    gridCells.push({
      isDummy: false,
      date,
      count: completedCount,
    });
  });

  const getHeatmapColor = (count: number) => {
    if (count === 0) return "bg-muted/30 dark:bg-muted/15 border-border/20";
    if (count === 1) return "bg-emerald-500/25 border-emerald-500/20";
    if (count <= 3) return "bg-emerald-500/50 border-emerald-500/40";
    return "bg-emerald-500 border-emerald-600";
  };

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Title */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Dashboard Habit</h1>
          <p className="text-muted-foreground">
            Lacak kebiasaan harian penunjang target akademik dan pengembangan kompetensi Anda.
          </p>
        </div>
        {habits.length === 0 && (
          <div>
            <button
              onClick={handleSeedDummy}
              disabled={isSeeding}
              className="flex items-center gap-2 px-5 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider text-left transition-all cursor-pointer bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] disabled:opacity-50"
            >
              <span>{isSeeding ? "Memproses..." : "Muat Data Contoh"}</span>
            </button>
          </div>
        )}
      </div>

      {habits.length === 0 ? (
        <div className="border-2 border-dashed border-border p-12 text-center bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mx-auto size-12 text-muted-foreground mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <h3 className="text-lg font-bold font-mono uppercase mb-1">Belum Ada Kebiasaan</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Buat target kebiasaan harian Anda atau gunakan data contoh untuk demo langsung.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/dashboard/habits/checklist">
              <button className="px-4 py-2 border-2 border-border font-bold text-xs uppercase transition-all bg-background text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                Buat Habit Pertama
              </button>
            </Link>
            <button
              onClick={handleSeedDummy}
              disabled={isSeeding}
              className="px-4 py-2 border-2 border-border font-bold text-xs uppercase transition-all bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
            >
              {isSeeding ? "Memproses..." : "Muat Data Contoh"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* STATS METRIC GRID */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Habit Aktif</span>
                <h3 className="text-3xl font-extrabold font-mono mt-1">{activeHabitsCount}</h3>
              </div>
              <div className="mt-4 pt-2 border-t border-border/20 text-xs font-mono text-muted-foreground flex justify-between">
                <span>Total Habit:</span>
                <span className="font-bold text-foreground">{habits.length}</span>
              </div>
            </div>

            <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Progres Hari Ini</span>
                <h3 className="text-3xl font-extrabold font-mono mt-1 text-emerald-600 dark:text-emerald-400">{todayProgress}%</h3>
              </div>
              <div className="mt-4 pt-2 border-t border-border/20 text-xs font-mono text-muted-foreground flex justify-between">
                <span>Tercapai:</span>
                <span className="font-bold text-foreground">{completedTodayCount} / {totalActiveToday}</span>
              </div>
            </div>

            <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Streak Saat Ini</span>
                <h3 className="text-3xl font-extrabold font-mono mt-1 text-amber-500">{maxCurrentStreak} Hari</h3>
              </div>
              <div className="mt-4 pt-2 border-t border-border/20 text-xs font-mono text-muted-foreground flex justify-between">
                <span>Disiplin Harian</span>
                <span className="font-bold text-foreground">🔥 Max Streak</span>
              </div>
            </div>

            <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Streak Terbaik</span>
                <h3 className="text-3xl font-extrabold font-mono mt-1 text-purple-600 dark:text-purple-400">{maxBestStreak} Hari</h3>
              </div>
              <div className="mt-4 pt-2 border-t border-border/20 text-xs font-mono text-muted-foreground flex justify-between">
                <span>Rekor Terlama</span>
                <span className="font-bold text-foreground">🏆 Pencapaian</span>
              </div>
            </div>
          </div>

          {/* HEATMAP GRIDS PANEL */}
          <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] mb-8">
            <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-5">
              <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight flex items-center gap-2">
                📊 Grid Visual Kebiasaan (90 Hari Terakhir)
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-muted-foreground uppercase">
                <span>Selesai:</span>
                <span className="size-3 bg-muted/30 border border-border/20" title="0 habit" />
                <span className="size-3 bg-emerald-500/25 border border-emerald-500/20" title="1 habit" />
                <span className="size-3 bg-emerald-500/50 border border-emerald-500/40" title="2-3 habit" />
                <span className="size-3 bg-emerald-500 border border-emerald-600" title="4+ habit" />
              </div>
            </div>

            <div className="max-w-full overflow-x-auto scrollbar-thin pb-2">
              <div className="flex gap-2 min-w-[640px]">
                {/* Judul Hari (Row) */}
                <div className="grid grid-rows-7 gap-1 font-mono text-[9px] font-bold text-muted-foreground uppercase py-1 pr-1 select-none">
                  <span>Min</span>
                  <span className="opacity-0">Sen</span>
                  <span>Sel</span>
                  <span className="opacity-0">Rab</span>
                  <span>Kam</span>
                  <span className="opacity-0">Jum</span>
                  <span>Sab</span>
                </div>

                {/* Grid Kontribusi */}
                <div className="flex-1 grid grid-flow-col grid-rows-7 gap-1.5 py-1">
                  {gridCells.map((cell, idx) => {
                    if (cell.isDummy) {
                      return <div key={`dummy-${idx}`} className="size-[15px] bg-transparent opacity-0" />;
                    }

                    const formattedDate = cell.date?.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });

                    return (
                      <div
                        key={`day-${idx}`}
                        className={`size-[15px] border transition-all cursor-crosshair hover:scale-125 rounded-[1px] ${getHeatmapColor(
                          cell.count
                        )}`}
                        title={`${formattedDate}: ${cell.count} kebiasaan selesai`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* PROGRESS PER HABIT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 items-start">
            {/* HABIT COMPLETION RATES */}
            <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <div className="flex items-center justify-between border-b border-border/20 pb-4 mb-4">
                <h3 className="font-mono font-extrabold text-base uppercase tracking-tight">
                  📈 Tingkat Penyelesaian Habit
                </h3>
                <Link href="/dashboard/habits/stats">
                  <button className="px-3 py-1 border-2 border-border font-bold text-[10px] uppercase bg-background text-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer">
                    Detail Statistik
                  </button>
                </Link>
              </div>

              <div className="space-y-5">
                {habits.map((h) => {
                  const rate = calculateCompletionRate(h.logs);
                  const { currentStreak } = calculateStreaks(h.logs, REF_DATE);
                  const catName = h.category?.name || "Umum";
                  const catIcon = h.category?.icon || "📌";
                  const catColor = h.category?.color || "bg-muted text-muted-foreground";

                  return (
                    <div key={h.id} className="space-y-1.5">
                      <div className="flex justify-between items-start text-xs font-mono">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold uppercase text-foreground">{h.name}</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.2 border uppercase w-fit ${catColor}`}>
                            {catIcon} {catName}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 font-bold">
                          <span>{rate}%</span>
                          {currentStreak > 0 && (
                            <span className="text-[9px] text-amber-600 dark:text-amber-400">🔥 {currentStreak} H</span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-muted border border-border h-3.5 rounded-none overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-300"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QUICK ACTIONS & TARGET INTEGRATION PREVIEW */}
            <div className="space-y-6">
              <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <h3 className="font-mono font-extrabold text-sm uppercase tracking-widest border-b border-border/20 pb-3 mb-4 text-muted-foreground">
                  ⚡ Akses Cepat Habit Tracker
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link href="/dashboard/habits/checklist" className="block text-center border-2 border-border p-4 bg-muted/20 hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <span className="block text-base font-extrabold font-mono uppercase">Checklist Harian</span>
                    <span className="text-[10px] font-mono opacity-80">Catat Habit Hari Ini</span>
                  </Link>
                  <Link href="/dashboard/habits/categories" className="block text-center border-2 border-border p-4 bg-muted/20 hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <span className="block text-base font-extrabold font-mono uppercase">Kelola Kategori</span>
                    <span className="text-[10px] font-mono opacity-80">Kategori Kebiasaan</span>
                  </Link>
                  <Link href="/dashboard/habits/stats" className="block text-center border-2 border-border p-4 bg-muted/20 hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <span className="block text-base font-extrabold font-mono uppercase">Statistik</span>
                    <span className="text-[10px] font-mono opacity-80">Streak & Tren</span>
                  </Link>
                </div>
              </div>

              {/* Hubungan Target (Goal) & Habit */}
              <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <h4 className="font-mono font-extrabold text-xs uppercase tracking-wider text-accent mb-2">💡 Target & Kebiasaan</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Kebiasaan harian Anda dirancang untuk saling terhubung dengan target utama Anda (IPK Tinggi, Kesiapan Karier, Kebugaran Fisik). Setiap progress di sini akan menyokong modul <strong>Goal Tracker</strong> yang akan segera hadir!
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
