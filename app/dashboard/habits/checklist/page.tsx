"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { calculateStreaks } from "@/lib/habit-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";

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

export default function ChecklistPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add Habit Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [habitsRes, categoriesRes] = await Promise.all([
        fetch("/api/habits"),
        fetch("/api/habits/categories"),
      ]);

      if (!habitsRes.ok || !categoriesRes.ok) throw new Error("Gagal");
      
      const habitsData = await habitsRes.json();
      const categoriesData = await categoriesRes.json();

      setHabits(habitsData);
      setCategories(categoriesData);

      if (categoriesData.length > 0) {
        setCategoryId(categoriesData[0].id);
      }
    } catch (error) {
      toast.error("Gagal memuat checklist habit");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLog = async (habitId: string, currentlyCompleted: boolean) => {
    try {
      const todayStr = REF_DATE.toISOString().split("T")[0];
      const newStatus = !currentlyCompleted;

      // Optimistic update
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habitId) return h;
          
          const existingLogIdx = h.logs.findIndex((l) => new Date(l.date).toISOString().split("T")[0] === todayStr);
          let updatedLogs = [...h.logs];
          
          if (existingLogIdx > -1) {
            updatedLogs[existingLogIdx] = { ...updatedLogs[existingLogIdx], completed: newStatus };
          } else {
            updatedLogs.push({ date: todayStr, completed: newStatus });
          }
          
          return { ...h, logs: updatedLogs };
        })
      );

      const res = await fetch("/api/habits/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitId,
          completed: newStatus,
          date: todayStr,
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan log");
      }

      toast.success(newStatus ? "Kebiasaan diselesaikan! 🔥" : "Kebiasaan dibatalkan.");
      // Refresh data to update streak calculations
      const habitsRes = await fetch("/api/habits");
      if (habitsRes.ok) {
        setHabits(await habitsRes.json());
      }
    } catch (error) {
      toast.error("Gagal memperbarui catatan");
      fetchData(); // Rollback
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama kebiasaan tidak boleh kosong!");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          categoryId: categoryId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan");
      }

      toast.success("Kebiasaan baru berhasil ditambahkan!");
      setIsFormOpen(false);
      setName("");
      setDescription("");
      if (categories.length > 0) {
        setCategoryId(categories[0].id);
      }
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat kebiasaan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kebiasaan ini? Seluruh riwayat log harian juga akan dihapus.")) {
      return;
    }

    try {
      const res = await fetch(`/api/habits/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus");
      }

      toast.success("Kebiasaan berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus kebiasaan");
    }
  };

  const todayStr = REF_DATE.toISOString().split("T")[0];

  const getIsCompletedToday = (habit: Habit) => {
    return habit.logs.some(
      (l) => new Date(l.date).toISOString().split("T")[0] === todayStr && l.completed
    );
  };

  const getHabitsByCategoryId = (catId: string) => {
    return habits.filter((h) => h.categoryId === catId && h.isActive);
  };

  const getUncategorizedHabits = () => {
    return habits.filter((h) => !h.categoryId && h.isActive);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground font-mono">
        Memuat checklist harian...
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Checklist Harian</h1>
          <p className="text-muted-foreground">
            Tanggal: <span className="font-bold text-foreground font-mono">{REF_DATE.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/habits/categories">
            <button
              className="flex items-center gap-2 px-4 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider text-left transition-all cursor-pointer bg-background text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]"
            >
              <span>Kelola Kategori</span>
            </button>
          </Link>
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-2 px-5 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider text-left transition-all cursor-pointer bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Tambah Kebiasaan</span>
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="mb-8 border-2 border-border bg-card p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
          <h2 className="text-xl font-bold uppercase font-mono mb-4">Tambah Kebiasaan Baru</h2>
          <form onSubmit={handleCreateHabit} className="space-y-4 max-w-md">
            <Field>
              <FieldLabel htmlFor="habitName">Nama Kebiasaan *</FieldLabel>
              <Input
                id="habitName"
                placeholder="Contoh: Belajar Coding React"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="habitDesc">Keterangan / Rincian</FieldLabel>
              <Input
                id="habitDesc"
                placeholder="Contoh: Latihan membuat 1 komponen per hari"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="habitCategory">Kategori Kebiasaan *</FieldLabel>
              <select
                id="habitCategory"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-hidden"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSaving} className="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                {isSaving ? "Menyimpan..." : "Simpan Kebiasaan"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
              >
                Batal
              </Button>
            </div>
          </form>
        </div>
      )}

      {habits.length === 0 ? (
        <div className="border-2 border-dashed border-border p-12 text-center bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <p className="text-muted-foreground mb-4 font-mono text-sm">Belum ada kebiasaan yang dibuat.</p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px]"
          >
            Tambah Kebiasaan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-8">
          {categories.map((cat) => {
            const catHabits = getHabitsByCategoryId(cat.id);

            return (
              <div
                key={cat.id}
                className="border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
              >
                <div className="p-4 border-b-2 border-border bg-muted/20 flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <h3 className="font-mono font-extrabold text-sm uppercase tracking-wider">
                    {cat.name}
                  </h3>
                </div>

                <div className="p-4 divide-y divide-border/20">
                  {catHabits.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground font-mono italic">
                      Belum ada kebiasaan di kategori ini.
                    </div>
                  ) : (
                    catHabits.map((h) => {
                      const completed = getIsCompletedToday(h);
                      const { currentStreak } = calculateStreaks(h.logs, REF_DATE);

                      return (
                        <div
                          key={h.id}
                          className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={completed}
                              onChange={() => handleToggleLog(h.id, completed)}
                              className="mt-1 size-5 shrink-0 rounded-none border-2 border-border text-primary focus:ring-0 cursor-pointer dark:bg-zinc-900"
                            />
                            <div className="space-y-0.5">
                              <h4
                                className={`font-mono font-bold text-sm uppercase tracking-tight transition-all ${
                                  completed ? "line-through text-muted-foreground" : "text-foreground"
                                }`}
                              >
                                {h.name}
                              </h4>
                              {h.description && (
                                <p className="text-[11px] text-muted-foreground leading-normal max-w-sm">
                                  {h.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {currentStreak > 0 && (
                              <span
                                className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 select-none"
                                title={`Streak aktif: ${currentStreak} hari`}
                              >
                                🔥 {currentStreak} H
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteHabit(h.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1"
                              title="Hapus"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}

          {getUncategorizedHabits().length > 0 && (
            <div className="border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <div className="p-4 border-b-2 border-border bg-muted/20 flex items-center gap-2">
                <span className="text-xl">📌</span>
                <h3 className="font-mono font-extrabold text-sm uppercase tracking-wider">
                  Tanpa Kategori
                </h3>
              </div>

              <div className="p-4 divide-y divide-border/20">
                {getUncategorizedHabits().map((h) => {
                  const completed = getIsCompletedToday(h);
                  const { currentStreak } = calculateStreaks(h.logs, REF_DATE);

                  return (
                    <div
                      key={h.id}
                      className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={completed}
                          onChange={() => handleToggleLog(h.id, completed)}
                          className="mt-1 size-5 shrink-0 rounded-none border-2 border-border text-primary focus:ring-0 cursor-pointer dark:bg-zinc-900"
                        />
                        <div className="space-y-0.5">
                          <h4
                            className={`font-mono font-bold text-sm uppercase tracking-tight transition-all ${
                              completed ? "line-through text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            {h.name}
                          </h4>
                          {h.description && (
                            <p className="text-[11px] text-muted-foreground leading-normal max-w-sm">
                              {h.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {currentStreak > 0 && (
                          <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 select-none">
                            🔥 {currentStreak} H
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteHabit(h.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          title="Hapus"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
