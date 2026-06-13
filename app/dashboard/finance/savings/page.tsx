"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useConfirm } from "@/components/ui/confirm-modal";

interface LifeGoal {
  id: string;
  title: string;
  emoji: string;
  category: string;
  status: string;
}

interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  emoji: string;
  goalId: string | null;
  goal: { title: string; emoji: string } | null;
}

const EMOJIS = ["💰", "💻", "🚗", "🏠", "✈️", "🎓", "🎮", "📱", "🏍️", "🎒"];

export default function SavingsGoalsPage() {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [lifeGoals, setLifeGoals] = useState<LifeGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal control states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFundOpen, setIsFundOpen] = useState(false);

  // Selected goals for edit/fund action
  const [activeGoal, setActiveGoal] = useState<FinancialGoal | null>(null);

  // Create/Edit form states
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [emoji, setEmoji] = useState("💰");
  const [goalId, setGoalId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fund adjustment form states
  const [fundAmount, setFundAmount] = useState("");
  const [fundType, setFundType] = useState<"ADD" | "WITHDRAW">("ADD");

  const { confirmModal, openConfirm } = useConfirm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [goalsRes, lifeGoalsRes] = await Promise.all([
        fetch("/api/finance/goals"),
        fetch("/api/goals?status=ACTIVE"),
      ]);

      if (!goalsRes.ok || !lifeGoalsRes.ok) throw new Error("Gagal mengambil data");

      const [goalsData, lifeGoalsData] = await Promise.all([
        goalsRes.json(),
        lifeGoalsRes.json(),
      ]);

      setGoals(goalsData);
      setLifeGoals(lifeGoalsData);
    } catch {
      toast.error("Gagal memuat target tabungan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setTitle("");
    setTargetAmount("");
    setCurrentAmount("0");
    setDeadline("");
    setEmoji("💰");
    setGoalId("");
    setIsCreateOpen(true);
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(targetAmount);
    const currentNum = parseFloat(currentAmount);

    if (!title.trim()) {
      toast.error("Nama target tidak boleh kosong");
      return;
    }
    if (isNaN(targetNum) || targetNum <= 0) {
      toast.error("Nominal target harus valid");
      return;
    }
    if (isNaN(currentNum) || currentNum < 0) {
      toast.error("Nominal awal tabungan tidak valid");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/finance/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          targetAmount: targetNum,
          currentAmount: currentNum,
          deadline: deadline || null,
          emoji,
          goalId: goalId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal membuat target tabungan");
        return;
      }

      toast.success("Target tabungan berhasil dibuat!");
      setIsCreateOpen(false);
      fetchData();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (fg: FinancialGoal) => {
    setActiveGoal(fg);
    setTitle(fg.title);
    setTargetAmount(String(fg.targetAmount));
    setCurrentAmount(String(fg.currentAmount));
    setDeadline(fg.deadline ? fg.deadline.split("T")[0] : "");
    setEmoji(fg.emoji);
    setGoalId(fg.goalId || "");
    setIsEditOpen(true);
  };

  const handleEditGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoal) return;

    const targetNum = parseFloat(targetAmount);
    const currentNum = parseFloat(currentAmount);

    if (!title.trim()) {
      toast.error("Nama target tidak boleh kosong");
      return;
    }
    if (isNaN(targetNum) || targetNum <= 0) {
      toast.error("Nominal target harus valid");
      return;
    }
    if (isNaN(currentNum) || currentNum < 0) {
      toast.error("Nominal tabungan tidak valid");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/finance/goals/${activeGoal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          targetAmount: targetNum,
          currentAmount: currentNum,
          deadline: deadline || null,
          emoji,
          goalId: goalId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal memperbarui target tabungan");
        return;
      }

      toast.success("Target tabungan berhasil diperbarui!");
      setIsEditOpen(false);
      setActiveGoal(null);
      fetchData();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const ok = await openConfirm({
      title: "Hapus Target Tabungan",
      message: "Apakah Anda yakin ingin menghapus target tabungan ini? Data tabungan akan terhapus secara permanen.",
      variant: "danger",
    });

    if (!ok) return;

    try {
      const res = await fetch(`/api/finance/goals/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menghapus target");
        return;
      }
      toast.success("Target tabungan berhasil dihapus");
      fetchData();
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleOpenFund = (fg: FinancialGoal) => {
    setActiveGoal(fg);
    setFundAmount("");
    setFundType("ADD");
    setIsFundOpen(true);
  };

  const handleAdjustFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoal) return;

    const amountNum = parseFloat(fundAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Nominal dana tidak valid");
      return;
    }

    const finalAmount = fundType === "ADD" ? amountNum : -amountNum;

    // Client side check if withdrawing exceeds current balance
    if (fundType === "WITHDRAW" && amountNum > activeGoal.currentAmount) {
      toast.error("Penarikan melebihi saldo tabungan saat ini");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/finance/goals/${activeGoal.id}/add-funds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal memperbarui saldo tabungan");
        return;
      }

      toast.success(
        fundType === "ADD"
          ? `Berhasil menambahkan ${formatRupiah(amountNum)} ke tabungan!`
          : `Berhasil menarik ${formatRupiah(amountNum)} dari tabungan!`
      );
      setIsFundOpen(false);
      setActiveGoal(null);
      fetchData();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="w-full px-4 lg:px-6">
      {confirmModal}

      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Target Tabungan (Savings)</h1>
          <p className="text-muted-foreground font-mono text-xs">
            Kelola tabungan khusus Anda dan hubungkan langsung ke sasaran hidup (Life Goals) Anda.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/finance">
            <button className="px-4 py-2.5 border-2 border-border font-bold text-xs uppercase bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
              ← Dashboard
            </button>
          </Link>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 border-2 border-border font-bold text-xs uppercase bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer"
          >
            + Buat Target
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[40vh] items-center justify-center text-muted-foreground font-mono">
          Memuat target tabungan...
        </div>
      ) : goals.length === 0 ? (
        <div className="border-2 border-dashed border-border p-12 text-center bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-lg font-bold font-mono uppercase mb-1">Belum Ada Target Tabungan</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Mulai kebiasaan menabung dengan menetapkan target barang/tujuan impian Anda (misalnya laptop baru atau liburan).
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-3 border-2 border-border font-bold text-xs uppercase bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] transition-all cursor-pointer"
          >
            Buat Target Pertama Anda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {goals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
            const deadlineDate = g.deadline ? new Date(g.deadline) : null;
            const isCompleted = g.currentAmount >= g.targetAmount;

            return (
              <div
                key={g.id}
                className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar Card */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-1.5 border-2 border-border bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {g.emoji}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-mono font-extrabold text-sm uppercase truncate" title={g.title}>
                          {g.title}
                        </h3>
                        {g.goal && (
                          <div className="mt-1 flex items-center">
                            <span className="inline-block text-[8px] bg-primary/10 border border-primary/20 text-primary font-mono font-extrabold uppercase px-1 py-0.5 truncate">
                              🔗 {g.goal.emoji} {g.goal.title}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {isCompleted && (
                      <span className="inline-block font-mono text-[8px] px-1 py-0.5 border-2 border-emerald-500 bg-emerald-500/10 text-emerald-600 font-extrabold uppercase animate-bounce">
                        Tercapai 🎉
                      </span>
                    )}
                  </div>

                  {/* Progress info */}
                  <div className="space-y-1.5 font-mono pt-2 border-t border-border/20">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Terkumpul:</span>
                      <span className="font-bold">{pct}%</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold">
                      <span>{formatRupiah(g.currentAmount)}</span>
                      <span className="text-muted-foreground">/ {formatRupiah(g.targetAmount)}</span>
                    </div>
                    <div className="w-full h-3 bg-muted border border-border">
                      <div
                        className="h-full bg-primary border-r border-border transition-all duration-300"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Deadline info */}
                  <div className="mt-4 text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                    📅 Target:{" "}
                    {deadlineDate
                      ? deadlineDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                      : "Tanpa Batas Waktu"}
                  </div>
                </div>

                {/* Actions bottom card */}
                <div className="mt-6 pt-4 border-t border-border/20 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleOpenFund(g)}
                    className="py-1.5 border border-border bg-primary text-primary-foreground font-mono font-bold text-[10px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer text-center"
                  >
                    💰 Setor/Tarik
                  </button>
                  <button
                    onClick={() => handleOpenEdit(g)}
                    className="py-1.5 border border-border bg-background hover:bg-muted font-mono font-bold text-[10px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer text-center"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(g.id)}
                    className="py-1.5 border border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20 font-mono font-bold text-[10px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer text-center"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="w-full max-w-sm border-2 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] max-h-[90vh] overflow-y-auto">
            <h3 className="font-mono font-extrabold text-base uppercase border-b-2 border-border pb-3 mb-4">
              🎯 Buat Target Tabungan
            </h3>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              {/* Emoji Selector */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Pilih Emoji</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`text-xl p-1.5 border-2 transition-all cursor-pointer ${
                        emoji === e ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Nama Target</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli Laptop Baru..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                />
              </div>

              {/* Target Amount */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Nominal Target (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 15000000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                />
              </div>

              {/* Initial Savings */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Saldo Awal (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 100000 (Opsional)"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Tenggat Waktu / Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                />
              </div>

              {/* Linked Life Goal */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Hubungkan ke Life Goal</label>
                <select
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                >
                  <option value="">-- Pilih Life Goal (Opsional) --</option>
                  {lifeGoals.map((lg) => (
                    <option key={lg.id} value={lg.id}>
                      {lg.emoji} {lg.title} ({lg.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-3 border-t border-border/20">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 border-2 border-border bg-background text-foreground font-bold font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 border-2 border-border bg-primary text-primary-foreground font-bold font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && activeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="w-full max-w-sm border-2 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] max-h-[90vh] overflow-y-auto">
            <h3 className="font-mono font-extrabold text-base uppercase border-b-2 border-border pb-3 mb-4">
              ✏️ Ubah Target Tabungan
            </h3>
            <form onSubmit={handleEditGoal} className="space-y-4">
              {/* Emoji Selector */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Pilih Emoji</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`text-xl p-1.5 border-2 transition-all cursor-pointer ${
                        emoji === e ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Nama Target</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli Laptop Baru..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                />
              </div>

              {/* Target Amount */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Nominal Target (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 15000000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                />
              </div>

              {/* Current Amount */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Saldo Terkumpul (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 100000"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Tenggat Waktu / Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                />
              </div>

              {/* Linked Life Goal */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Hubungkan ke Life Goal</label>
                <select
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                >
                  <option value="">-- Pilih Life Goal (Opsional) --</option>
                  {lifeGoals.map((lg) => (
                    <option key={lg.id} value={lg.id}>
                      {lg.emoji} {lg.title} ({lg.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-3 border-t border-border/20">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); setActiveGoal(null); }}
                  className="flex-1 py-2.5 border-2 border-border bg-background text-foreground font-bold font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 border-2 border-border bg-primary text-primary-foreground font-bold font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETOR / TARIK DANA MODAL */}
      {isFundOpen && activeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="w-full max-w-sm border-2 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
            <h3 className="font-mono font-extrabold text-base uppercase border-b-2 border-border pb-3 mb-4">
              💰 Setor / Tarik Tabungan
            </h3>
            <p className="font-mono text-xs text-muted-foreground mb-4 uppercase">
              Target: <span className="font-bold text-foreground">{activeGoal.title}</span><br />
              Saldo Saat Ini: <span className="font-bold text-foreground">{formatRupiah(activeGoal.currentAmount)}</span> / {formatRupiah(activeGoal.targetAmount)}
            </p>
            <form onSubmit={handleAdjustFunds} className="space-y-4">
              {/* Type selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFundType("ADD")}
                  className={`py-2 border-2 border-border font-bold font-mono text-xs uppercase transition-all cursor-pointer ${
                    fundType === "ADD"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-emerald-500"
                      : "bg-background hover:bg-muted text-foreground"
                  }`}
                >
                  Setor Saldo 📥
                </button>
                <button
                  type="button"
                  onClick={() => setFundType("WITHDRAW")}
                  className={`py-2 border-2 border-border font-bold font-mono text-xs uppercase transition-all cursor-pointer ${
                    fundType === "WITHDRAW"
                      ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-rose-500"
                      : "bg-background hover:bg-muted text-foreground"
                  }`}
                >
                  Tarik Saldo 📤
                </button>
              </div>

              {/* Amount input */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="Masukkan nominal..."
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                />
              </div>

              {/* Info text: automatically creates transaction */}
              <p className="text-[9px] font-mono text-muted-foreground leading-normal uppercase">
                * Note: Aksi ini secara otomatis mencatat transaksi {fundType === "ADD" ? "Pengeluaran (Expense)" : "Pemasukan (Income)"} berkategori "Lainnya" untuk menjaga konsistensi kas keuangan Anda.
              </p>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-3 border-t border-border/20">
                <button
                  type="button"
                  onClick={() => { setIsFundOpen(false); setActiveGoal(null); }}
                  className="flex-1 py-2.5 border-2 border-border bg-background text-foreground font-bold font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 border-2 border-border bg-primary text-primary-foreground font-bold font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer"
                >
                  {isSubmitting ? "Memproses..." : "Konfirmasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
