"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { useConfirm } from "@/components/ui/confirm-modal";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";

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

function RoadmapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const goalIdParam = searchParams.get("goalId");

  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Milestone form states
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  // Edit milestone states
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editingMilestoneTitle, setEditingMilestoneTitle] = useState("");

  // Drag and Drop state
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const { confirmModal, openConfirm } = useConfirm();

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
        // If query param exists, select that goal, otherwise select the first one
        const initialGoal = goalIdParam
          ? data.find((g: Goal) => g.id === goalIdParam) || data[0]
          : data[0];
        setSelectedGoal(initialGoal);
      }
    } catch {
      toast.error("Gagal memuat data goal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoalChange = (id: string) => {
    const goal = goals.find((g) => g.id === id) || null;
    setSelectedGoal(goal);
    // Update URL query parameter
    if (goal) {
      router.push(`/dashboard/goals/roadmap?goalId=${goal.id}`);
    } else {
      router.push("/dashboard/goals/roadmap");
    }
  };

  const handleToggleMilestone = async (milestone: Milestone) => {
    if (!selectedGoal) return;
    try {
      const res = await fetch(`/api/goals/${selectedGoal.id}/milestones/${milestone.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isCompleted: !milestone.isCompleted,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mengubah status milestone");
        return;
      }

      // Update local state
      const updatedMilestones = selectedGoal.milestones.map((m) =>
        m.id === milestone.id ? { ...m, isCompleted: !m.isCompleted } : m
      );

      const updatedGoal = {
        ...selectedGoal,
        progress: data.goal.progress,
        milestones: updatedMilestones,
      };

      setSelectedGoal(updatedGoal);
      setGoals(goals.map((g) => (g.id === selectedGoal.id ? updatedGoal : g)));
      toast.success(milestone.isCompleted ? "Milestone ditandai belum selesai" : "Milestone selesai! 🎉");
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !newMilestoneTitle.trim()) return;

    setIsAddingMilestone(true);
    try {
      const res = await fetch(`/api/goals/${selectedGoal.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newMilestoneTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menambah milestone");
        return;
      }

      // Add to list and sort by order
      const updatedMilestones = [...selectedGoal.milestones, data.milestone].sort(
        (a, b) => a.order - b.order
      );

      const updatedGoal = {
        ...selectedGoal,
        progress: data.goal.progress,
        milestones: updatedMilestones,
      };

      setSelectedGoal(updatedGoal);
      setGoals(goals.map((g) => (g.id === selectedGoal.id ? updatedGoal : g)));
      setNewMilestoneTitle("");
      toast.success("Milestone baru ditambahkan!");
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsAddingMilestone(false);
    }
  };

  const handleStartEditMilestone = (milestone: Milestone) => {
    setEditingMilestoneId(milestone.id);
    setEditingMilestoneTitle(milestone.title);
  };

  const handleSaveEditMilestone = async (milestone: Milestone) => {
    if (!selectedGoal || !editingMilestoneTitle.trim()) return;

    try {
      const res = await fetch(`/api/goals/${selectedGoal.id}/milestones/${milestone.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingMilestoneTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mengubah judul milestone");
        return;
      }

      const updatedMilestones = selectedGoal.milestones.map((m) =>
        m.id === milestone.id ? { ...m, title: editingMilestoneTitle } : m
      );

      setSelectedGoal({ ...selectedGoal, milestones: updatedMilestones });
      setEditingMilestoneId(null);
      toast.success("Milestone berhasil diubah");
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!selectedGoal) return;

    const ok = await openConfirm({
      title: "Hapus Langkah",
      message: "Apakah Anda yakin ingin menghapus milestone ini? Progress goal Anda akan dihitung kembali.",
      variant: "danger",
    });

    if (!ok) return;

    try {
      const res = await fetch(`/api/goals/${selectedGoal.id}/milestones/${milestoneId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menghapus milestone");
        return;
      }

      const updatedMilestones = selectedGoal.milestones.filter((m) => m.id !== milestoneId);
      const updatedGoal = {
        ...selectedGoal,
        progress: data.goal.progress,
        milestones: updatedMilestones,
      };

      setSelectedGoal(updatedGoal);
      setGoals(goals.map((g) => (g.id === selectedGoal.id ? updatedGoal : g)));
      toast.success("Milestone berhasil dihapus");
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  // Drag-and-drop handlers
  const handleDragStart = (index: number) => {
    setDraggingIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === index) return;
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === targetIndex || !selectedGoal) return;

    const reordered = [...selectedGoal.milestones];
    const [draggedItem] = reordered.splice(draggingIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);

    // Reassign orders locally
    const updated = reordered.map((m, idx) => ({ ...m, order: idx }));

    setSelectedGoal({ ...selectedGoal, milestones: updated });
    setDraggingIndex(null);

    // Save orders to DB in parallel
    try {
      const updatePromises = updated.map((m) =>
        fetch(`/api/goals/${selectedGoal.id}/milestones/${m.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: m.order }),
        })
      );
      await Promise.all(updatePromises);
      toast.success("Urutan langkah berhasil disimpan!");
    } catch {
      toast.error("Gagal menyimpan urutan baru di server");
      // Reload original goals to undo
      fetchGoals();
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (goals.length === 0) {
    return (
      <div className="w-full px-4 lg:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase mb-6">Roadmap Goal</h1>
        <div className="border-2 border-dashed border-border p-12 text-center bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <p className="text-sm font-mono text-muted-foreground mb-6">Anda belum memiliki goal aktif untuk dibuatkan roadmap.</p>
          <Link href="/dashboard/goals/active">
            <button className="px-5 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
              Buat Goal Sekarang
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Find index of first incomplete milestone (this is the "current/active" step)
  const currentIncompleteIndex = selectedGoal
    ? selectedGoal.milestones.findIndex((m) => !m.isCompleted)
    : -1;

  return (
    <div className="w-full px-4 lg:px-6">
      {confirmModal}

      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Roadmap</h1>
          <p className="text-muted-foreground font-mono text-xs">
            Visualisasikan peta jalan (milestone) pencapaian goal Anda dalam garis waktu vertikal.
          </p>
        </div>
        <div>
          {/* Goal Selector */}
          <select
            value={selectedGoal?.id || ""}
            onChange={(e) => handleGoalChange(e.target.value)}
            className="border-2 border-border bg-card p-3 font-mono font-bold text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
          >
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.emoji} {g.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedGoal && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-8">
          {/* Goal Highlights */}
          <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl p-2 border-2 border-border bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                {selectedGoal.emoji}
              </span>
              <div>
                <h3 className="font-mono font-extrabold text-base uppercase">{selectedGoal.title}</h3>
                <span className="inline-block text-[9px] font-mono font-bold uppercase text-muted-foreground mt-0.5">
                  Category: {selectedGoal.category}
                </span>
              </div>
            </div>

            {selectedGoal.description && (
              <p className="text-xs text-muted-foreground font-mono mb-5 leading-relaxed bg-background p-3 border-2 border-border">
                {selectedGoal.description}
              </p>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono font-bold uppercase">
                <span>Progress Roadmap</span>
                <span>{selectedGoal.progress}%</span>
              </div>
              <div className="w-full h-4 bg-muted border-2 border-border">
                <div
                  className="h-full bg-primary border-r-2 border-border transition-all duration-300"
                  style={{ width: `${selectedGoal.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground pt-1.5 uppercase">
                <span>Langkah Selesai: {selectedGoal.milestones.filter(m => m.isCompleted).length}</span>
                <span>Total: {selectedGoal.milestones.length}</span>
              </div>
            </div>
          </div>

          {/* Vertical Timeline Roadmap */}
          <div className="lg:col-span-2 border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <div className="border-b border-border/20 pb-3 mb-6">
              <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight">🗺️ Urutan Langkah & Milestone</h3>
              <p className="text-[10px] text-muted-foreground font-mono mt-1">
                Centang langkah yang sudah selesai, atau seret (drag) baris untuk mengatur ulang urutan pencapaian.
              </p>
            </div>

            {selectedGoal.milestones.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border mb-6">
                <p className="text-xs text-muted-foreground font-mono italic">Belum ada langkah dalam roadmap goal ini.</p>
              </div>
            ) : (
              <div className="relative pl-8 ml-4 border-l-2 border-border space-y-6 mb-6">
                {selectedGoal.milestones.map((m, index) => {
                  const isCurrent = index === currentIncompleteIndex;
                  const isCompleted = m.isCompleted;

                  // Determine timeline dot style
                  let dotIcon = "⬜";
                  let dotBg = "bg-background border-border text-muted-foreground";

                  if (isCompleted) {
                    dotIcon = "✅";
                    dotBg = "bg-emerald-500/10 border-emerald-500 text-emerald-600";
                  } else if (isCurrent) {
                    dotIcon = "🔄";
                    dotBg = "bg-primary/20 border-primary text-primary animate-pulse";
                  }

                  const isDragging = draggingIndex === index;

                  return (
                    <div
                      key={m.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`relative flex gap-4 items-center border-2 border-border p-3.5 bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-move select-none ${
                        isDragging ? "opacity-30 border-dashed" : ""
                      } ${isCurrent ? "ring-2 ring-primary ring-offset-1" : ""}`}
                    >
                      {/* Timeline Dot positioned absolutely on the left border line */}
                      <span
                        className={`absolute -left-[45px] top-1/2 -translate-y-1/2 flex items-center justify-center size-8 border-2 rounded-full text-sm font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] z-10 ${dotBg}`}
                      >
                        {dotIcon}
                      </span>

                      {/* Drag Handle Icon */}
                      <span className="text-muted-foreground text-xs font-mono cursor-grab px-1">
                        ⣿
                      </span>

                      {/* Checkbox (toggle status) */}
                      <input
                        type="checkbox"
                        checked={m.isCompleted}
                        onChange={() => handleToggleMilestone(m)}
                        className="size-5 border-2 border-border bg-background focus:ring-0 checked:bg-primary cursor-pointer shrink-0"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {editingMilestoneId === m.id ? (
                          <div className="flex gap-2 w-full">
                            <input
                              type="text"
                              value={editingMilestoneTitle}
                              onChange={(e) => setEditingMilestoneTitle(e.target.value)}
                              className="flex-1 border-2 border-border bg-background px-2 py-1 font-mono text-xs focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEditMilestone(m)}
                              className="px-2 py-1 border-2 border-border bg-primary text-primary-foreground font-mono font-bold text-[10px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setEditingMilestoneId(null)}
                              className="px-2 py-1 border-2 border-border bg-background text-foreground font-mono font-bold text-[10px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center gap-2">
                            <span
                              className={`font-mono text-xs truncate uppercase ${
                                isCompleted ? "line-through text-muted-foreground" : "font-bold"
                              }`}
                            >
                              {m.title}
                            </span>
                            {isCurrent && (
                              <span className="font-mono text-[8px] bg-primary text-primary-foreground px-1 border border-border font-bold uppercase animate-pulse">
                                Sedang Dikerjakan
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Item Actions */}
                      {editingMilestoneId !== m.id && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEditMilestone(m)}
                            className="p-1 border border-border bg-muted/20 hover:bg-muted text-[10px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                            title="Edit nama"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteMilestone(m.id)}
                            className="p-1 border border-destructive bg-destructive/10 hover:bg-destructive/20 text-[10px] text-destructive shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                            title="Hapus langkah"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Inline Add Form */}
            <form onSubmit={handleAddMilestone} className="border-2 border-border p-4 bg-muted/10 space-y-3">
              <h4 className="font-mono font-bold text-xs uppercase text-foreground">➕ Tambah Langkah Pencapaian</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: Selesaikan program pembelajaran modul 2"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  className="flex-1 border-2 border-border bg-background p-2 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                  disabled={isAddingMilestone}
                  required
                />
                <button
                  type="submit"
                  disabled={isAddingMilestone}
                  className="px-4 py-2 border-2 border-border bg-primary text-primary-foreground font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer"
                >
                  {isAddingMilestone ? "Menambah..." : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GoalRoadmapPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <RoadmapContent />
    </Suspense>
  );
}
