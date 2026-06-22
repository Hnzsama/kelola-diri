"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { DatePicker } from "@/components/ui/date-picker";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";

interface BudgetVsSpent {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budget: number;
  spent: number;
}

interface Stats {
  balance: number;
  absoluteBalance: number;
  balanceTunai: number;
  balanceNonTunai: number;
  income: number;
  expense: number;
  savings: number;
  totalPiutang: number;
  totalHutang: number;
  projectedBalance: number;
  pendingReceivablesThisMonth: number;
  pendingDebtsThisMonth: number;
  upcomingRecurringBillsThisMonth: number;
  budgetVsSpent: BudgetVsSpent[];
}

interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  emoji: string;
  goal: { title: string } | null;
}

interface FinanceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function FinanceDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // Form states
  const [txType, setTxType] = useState("EXPENSE");
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txPaymentMethod, setTxPaymentMethod] = useState("TUNAI");

  // Transfer states
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDirection, setTransferDirection] = useState("TUNAI_TO_NON_TUNAI");
  const [isTransferring, setIsTransferring] = useState(false);
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [txDate, setTxDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    setTxDate(getTodayString());
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, goalsRes, categoriesRes] = await Promise.all([
        fetch("/api/finance/stats"),
        fetch("/api/finance/goals"),
        fetch("/api/finance/categories"),
      ]);
      if (!statsRes.ok || !goalsRes.ok || !categoriesRes.ok) throw new Error("Gagal");
      const [statsData, goalsData, categoriesData] = await Promise.all([
        statsRes.json(),
        goalsRes.json(),
        categoriesRes.json(),
      ]);
      setStats(statsData);
      setGoals(goalsData);
      setCategories(categoriesData);
      
      if (categoriesData.length > 0) {
        setTxCategory(categoriesData[0].id);
      }
    } catch {
      toast.error("Gagal memuat data keuangan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedDummy = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/finance/dummy", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal memuat data contoh");
        return;
      }
      toast.success(data.success || "Data contoh berhasil dimuat!");
      fetchDashboardData();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleQuickAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Nominal transaksi tidak valid");
      return;
    }

    if (!txCategory) {
      toast.error("Kategori transaksi belum dipilih");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: txType,
          amount: amountNum,
          categoryId: txCategory,
          description: txDescription,
          date: txDate || null,
          paymentMethod: txPaymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal membuat transaksi");
        return;
      }

      toast.success("Transaksi berhasil dicatat!");
      setTxAmount("");
      setTxDescription("");
      setTxPaymentMethod("TUNAI");
      setTxDate(getTodayString());
      fetchDashboardData();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(transferAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Nominal alokasi transfer tidak valid");
      return;
    }

    setIsTransferring(true);
    try {
      const res = await fetch("/api/finance/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          direction: transferDirection,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal alokasi saldo");
        return;
      }

      toast.success("Alokasi saldo berhasil dilakukan!");
      setTransferAmount("");
      fetchDashboardData();
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsTransferring(false);
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

  if (isLoading) return <DashboardSkeleton />;

  const hasData = stats && (stats.income > 0 || stats.expense > 0 || goals.length > 0);

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Dashboard Keuangan</h1>
          <p className="text-muted-foreground font-mono text-xs">
            Kelola cashflow bulanan, batasi anggaran konsumtif, dan kejar target tabungan impian Anda.
          </p>
        </div>
        {!hasData && (
          <button
            onClick={handleSeedDummy}
            disabled={isSeeding}
            className="flex items-center gap-2 px-5 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSeeding ? "Memproses..." : "Muat Data Contoh"}
          </button>
        )}
      </div>

      {!hasData ? (
        /* EMPTY STATE */
        <div className="border-2 border-dashed border-border p-12 text-center bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <div className="text-5xl mb-4">💰</div>
          <h3 className="text-lg font-bold font-mono uppercase mb-1">Belum Ada Catatan Keuangan</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Catat pemasukan atau pengeluaran pertama Anda sekarang, atau gunakan data contoh untuk demo langsung.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleSeedDummy}
              disabled={isSeeding}
              className="px-5 py-3 border-2 border-border font-bold text-xs uppercase bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer"
            >
              {isSeeding ? "Memproses..." : "Muat Data Contoh"}
            </button>
          </div>
        </div>
      ) : (
        stats && (
          <>
            {/* CASHFLOW PROJECTION BANNER */}
            <div className="border-2 border-border bg-yellow-100 dark:bg-yellow-950/20 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] mb-8 font-mono">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">🔮 Cashflow Projection (Estimasi Akhir Bulan)</span>
                  <h2 className="text-3xl font-black mt-2 text-foreground">
                    {formatRupiah(stats.projectedBalance)}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                    Dihitung dari Saldo Sebenarnya ({formatRupiah(stats.absoluteBalance)}) 
                    {stats.pendingReceivablesThisMonth > 0 && ` + Piutang Masuk (+${formatRupiah(stats.pendingReceivablesThisMonth)})`}
                    {stats.pendingDebtsThisMonth > 0 && ` - Hutang Keluar (-${formatRupiah(stats.pendingDebtsThisMonth)})`}
                    {stats.upcomingRecurringBillsThisMonth > 0 && ` - Tagihan Berulang (-${formatRupiah(stats.upcomingRecurringBillsThisMonth)})`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/dashboard/finance/recurring">
                    <button className="px-3 py-2 border-2 border-border font-bold text-[10px] uppercase bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer">
                      Tagihan Mendatang 📅
                    </button>
                  </Link>
                  <Link href="/dashboard/finance/debts">
                    <button className="px-3 py-2 border-2 border-border font-bold text-[10px] uppercase bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer">
                      Kelola Hutang 👤
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Saldo Sebenarnya", value: formatRupiah(stats.absoluteBalance), sub: "Total Kas Tersisa", color: stats.absoluteBalance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-600 dark:text-rose-400" },
                { label: "Saldo Tunai (Cash)", value: formatRupiah(stats.balanceTunai), sub: "Kas Fisik / Tunai", color: stats.balanceTunai >= 0 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400" },
                { label: "Saldo Non-Tunai", value: formatRupiah(stats.balanceNonTunai), sub: "Bank & Dompet Digital", color: stats.balanceNonTunai >= 0 ? "text-teal-600 dark:text-teal-400" : "text-rose-600 dark:text-rose-400" },
                { label: "Total Tabungan", value: formatRupiah(stats.savings), sub: "Akumulasi Dana Khusus", color: "text-purple-600 dark:text-purple-400" },
                { label: "Piutang Aktif (Piutang)", value: formatRupiah(stats.totalPiutang), sub: "Pemberian Pinjaman", color: "text-emerald-600 dark:text-emerald-400" },
                { label: "Hutang Aktif (Hutang)", value: formatRupiah(stats.totalHutang), sub: "Pinjaman Diterima", color: "text-rose-600 dark:text-rose-400" },
                { label: "Pemasukan Bulan Ini", value: formatRupiah(stats.income), sub: "Bulan Ini", color: "text-emerald-600 dark:text-emerald-400" },
                { label: "Pengeluaran Bulan Ini", value: formatRupiah(stats.expense), sub: "Bulan Ini", color: "text-rose-600 dark:text-rose-400" },
              ].map((s) => (
                <div key={s.label} className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                  <h3 className={`text-xl font-extrabold font-mono mt-2 truncate ${s.color}`}>{s.value}</h3>
                  <div className="mt-3 pt-2 border-t border-border/20 text-xs font-mono text-muted-foreground">{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-start">
              {/* LEFT & CENTER COLUMNS */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* BUDGET PROGRESS */}
                <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                  <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-5">
                    <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight">📊 Pengeluaran vs Anggaran Bulanan</h3>
                    <Link href="/dashboard/finance/budget">
                      <button className="px-3 py-1 border-2 border-border font-bold text-[10px] uppercase bg-background shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
                        Atur Batas
                      </button>
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {stats.budgetVsSpent.map((b) => {
                      const hasBudget = b.budget > 0;
                      const pct = hasBudget ? Math.round((b.spent / b.budget) * 100) : 0;
                      const isOverLimit = hasBudget && b.spent > b.budget;

                      return (
                        <div key={b.categoryId} className="space-y-1 font-mono">
                          <div className="flex justify-between text-xs flex-wrap gap-2">
                            <span className="font-bold">
                              {b.categoryIcon} {b.categoryName}
                            </span>
                            <span className="text-muted-foreground font-semibold">
                              {formatRupiah(b.spent)} / {hasBudget ? formatRupiah(b.budget) : "Belum diatur"}
                              {hasBudget && (
                                <span className={`ml-2 font-extrabold ${isOverLimit ? "text-rose-600" : "text-primary"}`}>
                                  ({pct}%)
                                </span>
                              )}
                            </span>
                          </div>
                          {hasBudget && (
                            <div className="w-full h-3 bg-muted border border-border">
                              <div
                                className={`h-full border-r border-border transition-all duration-300 ${
                                  isOverLimit ? "bg-rose-600" : pct > 80 ? "bg-amber-500" : "bg-primary"
                                }`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SAVINGS TARGETS (TARGET KEUANGAN) */}
                <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                  <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-5">
                    <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight">🎯 Target Tabungan & Investasi</h3>
                    <Link href="/dashboard/finance/savings">
                      <button className="px-3 py-1 border-2 border-border font-bold text-[10px] uppercase bg-background shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
                        Kelola Target
                      </button>
                    </Link>
                  </div>
                  {goals.length === 0 ? (
                    <p className="text-xs text-muted-foreground font-mono italic text-center py-4">Belum ada target tabungan aktif.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {goals.map((g) => {
                        const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
                        return (
                          <div key={g.id} className="border-2 border-border p-4 bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl p-1 border-2 border-border bg-card">{g.emoji}</span>
                              <div className="min-w-0">
                                <h4 className="font-mono font-bold text-xs uppercase truncate">{g.title}</h4>
                                {g.goal && (
                                  <span className="inline-block text-[8px] bg-primary/10 border border-primary/20 text-primary font-bold uppercase px-1 font-mono mt-0.5">
                                    🔗 {g.goal.title}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1 pt-1 font-mono">
                              <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
                                  <span>Terkumpul: {pct}%</span>
                                  <span>{formatRupiah(g.currentAmount)} / {formatRupiah(g.targetAmount)}</span>
                              </div>
                              <div className="w-full h-2.5 bg-muted border border-border">
                                <div
                                  className="h-full bg-primary border-r border-border transition-all duration-300"
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* EMERGENCY FUND CALLOUT */}
                  {(() => {
                    const emergencyGoal = goals.find((g) => g.title.toLowerCase().includes("darurat"));
                    if (!emergencyGoal) return null;
                    const pct = emergencyGoal.targetAmount > 0 ? Math.round((emergencyGoal.currentAmount / emergencyGoal.targetAmount) * 100) : 0;
                    const suggestedAddition = Math.max(0, (emergencyGoal.targetAmount - emergencyGoal.currentAmount) * 0.1);

                    return (
                      <div className="border-2 border-border p-4 bg-rose-500/10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] mt-6 font-mono">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl p-1 border border-border bg-card">🛡️</span>
                          <div>
                            <h4 className="font-bold text-xs uppercase text-rose-700 dark:text-rose-400">Dana Darurat ({pct}%)</h4>
                            <p className="text-[9px] text-muted-foreground">Rekomendasi Bulanan</p>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-muted border border-border">
                          <div
                            className="h-full bg-rose-600 transition-all duration-300"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] text-muted-foreground mt-1">
                          <span>{formatRupiah(emergencyGoal.currentAmount)} terkumpul</span>
                          <span>Target: {formatRupiah(emergencyGoal.targetAmount)}</span>
                        </div>
                        <p className="text-[9px] text-foreground leading-relaxed mt-3 pt-2 border-t border-border/10">
                          💡 Disarankan menambah sebesar <strong className="text-rose-600 dark:text-rose-400">{formatRupiah(suggestedAddition)}</strong> bulan ini untuk mencapai target ideal!
                        </p>
                      </div>
                    );
                  })()}
                </div>

              </div>

              {/* RIGHT COLUMN: QUICK ADD TRANSACTION */}
              <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <div className="border-b border-border/20 pb-3 mb-5">
                  <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight">📝 Catat Transaksi Cepat</h3>
                </div>
                <form onSubmit={handleQuickAddTransaction} className="space-y-4">
                  {/* Type Selector */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTxType("EXPENSE")}
                      className={`py-2 border-2 border-border font-bold font-mono text-xs uppercase transition-all cursor-pointer ${
                        txType === "EXPENSE"
                          ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-rose-500"
                          : "bg-background hover:bg-muted text-foreground"
                      }`}
                    >
                      Expense ⛽
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxType("INCOME")}
                      className={`py-2 border-2 border-border font-bold font-mono text-xs uppercase transition-all cursor-pointer ${
                        txType === "INCOME"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-emerald-500"
                          : "bg-background hover:bg-muted text-foreground"
                      }`}
                    >
                      Income 💰
                    </button>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Metode Uang</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTxPaymentMethod("TUNAI")}
                        className={`py-2 border-2 border-border font-bold font-mono text-xs uppercase transition-all cursor-pointer ${
                          txPaymentMethod === "TUNAI"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-amber-500"
                            : "bg-background hover:bg-muted text-foreground"
                        }`}
                      >
                        💵 Tunai
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxPaymentMethod("NON_TUNAI")}
                        className={`py-2 border-2 border-border font-bold font-mono text-xs uppercase transition-all cursor-pointer ${
                          txPaymentMethod === "NON_TUNAI"
                            ? "bg-teal-500/10 text-teal-700 dark:text-teal-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-teal-500"
                            : "bg-background hover:bg-muted text-foreground"
                        }`}
                      >
                        💳 Non-Tunai
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Nominal (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 15000"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      className="w-full border-2 border-border bg-background p-2.5 font-mono text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Kategori</label>
                    <select
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      className="w-full border-2 border-border bg-background p-2.5 font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                    >
                      {categories.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.icon} {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Tanggal</label>
                    <DatePicker value={txDate} onChange={setTxDate} />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Keterangan / Catatan</label>
                    <input
                      type="text"
                      placeholder="Makan siang nasi padang..."
                      value={txDescription}
                      onChange={(e) => setTxDescription(e.target.value)}
                      className="w-full border-2 border-border bg-background p-2.5 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting || categories.length === 0}
                    className="w-full py-3 border-2 border-border bg-primary text-primary-foreground font-mono font-bold text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}
                  </button>
                </form>

                {/* Sub-menu Quick links */}
                <div className="mt-6 pt-5 border-t border-border/20 grid grid-cols-3 gap-2 text-center">
                  <Link href="/dashboard/finance/transactions">
                    <span className="block border border-border p-2 bg-muted/20 font-mono font-bold text-[9px] uppercase hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer">
                      Riwayat ↗
                    </span>
                  </Link>
                  <Link href="/dashboard/finance/budget">
                    <span className="block border border-border p-2 bg-muted/20 font-mono font-bold text-[9px] uppercase hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer">
                      Anggaran ↗
                    </span>
                  </Link>
                  <Link href="/dashboard/finance/categories">
                    <span className="block border border-border p-2 bg-muted/20 font-mono font-bold text-[9px] uppercase hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer">
                      Kategori ↗
                    </span>
                  </Link>
                </div>
              </div>

              {/* ALOKASI SALDO (TRANSFER) CARD */}
              <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] mt-6">
                <div className="border-b border-border/20 pb-3 mb-5">
                  <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight">🔁 Alokasi Uang (Transfer)</h3>
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">Pindahkan dana antara Tunai & Non-Tunai tanpa mengubah total saldo.</p>
                </div>
                <form onSubmit={handleTransfer} className="space-y-4">
                  {/* Direction Selector */}
                  <div>
                    <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Arah Alokasi</label>
                    <select
                      value={transferDirection}
                      onChange={(e) => setTransferDirection(e.target.value)}
                      className="w-full border-2 border-border bg-background p-2.5 font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                    >
                      <option value="TUNAI_TO_NON_TUNAI">Tunai 💵 ➔ Non-Tunai 💳</option>
                      <option value="NON_TUNAI_TO_TUNAI">Non-Tunai 💳 ➔ Tunai 💵</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Nominal Transfer (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 50000"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full border-2 border-border bg-background p-2.5 font-mono text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isTransferring}
                    className="w-full py-3 border-2 border-border bg-purple-600 text-white font-mono font-bold text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isTransferring ? "Memproses..." : "Lakukan Alokasi"}
                  </button>
                </form>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
