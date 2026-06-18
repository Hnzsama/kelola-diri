"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useConfirm } from "@/components/ui/confirm-modal";
import { DatePicker } from "@/components/ui/date-picker";
import { CardGridSkeleton } from "@/components/ui/page-skeleton";

interface BudgetVsSpent {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budget: number;
  spent: number;
}

interface YearlyBudget {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}

interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  emoji: string;
  goal: { title: string } | null;
}

interface Stats {
  balance: number;
  income: number;
  expense: number;
  savings: number;
  prevMonthExpense: number;
  budgetVsSpent: BudgetVsSpent[];
  yearlyBudgets: YearlyBudget[];
  savingsGoals: SavingsGoal[];
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

export default function BudgetLimitsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Date selectors
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Input states for editing limits
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});

  // Quick Add Transaction states
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddCatId, setQuickAddCatId] = useState("");
  const [quickAddCatName, setQuickAddCatName] = useState("");
  const [quickAddAmount, setQuickAddAmount] = useState("");
  const [quickAddDesc, setQuickAddDesc] = useState("");
  const [quickAddDate, setQuickAddDate] = useState("");
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  // Quick Savings Allocation states
  const [allocAmount, setAllocAmount] = useState("");
  const [allocGoalId, setAllocGoalId] = useState("");
  const [isAllocating, setIsAllocating] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [selectedMonth, selectedYear]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/finance/stats?month=${selectedMonth}&year=${selectedYear}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data: Stats = await res.json();
      setStats(data);

      // Initialize inputs based on fetched budgets
      const initialInputs: Record<string, string> = {};
      data.budgetVsSpent.forEach((item) => {
        initialInputs[item.categoryId] = item.budget > 0 ? String(item.budget) : "";
      });
      setInputs(initialInputs);

      // Default allocate target to first goal if any
      if (data.savingsGoals.length > 0 && !allocGoalId) {
        setAllocGoalId(data.savingsGoals[0].id);
      }
    } catch {
      toast.error("Gagal memuat batas anggaran");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBudget = async (categoryId: string) => {
    const rawVal = inputs[categoryId];
    const amountNum = rawVal === "" ? 0 : parseFloat(rawVal);

    if (isNaN(amountNum) || amountNum < 0) {
      toast.error("Nominal anggaran tidak valid");
      return;
    }

    setIsSaving((prev) => ({ ...prev, [categoryId]: true }));
    try {
      const res = await fetch("/api/finance/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          amount: amountNum,
          month: selectedMonth,
          year: selectedYear,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan anggaran");
        return;
      }

      toast.success(`Anggaran ${data.category?.name || "Kategori"} berhasil diperbarui!`);
      fetchStats();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSaving((prev) => ({ ...prev, [categoryId]: false }));
    }
  };

  const handleOpenQuickAdd = (categoryId: string, categoryName: string) => {
    setQuickAddCatId(categoryId);
    setQuickAddCatName(categoryName);
    setQuickAddAmount("");
    setQuickAddDesc("");
    setQuickAddDate(new Date().toISOString().split("T")[0]);
    setIsQuickAddOpen(true);
  };

  const handleQuickAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(quickAddAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Nominal transaksi tidak valid");
      return;
    }

    setIsSubmittingTx(true);
    try {
      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "EXPENSE",
          amount: amountNum,
          categoryId: quickAddCatId,
          description: quickAddDesc,
          date: quickAddDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mencatat pengeluaran");
        return;
      }

      toast.success(`Berhasil mencatat pengeluaran di kategori ${quickAddCatName}!`);
      setIsQuickAddOpen(false);
      fetchStats();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const handleQuickAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(allocAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Nominal alokasi dana tidak valid");
      return;
    }
    if (!allocGoalId) {
      toast.error("Silakan pilih target tabungan terlebih dahulu");
      return;
    }

    setIsAllocating(true);
    try {
      const res = await fetch(`/api/finance/goals/${allocGoalId}/add-funds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mengalokasikan tabungan");
        return;
      }

      toast.success(`Sukses menabung ${formatRupiah(amountNum)} ke target: ${data.title}!`);
      setAllocAmount("");
      fetchStats();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsAllocating(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getHealthStatus = (spent: number, budget: number) => {
    if (budget <= 0) return { label: "Belum Diatur", color: "bg-muted text-muted-foreground border-border/30" };
    const pct = (spent / budget) * 100;
    if (pct < 70) return { label: "🟢 Aman", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-400/30" };
    if (pct <= 100) return { label: "🟡 Waspada", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/30" };
    return { label: "🔴 Bahaya", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500 animate-pulse" };
  };

  const getForecastAndPace = (spent: number, budget: number) => {
    const today = new Date();
    const isCurrent = selectedMonth === (today.getMonth() + 1) && selectedYear === today.getFullYear();
    const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();
    const currentDay = isCurrent ? today.getDate() : totalDays;

    const forecasted = (spent / (currentDay || 1)) * totalDays;
    const remainingDays = isCurrent ? (totalDays - currentDay + 1) : 0;
    const remainingBudget = budget - spent;
    const dailyRecommendation = isCurrent && remainingDays > 0 && remainingBudget > 0 
      ? remainingBudget / remainingDays 
      : 0;

    return {
      forecasted,
      isOverForecast: budget > 0 && forecasted > budget,
      potentialDeficit: forecasted - budget,
      remainingDays,
      dailyRecommendation,
      isCurrent,
    };
  };

  const getHistory = (categoryId: string) => {
    if (!stats) return [];
    const lookBack = [];
    for (let i = 1; i <= 3; i++) {
      let m = selectedMonth - i;
      let y = selectedYear;
      if (m <= 0) {
        m = 12 + m;
        y = selectedYear - 1;
      }
      lookBack.push({ month: m, year: y });
    }

    return lookBack.map((lb) => {
      const bObj = stats.yearlyBudgets.find(
        (yb) => yb.categoryId === categoryId && yb.month === lb.month && yb.year === lb.year
      );
      const monthName = MONTHS.find((m) => m.value === lb.month)?.label || String(lb.month);
      return {
        monthName,
        amount: bObj ? bObj.amount : null,
      };
    }).filter((h) => h.amount !== null);
  };

  // Calculations for overview card
  const totalBudget = stats?.budgetVsSpent.reduce((sum, item) => sum + item.budget, 0) || 0;
  const totalSpent = stats?.budgetVsSpent.reduce((sum, item) => sum + item.spent, 0) || 0;
  const remainingBudget = totalBudget - totalSpent;
  const totalPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Recommendations for Savings Target
  const netIncome = stats ? stats.income - stats.expense : 0;
  const recommendedSavings = netIncome > 0 ? Math.round(netIncome * 0.2) : 0;

  // Insight calculations
  const sortedBySpent = stats ? [...stats.budgetVsSpent].sort((a, b) => b.spent - a.spent) : [];
  const largestSpent = sortedBySpent.length > 0 && totalSpent > 0 ? sortedBySpent[0] : null;
  const largestPct = largestSpent ? Math.round((largestSpent.spent / totalSpent) * 100) : 0;

  // Most economical category (active budget, spent < budget, lowest pct spent)
  const activeBudgeted = stats ? stats.budgetVsSpent.filter(item => item.budget > 0) : [];
  const sortedByPct = [...activeBudgeted].sort((a, b) => (a.spent / a.budget) - (b.spent / b.budget));
  const mostEconomical = sortedByPct.length > 0 && sortedByPct[0].spent < sortedByPct[0].budget ? sortedByPct[0] : null;

  // Compare with last month
  const prevMonthDiff = stats && stats.prevMonthExpense > 0 
    ? Math.round(((totalSpent - stats.prevMonthExpense) / stats.prevMonthExpense) * 100)
    : null;

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Batas Anggaran & Analisis</h1>
          <p className="text-muted-foreground font-mono text-xs">
            Kelola pengeluaran harian, pantau status kesehatan dana, dan kendalikan masa depan finansial Anda.
          </p>
        </div>
        <Link href="/dashboard/finance">
          <button className="px-4 py-2.5 border-2 border-border font-bold text-xs uppercase bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
            ← Dashboard
          </button>
        </Link>
      </div>

      {/* FILTER BAR */}
      <div className="border-2 border-border bg-card p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-xs uppercase text-muted-foreground">Periode Anggaran:</span>
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="border-2 border-border bg-background p-2 font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border-2 border-border bg-background p-2 font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
            >
              {[2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-[10px] font-mono text-muted-foreground uppercase font-bold">
          Bulan terpilih: {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
        </div>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={3} />
      ) : (
        stats && (
          <div className="space-y-8 mb-8">
            {/* MONTHLY INSIGHTS CARD */}
            <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight border-b border-border/20 pb-3 mb-4">
                📊 Insight Bulanan ({MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Largest Category */}
                <div className="border border-border p-4 bg-background/50 font-mono">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold">Pengeluaran Terbesar</span>
                  {largestSpent ? (
                    <div className="mt-2">
                      <h4 className="text-sm font-extrabold uppercase truncate">
                        {largestSpent.categoryIcon} {largestSpent.categoryName}
                      </h4>
                      <p className="text-xs font-bold text-rose-600 mt-1">
                        {formatRupiah(largestSpent.spent)} ({largestPct}%)
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic mt-2">Belum ada pengeluaran</p>
                  )}
                </div>

                {/* Most Economical Category */}
                <div className="border border-border p-4 bg-background/50 font-mono">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold">Kategori Paling Hemat</span>
                  {mostEconomical ? (
                    <div className="mt-2">
                      <h4 className="text-sm font-extrabold uppercase truncate">
                        {mostEconomical.categoryIcon} {mostEconomical.categoryName}
                      </h4>
                      <p className="text-xs font-bold text-emerald-600 mt-1">
                        Baru terpakai {Math.round((mostEconomical.spent / mostEconomical.budget) * 100)}%
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic mt-2">Belum ada budget aktif</p>
                  )}
                </div>

                {/* Spending trend change */}
                <div className="border border-border p-4 bg-background/50 font-mono">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold">Perubahan Pengeluaran</span>
                  <div className="mt-2">
                    {prevMonthDiff !== null ? (
                      <>
                        <h4 className={`text-base font-extrabold ${prevMonthDiff > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {prevMonthDiff > 0 ? `+${prevMonthDiff}%` : `${prevMonthDiff}%`}
                        </h4>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-1">
                          Dibanding bulan lalu ({formatRupiah(stats.prevMonthExpense)})
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground italic mt-2">Data bulan lalu kosong</p>
                    )}
                  </div>
                </div>

                {/* Savings Potential */}
                <div className="border border-border p-4 bg-background/50 font-mono">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold">Potensi Menabung Bersih</span>
                  <div className="mt-2">
                    <h4 className={`text-base font-extrabold ${netIncome > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {formatRupiah(Math.max(0, netIncome))}
                    </h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-1">
                      Sisa kas bersih bulan ini
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* SAVINGS ALLOCATION CARD & OVERVIEW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overview */}
              <div className="lg:col-span-2 border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between">
                <div>
                  <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight border-b border-border/20 pb-3 mb-4">
                    📈 Ringkasan Batas Anggaran
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="border-2 border-border p-3.5 bg-background">
                      <span className="text-[8px] font-mono font-bold uppercase text-muted-foreground block">Total Anggaran</span>
                      <span className="text-lg font-extrabold font-mono mt-1 block">{formatRupiah(totalBudget)}</span>
                    </div>
                    <div className="border-2 border-border p-3.5 bg-background">
                      <span className="text-[8px] font-mono font-bold uppercase text-muted-foreground block">Pengeluaran Riil</span>
                      <span className={`text-lg font-extrabold font-mono mt-1 block ${totalSpent > totalBudget && totalBudget > 0 ? "text-rose-600 animate-pulse" : "text-foreground"}`}>
                        {formatRupiah(totalSpent)}
                      </span>
                    </div>
                    <div className="border-2 border-border p-3.5 bg-background">
                      <span className="text-[8px] font-mono font-bold uppercase text-muted-foreground block">Sisa Anggaran</span>
                      <span className={`text-lg font-extrabold font-mono mt-1 block ${remainingBudget >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {remainingBudget >= 0 ? formatRupiah(remainingBudget) : `Defisit ${formatRupiah(Math.abs(remainingBudget))}`}
                      </span>
                    </div>
                  </div>
                </div>

                {totalBudget > 0 && (
                  <div className="space-y-1 font-mono">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span>Rasio Penggunaan Anggaran Global: {totalPct}%</span>
                      <span>{formatRupiah(totalSpent)} / {formatRupiah(totalBudget)}</span>
                    </div>
                    <div className="w-full h-3 bg-muted border-2 border-border">
                      <div
                        className={`h-full border-r-2 border-border transition-all duration-300 ${
                          totalSpent > totalBudget ? "bg-rose-600" : totalPct > 80 ? "bg-amber-500" : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(100, totalPct)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Connected savings allocation */}
              <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between bg-primary/[0.03]">
                <div>
                  <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight border-b border-border/20 pb-3 mb-3">
                    🎯 Alokasi Tabungan Pintar
                  </h3>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sisa Kas Bulan Ini:</span>
                      <span className={`font-bold ${netIncome >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {formatRupiah(netIncome)}
                      </span>
                    </div>
                    {recommendedSavings > 0 && (
                      <div className="flex justify-between border-t border-border/10 pt-2 text-[10px]">
                        <span className="text-muted-foreground">Saran Menabung (20%):</span>
                        <span className="font-extrabold text-primary">{formatRupiah(recommendedSavings)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {stats.savingsGoals.length === 0 ? (
                  <div className="text-[10px] text-muted-foreground font-mono italic text-center py-4 uppercase">
                    Belum ada target tabungan aktif. <Link href="/dashboard/finance/savings" className="underline text-primary">Buat Target ↗</Link>
                  </div>
                ) : (
                  <form onSubmit={handleQuickAllocate} className="space-y-2.5 mt-4 pt-3 border-t border-border/20">
                    <div>
                      <label className="block font-mono font-bold text-[8px] uppercase text-muted-foreground mb-1">Pilih Target Tabungan</label>
                      <select
                        value={allocGoalId}
                        onChange={(e) => setAllocGoalId(e.target.value)}
                        className="w-full border border-border bg-background p-1.5 font-mono text-[10px] uppercase focus:outline-none"
                      >
                        {stats.savingsGoals.map((sg) => (
                          <option key={sg.id} value={sg.id}>
                            {sg.emoji} {sg.title} ({Math.round((sg.currentAmount / sg.targetAmount) * 100)}%)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        required
                        placeholder="Nominal (Rp)..."
                        value={allocAmount}
                        onChange={(e) => setAllocAmount(e.target.value)}
                        className="flex-1 border border-border bg-background px-2 py-1 font-mono text-[10px] focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isAllocating}
                        className="px-3 py-1 border-2 border-border bg-primary text-primary-foreground font-mono font-bold text-[9px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {isAllocating ? "..." : "Tabung"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* CATEGORIES GRID */}
            <div>
              <h3 className="font-mono font-extrabold text-base uppercase tracking-tight mb-4">
                🔧 Batas Anggaran & Pengambilan Keputusan Kategori
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stats.budgetVsSpent.map((item) => {
                  const health = getHealthStatus(item.spent, item.budget);
                  const diagnostics = getForecastAndPace(item.spent, item.budget);
                  const history = getHistory(item.categoryId);
                  const pct = item.budget > 0 ? Math.round((item.spent / item.budget) * 100) : 0;
                  const isSavingThis = isSaving[item.categoryId] || false;

                  return (
                    <div
                      key={item.categoryId}
                      className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between"
                    >
                      <div>
                        {/* Header Kategori */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl p-1.5 border-2 border-border bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{item.categoryIcon}</span>
                            <div>
                              <h4 className="font-mono font-extrabold text-sm uppercase">{item.categoryName}</h4>
                              <span className={`inline-block font-mono text-[8px] px-1.5 py-0.5 border font-bold uppercase mt-1 ${health.color}`}>
                                {health.label}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleOpenQuickAdd(item.categoryId, item.categoryName)}
                            className="px-2 py-1.5 border border-border bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground font-mono font-bold text-[9px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer"
                          >
                            + Pengeluaran Cepat
                          </button>
                        </div>

                        {/* Real vs Budget Progress */}
                        <div className="mt-4 pt-3 border-t border-border/20 font-mono space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-muted-foreground">Realisasi Pengeluaran:</span>
                            <span className="font-extrabold">{formatRupiah(item.spent)}</span>
                          </div>
                          
                          {item.budget > 0 && (
                            <>
                              <div className="flex justify-between text-[11px] font-semibold">
                                <span className="text-muted-foreground">Batas Anggaran:</span>
                                <span className="font-bold">{formatRupiah(item.budget)} ({pct}%)</span>
                              </div>
                              <div className="w-full h-3 bg-muted border border-border">
                                <div
                                  className={`h-full border-r border-border transition-all duration-300 ${
                                    pct > 100 ? "bg-rose-600" : pct > 70 ? "bg-amber-500" : "bg-primary"
                                  }`}
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>

                              {/* DIAGNOSTICS SECTION */}
                              <div className="mt-4 p-3 border border-border bg-background/50 space-y-1.5 text-[10px] text-muted-foreground leading-normal">
                                <div className="flex justify-between">
                                  <span>Prediksi Akhir Bulan:</span>
                                  <span className="font-bold text-foreground">{formatRupiah(diagnostics.forecasted)}</span>
                                </div>

                                {diagnostics.isOverForecast ? (
                                  <div className="text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-1 animate-pulse">
                                    ⚠️ Berpotensi melebihi budget {formatRupiah(diagnostics.potentialDeficit)}
                                  </div>
                                ) : (
                                  <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                                    ✓ Prediksi aman di bawah budget
                                  </div>
                                )}

                                {diagnostics.isCurrent && diagnostics.remainingDays > 0 && (
                                  <div className="border-t border-border/10 pt-1.5 flex justify-between font-semibold">
                                    <span>Pace Belanja ({diagnostics.remainingDays} hari sisa):</span>
                                    <span className={diagnostics.dailyRecommendation > 0 ? "text-primary font-bold" : "text-rose-600"}>
                                      {diagnostics.dailyRecommendation > 0 
                                        ? `Maksimal ${formatRupiah(diagnostics.dailyRecommendation)} / hari` 
                                        : "Stop pengeluaran!"
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Setup Form & History */}
                      <div className="mt-6 pt-4 border-t border-border/20 space-y-3">
                        {/* History */}
                        {history.length > 0 && (
                          <div className="text-[8px] font-mono text-muted-foreground uppercase flex flex-wrap gap-x-2 gap-y-1">
                            <span>Riwayat Budget:</span>
                            {history.map((h, idx) => (
                              <span key={idx} className="font-bold text-foreground/80">
                                {h.monthName}: {formatRupiah(h.amount!)}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Set/Ubah limit anggaran..."
                            value={inputs[item.categoryId] ?? ""}
                            onChange={(e) =>
                              setInputs((prev) => ({ ...prev, [item.categoryId]: e.target.value }))
                            }
                            className="flex-1 border-2 border-border bg-background px-3 py-2 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveBudget(item.categoryId)}
                            disabled={isSavingThis}
                            className="px-4 py-2 border-2 border-border bg-primary text-primary-foreground font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] disabled:opacity-50 transition-all cursor-pointer"
                          >
                            {isSavingThis ? "..." : "Simpan"}
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>


          </div>
        )
      )}

      {/* QUICK ADD TRANSACTION MODAL */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="w-full max-w-sm border-2 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
            <h3 className="font-mono font-extrabold text-base uppercase border-b-2 border-border pb-3 mb-4">
              📝 Catat Pengeluaran Cepat
            </h3>
            <p className="font-mono text-xs text-muted-foreground mb-4 uppercase">
              Kategori: <span className="font-bold text-foreground">{quickAddCatName}</span>
            </p>
            <form onSubmit={handleQuickAddTransaction} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Nominal Pengeluaran (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 20000"
                  value={quickAddAmount}
                  onChange={(e) => setQuickAddAmount(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Tanggal</label>
                <DatePicker value={quickAddDate} onChange={setQuickAddDate} />
              </div>

              {/* Description */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Keterangan</label>
                <input
                  type="text"
                  placeholder="Makan siang nasi padang..."
                  value={quickAddDesc}
                  onChange={(e) => setQuickAddDesc(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-3 border-t border-border/20">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="flex-1 py-2.5 border-2 border-border bg-background text-foreground font-bold font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTx}
                  className="flex-1 py-2.5 border-2 border-border bg-primary text-primary-foreground font-bold font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer"
                >
                  {isSubmittingTx ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
