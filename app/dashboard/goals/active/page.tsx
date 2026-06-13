"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useConfirm } from "@/components/ui/confirm-modal";

interface Milestone {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  progress: number;
  targetDate: string | null;
  emoji: string;
  milestones: Milestone[];
}

const CATEGORIES = [
  { value: "ACADEMIC", label: "Akademik", icon: "📚", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-400/30" },
  { value: "ORGANIZATION", label: "Organisasi", icon: "🏢", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-400/30" },
  { value: "HABIT", label: "Habit", icon: "🔄", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-400/30" },
  { value: "PERSONAL", label: "Personal", icon: "👤", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/30" },
  { value: "CAREER", label: "Karier", icon: "🚀", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-400/30" },
];

const STATUSES = [
  { value: "ACTIVE", label: "Aktif", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-400/30" },
  { value: "ACHIEVED", label: "Tercapai", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-400/30" },
  { value: "PAUSED", label: "Ditunda", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/30" },
  { value: "DROPPED", label: "Dibatalkan", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-400/30" },
];

const EMOJIS = ["🎯", "🚀", "📚", "🏢", "💻", "💪", "👤", "💼", "🔥", "🎖️", "⭐", "📅"];

export default function ActiveGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Modal control states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form states
  const [formEmoji, setFormEmoji] = useState("🎯");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("PERSONAL");
  const [formTargetDate, setFormTargetDate] = useState("");
  const [formStatus, setFormStatus] = useState("ACTIVE");

  const { confirmModal, openConfirm } = useConfirm();

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      setGoals(data);
    } catch {
      toast.error("Gagal memuat daftar goal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormEmoji("🎯");
    setFormTitle("");
    setFormDescription("");
    setFormCategory("PERSONAL");
    setFormTargetDate("");
    setIsAddOpen(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormEmoji(goal.emoji);
    setFormTitle(goal.title);
    setFormDescription(goal.description || "");
    setFormCategory(goal.category);
    setFormTargetDate(goal.targetDate ? goal.targetDate.split("T")[0] : "");
    setFormStatus(goal.status);
    setIsEditOpen(true);
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Judul goal wajib diisi");
      return;
    }

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          category: formCategory,
          targetDate: formTargetDate || null,
          emoji: formEmoji,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal membuat goal");
        return;
      }

      toast.success("Goal berhasil ditambahkan!");
      setIsAddOpen(false);
      fetchGoals();
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleEditGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;
    if (!formTitle.trim()) {
      toast.error("Judul goal wajib diisi");
      return;
    }

    try {
      const res = await fetch(`/api/goals/${editingGoal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          category: formCategory,
          status: formStatus,
          targetDate: formTargetDate || null,
          emoji: formEmoji,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal memperbarui goal");
        return;
      }

      toast.success("Goal berhasil diperbarui!");
      setIsEditOpen(false);
      setEditingGoal(null);
      fetchGoals();
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const ok = await openConfirm({
      title: "Hapus Goal",
      message: "Apakah Anda yakin ingin menghapus goal ini secara permanen? Semua milestone dan review terkait juga akan dihapus.",
      variant: "danger",
    });

    if (!ok) return;

    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menghapus goal");
        return;
      }

      toast.success("Goal berhasil dihapus");
      fetchGoals();
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  // Filter list
  const filteredGoals = goals.filter((g) => {
    const matchCat = filterCategory === "ALL" || g.category === filterCategory;
    const matchStatus = filterStatus === "ALL" || g.status === filterStatus;
    return matchCat && matchStatus;
  });

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

  return (
    <div className="w-full px-4 lg:px-6">
      {confirmModal}

      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Goal Aktif</h1>
          <p className="text-muted-foreground">
            Kelola seluruh target & rencana pengembangan diri Anda di sini.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer"
        >
          ➕ Tambah Goal Baru
        </button>
      </div>

      {/* Filters */}
      <div className="border-2 border-border bg-card p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] mb-6 flex flex-wrap gap-4 items-center">
        <span className="font-mono font-bold text-xs uppercase text-muted-foreground">Filter:</span>
        <div className="flex flex-wrap gap-3">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border-2 border-border bg-background p-2 font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
          >
            <option value="ALL">Semua Kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border-2 border-border bg-background p-2 font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List Grid */}
      {isLoading ? (
        <div className="flex h-[30vh] items-center justify-center text-muted-foreground font-mono">
          Memuat daftar goal...
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="border-2 border-dashed border-border p-12 text-center bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <p className="text-sm font-mono text-muted-foreground uppercase">Tidak ada goal yang cocok dengan kriteria filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredGoals.map((g) => {
            const cat = CATEGORIES.find((c) => c.value === g.category) || { label: g.category, color: "bg-muted text-foreground border-border/30", icon: "🎯" };
            const badge = getStatusBadge(g.progress, g.status);
            const d = g.targetDate ? new Date(g.targetDate) : null;
            const completedMilestones = g.milestones ? g.milestones.filter(m => m.isCompleted).length : 0;
            const totalMilestones = g.milestones ? g.milestones.length : 0;

            return (
              <div
                key={g.id}
                className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl p-1.5 border-2 border-border bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                      {g.emoji}
                    </span>
                    <div className="flex flex-col gap-1 items-end">
                      <span className={`font-mono text-[9px] px-1.5 py-0.5 border font-bold uppercase ${cat.color}`}>
                        {cat.icon} {cat.label}
                      </span>
                      <span className={`font-mono text-[9px] px-1.5 py-0.5 border font-bold uppercase mt-1 ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-mono font-extrabold text-base uppercase mb-1">{g.title}</h3>
                  {g.description && (
                    <p className="text-[11px] text-muted-foreground font-mono mb-4 leading-relaxed line-clamp-2">
                      {g.description}
                    </p>
                  )}
                </div>

                <div className="mt-auto pt-4 border-t border-border/20 space-y-4">
                  {/* Progress info */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono font-bold uppercase text-muted-foreground">
                      <span>Milestones: {completedMilestones}/{totalMilestones}</span>
                      <span>{g.progress}%</span>
                    </div>
                    <div className="w-full h-3 bg-muted border border-border">
                      <div
                        className="h-full bg-primary border-r border-border transition-all duration-300"
                        style={{ width: `${g.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta data */}
                  <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                    <span>Target: {d ? d.toLocaleDateString("id-ID", { month: "short", year: "numeric" }) : "—"}</span>
                    <span className="capitalize font-bold text-foreground">Status: {g.status}</span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link href={`/dashboard/goals/roadmap?goalId=${g.id}`} className="block">
                      <button className="w-full py-1.5 border-2 border-border bg-background text-foreground font-bold font-mono text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
                        Roadmap 🗺️
                      </button>
                    </Link>
                    <Link href={`/dashboard/goals/review?goalId=${g.id}`} className="block">
                      <button className="w-full py-1.5 border-2 border-border bg-background text-foreground font-bold font-mono text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
                        Review 📝
                      </button>
                    </Link>
                    <button
                      onClick={() => handleOpenEdit(g)}
                      className="py-1.5 border-2 border-border bg-background text-foreground font-bold font-mono text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer"
                    >
                      Ubah ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      className="py-1.5 border-2 border-destructive bg-destructive/10 text-destructive font-bold font-mono text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer"
                    >
                      Hapus 🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="w-full max-w-md border-2 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] max-h-[90vh] overflow-y-auto">
            <h3 className="font-mono font-extrabold text-base uppercase border-b-2 border-border pb-3 mb-4">
              ➕ Tambah Goal Baru
            </h3>
            <form onSubmit={handleAddGoal} className="space-y-4">
              {/* Emoji Selector */}
              <div>
                <label className="block font-mono font-bold text-xs uppercase text-muted-foreground mb-1.5">Emoji Icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setFormEmoji(e)}
                      className={`text-xl p-1.5 border-2 transition-all ${
                        formEmoji === e
                          ? "border-primary bg-primary/10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-mono font-bold text-xs uppercase text-muted-foreground mb-1">Judul Goal</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: IPK 3.75, Kuasai React"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-mono font-bold text-xs uppercase text-muted-foreground mb-1">Deskripsi / Detail</label>
                <textarea
                  placeholder="Detail target dan visi goal ini..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block font-mono font-bold text-xs uppercase text-muted-foreground mb-1">Kategori</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full border-2 border-border bg-background p-2.5 font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Date */}
                <div>
                  <label className="block font-mono font-bold text-xs uppercase text-muted-foreground mb-1">Target Tanggal</label>
                  <input
                    type="date"
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    className="w-full border-2 border-border bg-background p-2 font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex gap-3 pt-3 border-t border-border/20">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2.5 border-2 border-border bg-background text-foreground font-bold font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 border-2 border-border bg-primary text-primary-foreground font-bold font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer"
                >
                  Simpan Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="w-full max-w-md border-2 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] max-h-[90vh] overflow-y-auto">
            <h3 className="font-mono font-extrabold text-base uppercase border-b-2 border-border pb-3 mb-4">
              ✏️ Ubah Goal
            </h3>
            <form onSubmit={handleEditGoal} className="space-y-4">
              {/* Emoji Selector */}
              <div>
                <label className="block font-mono font-bold text-xs uppercase text-muted-foreground mb-1.5">Emoji Icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setFormEmoji(e)}
                      className={`text-xl p-1.5 border-2 transition-all ${
                        formEmoji === e
                          ? "border-primary bg-primary/10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-mono font-bold text-xs uppercase text-muted-foreground mb-1">Judul Goal</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: IPK 3.75, Kuasai React"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-mono font-bold text-xs uppercase text-muted-foreground mb-1">Deskripsi / Detail</label>
                <textarea
                  placeholder="Detail target dan visi goal..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Category */}
                <div className="col-span-1">
                  <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Kategori</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full border-2 border-border bg-background p-2 font-mono font-bold text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full border-2 border-border bg-background p-2 font-mono font-bold text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Date */}
                <div className="col-span-1">
                  <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Target</label>
                  <input
                    type="date"
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    className="w-full border-2 border-border bg-background p-1.5 font-mono text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex gap-3 pt-3 border-t border-border/20">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); setEditingGoal(null); }}
                  className="flex-1 py-2.5 border-2 border-border bg-background text-foreground font-bold font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 border-2 border-border bg-primary text-primary-foreground font-bold font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
