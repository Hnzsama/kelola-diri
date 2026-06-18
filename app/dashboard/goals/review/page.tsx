"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";

interface Review {
  id: string;
  goalId: string;
  month: number;
  year: number;
  progress: number;
  note: string | null;
  createdAt: string;
}

interface Goal {
  id: string;
  title: string;
  category: string;
  status: string;
  progress: number;
  emoji: string;
  reviews: Review[];
}

const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

function ReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const goalIdParam = searchParams.get("goalId");

  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedFilterGoalId, setSelectedFilterGoalId] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [formGoalId, setFormGoalId] = useState("");
  const [formMonth, setFormMonth] = useState(new Date().getMonth() + 1);
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formProgress, setFormProgress] = useState(50);
  const [formNote, setFormNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error("Gagal");
      const data = await res.json();
      setGoals(data);

      if (data.length > 0) {
        // Initialize form goal ID
        setFormGoalId(data[0].id);

        if (goalIdParam) {
          const matched = data.find((g: Goal) => g.id === goalIdParam);
          if (matched) {
            setSelectedFilterGoalId(matched.id);
            setFormGoalId(matched.id);
            setFormProgress(matched.progress);
          }
        }
      }
    } catch {
      toast.error("Gagal memuat data goal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterGoalChange = (id: string) => {
    setSelectedFilterGoalId(id);
    if (id !== "ALL") {
      router.push(`/dashboard/goals/review?goalId=${id}`);
      const g = goals.find((x) => x.id === id);
      if (g) {
        setFormGoalId(g.id);
        setFormProgress(g.progress);
      }
    } else {
      router.push("/dashboard/goals/review");
    }
  };

  const handleGoalSelectInForm = (id: string) => {
    setFormGoalId(id);
    const g = goals.find((x) => x.id === id);
    if (g) {
      setFormProgress(g.progress);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGoalId) {
      toast.error("Pilih goal yang ingin di-review");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/goals/${formGoalId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: Number(formMonth),
          year: Number(formYear),
          progress: Number(formProgress),
          note: formNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan review");
        return;
      }

      toast.success("Review progress bulanan berhasil disimpan!");
      setFormNote("");
      // Reload goals list to reflect new review in timeline
      fetchGoals();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compile all reviews with associated goal info
  const allReviewsCompiled: (Review & { goalTitle: string; goalEmoji: string })[] = [];
  goals.forEach((g) => {
    if (selectedFilterGoalId === "ALL" || g.id === selectedFilterGoalId) {
      if (g.reviews) {
        g.reviews.forEach((r) => {
          allReviewsCompiled.push({
            ...r,
            goalTitle: g.title,
            goalEmoji: g.emoji,
          });
        });
      }
    }
  });

  // Sort reviews chronologically desc: Year desc, Month desc, Created Date desc
  const sortedReviews = allReviewsCompiled.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    if (b.month !== a.month) return b.month - a.month;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (goals.length === 0) {
    return (
      <div className="w-full px-4 lg:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase mb-6">Progress Review</h1>
        <div className="border-2 border-dashed border-border p-12 text-center bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <p className="text-sm font-mono text-muted-foreground mb-6">Anda belum memiliki goal aktif untuk direview.</p>
          <Link href="/dashboard/goals/active">
            <button className="px-5 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
              Buat Goal Sekarang
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Progress Review</h1>
        <p className="text-muted-foreground font-mono text-xs">
          Refleksikan pencapaian bulanan Anda, pantau tren grafik perkembangan, dan catat pelajaran berharga.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-8">
        {/* Review Form */}
        <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <div className="border-b border-border/20 pb-3 mb-5">
            <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight">📝 Buat Review Bulanan</h3>
          </div>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Goal Selector */}
            <div>
              <label className="block font-mono font-bold text-xs uppercase text-muted-foreground mb-1">Pilih Goal</label>
              <select
                value={formGoalId}
                onChange={(e) => handleGoalSelectInForm(e.target.value)}
                className="w-full border-2 border-border bg-background p-2.5 font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
              >
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.emoji} {g.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Month */}
              <div>
                <label className="block font-mono font-bold text-xs uppercase text-muted-foreground mb-1">Bulan</label>
                <select
                  value={formMonth}
                  onChange={(e) => setFormMonth(Number(e.target.value))}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block font-mono font-bold text-xs uppercase text-muted-foreground mb-1">Tahun</label>
                <select
                  value={formYear}
                  onChange={(e) => setFormYear(Number(e.target.value))}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                >
                  {[2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Progress Slider */}
            <div>
              <div className="flex justify-between font-mono font-bold text-xs uppercase text-muted-foreground mb-1">
                <span>Progress Saat Ini</span>
                <span className="text-primary font-extrabold">{formProgress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={formProgress}
                onChange={(e) => setFormProgress(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-muted border border-border rounded-lg appearance-none cursor-pointer"
              />
              <span className="block text-[9px] font-mono text-muted-foreground mt-1.5 leading-relaxed uppercase">
                (Otomatis diselaraskan dengan progress milestone. Anda dapat menyesuaikannya untuk snapshot review)
              </span>
            </div>

            {/* Note */}
            <div>
              <label className="block font-mono font-bold text-xs uppercase text-muted-foreground mb-1">Catatan Refleksi</label>
              <textarea
                placeholder="Bagaimana perkembangan bulan ini? Hambatan apa saja yang dihadapi, dan apa rencana perbaikan ke depan?"
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                rows={4}
                className="w-full border-2 border-border bg-background p-2.5 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 border-2 border-border bg-primary text-primary-foreground font-mono font-bold text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Review"}
            </button>
          </form>
        </div>

        {/* Timeline Timeline */}
        <div className="lg:col-span-2 border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          {/* Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/20 pb-4 mb-6">
            <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight">📖 Riwayat Refleksi Bulanan</h3>
            <select
              value={selectedFilterGoalId}
              onChange={(e) => handleFilterGoalChange(e.target.value)}
              className="border-2 border-border bg-background p-2 font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
            >
              <option value="ALL">Semua Goal</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.emoji} {g.title}
                </option>
              ))}
            </select>
          </div>

          {sortedReviews.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border">
              <p className="text-xs text-muted-foreground font-mono italic">Belum ada review progress bulanan yang dicatat.</p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-border space-y-6">
              {sortedReviews.map((r) => {
                const monthName = MONTHS.find((m) => m.value === r.month)?.label || r.month;
                return (
                  <div key={r.id} className="relative bg-background border-2 border-border p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                    {/* Timeline Node Icon positioned absolutely */}
                    <span className="absolute -left-[35px] top-4 flex items-center justify-center size-6 rounded-full border-2 border-border bg-card text-xs shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] z-10">
                      📝
                    </span>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/20 pb-2 mb-2 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold uppercase">
                          {monthName} {r.year}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs font-bold text-primary uppercase">
                          {r.goalEmoji} {r.goalTitle}
                        </span>
                      </div>
                      <span className="text-xs bg-primary/10 border border-primary/30 px-2 py-0.5 font-bold text-primary">
                        Progress: {r.progress}%
                      </span>
                    </div>

                    {r.note && (
                      <p className="text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
                        {r.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GoalReviewPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ReviewContent />
    </Suspense>
  );
}
