"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { calculateStreaks, calculateCompletionRate } from "@/lib/habit-utils";
import Link from "next/link";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";

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
  logs: HabitLog[];
}

const REF_DATE = new Date("2026-06-14"); // Mock date

// Ambil tanggal 7 hari terakhir (Senin ke Minggu dari minggu ini)
// REF_DATE = 2026-06-14 (Minggu)
// Senin minggu ini = 2026-06-08
const getWeeklyRange = () => {
  const range = [];
  const monday = new Date(REF_DATE);
  const dayOffset = REF_DATE.getDay() === 0 ? -6 : 1 - REF_DATE.getDay();
  monday.setDate(REF_DATE.getDate() + dayOffset);
  monday.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    range.push(d);
  }
  return range;
};

const DAYS_SHORT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export default function StatsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      toast.error("Gagal memuat statistik habit");
    } finally {
      setIsLoading(false);
    }
  };

  const weekDates = getWeeklyRange();

  const getLogForDate = (habit: Habit, date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return habit.logs.find((l) => new Date(l.date).toISOString().split("T")[0] === dateStr);
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Title */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Statistik Habit</h1>
          <p className="text-muted-foreground">
            Analisis disiplin kebiasaan, perbandingan rekor streak, dan visualisasi tren mingguan Anda.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/habits">
            <button className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
              Dashboard Habit
            </button>
          </Link>
          <Link href="/dashboard/habits/checklist">
            <button className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-background text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
              Checklist Harian
            </button>
          </Link>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="border-2 border-dashed border-border p-12 text-center bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <p className="text-muted-foreground mb-4 font-mono text-sm">Belum ada statistik yang tersedia karena Anda belum membuat habit.</p>
          <Link href="/dashboard/habits/checklist">
            <button className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px]">
              Buat Kebiasaan Sekarang
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8 mb-8">
          {/* STREAK & RATE COMPARISON TABLE */}
          <div className="border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] p-6">
            <h3 className="font-mono font-extrabold text-sm uppercase tracking-wider mb-4 border-b border-border/20 pb-3">
              🏆 Performa Streak & Completion Rate
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono border-collapse">
                <thead>
                  <tr className="border-b-2 border-border bg-muted/40 text-xs font-bold uppercase select-none">
                    <th className="p-3">Nama Kebiasaan</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3 text-center">Streak Saat Ini</th>
                    <th className="p-3 text-center">Streak Terbaik</th>
                    <th className="p-3 text-right">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-border/20">
                  {habits.map((h) => {
                    const { currentStreak, bestStreak } = calculateStreaks(h.logs, REF_DATE);
                    const rate = calculateCompletionRate(h.logs);
                    const catName = h.category?.name || "Umum";
                    const catIcon = h.category?.icon || "📌";
                    const catColor = h.category?.color || "bg-muted text-muted-foreground";

                    return (
                      <tr key={h.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-3 font-bold uppercase">{h.name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase ${catColor}`}>
                            {catIcon} {catName}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-amber-500">
                          {currentStreak > 0 ? `🔥 ${currentStreak} Hari` : "0 Hari"}
                        </td>
                        <td className="p-3 text-center font-bold text-purple-600 dark:text-purple-400">
                          {bestStreak > 0 ? `🏆 ${bestStreak} Hari` : "0 Hari"}
                        </td>
                        <td className="p-3 text-right font-bold text-foreground">
                          {rate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* WEEKLY TREND CHART CARD */}
          <div className="border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] p-6">
            <h3 className="font-mono font-extrabold text-sm uppercase tracking-wider mb-6 border-b border-border/20 pb-3">
              📅 Tren Mingguan (Pencapaian Uji Coba)
            </h3>

            <div className="space-y-6">
              {habits.map((h) => {
                return (
                  <div key={h.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/10 pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <h4 className="font-mono font-bold text-sm uppercase text-foreground">{h.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Sejarah Keaktifan 7 Hari Terakhir
                      </p>
                    </div>

                    <div className="flex gap-2 items-center overflow-x-auto pb-1">
                      {weekDates.map((date, idx) => {
                        const log = getLogForDate(h, date);
                        const isCompleted = log?.completed || false;
                        const isToday = date.toDateString() === REF_DATE.toDateString();

                        return (
                          <div key={idx} className="flex flex-col items-center gap-1 select-none">
                            <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">
                              {DAYS_SHORT[idx]}
                            </span>
                            <div
                              className={`size-[30px] border-2 border-border flex items-center justify-center font-mono font-bold text-xs shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] ${
                                isCompleted
                                  ? "bg-emerald-500 text-white"
                                  : "bg-background text-muted-foreground"
                              } ${isToday ? "outline-2 outline-accent outline-offset-1" : ""}`}
                              title={date.toLocaleDateString("id-ID", { day: "numeric", month: "long" })}
                            >
                              {isCompleted ? "✓" : "✗"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
