"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useConfirm } from "@/components/ui/confirm-modal";

interface FinanceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const EMOJIS = ["🍜", "⛽", "📚", "🏢", "💻", "🎮", "🏥", "🛍️", "✈️", "💰", "🍔", "🚗", "🏡", "🎁", "🍿", "👟", "💈", "💊"];

const COLOR_PRESETS = [
  { label: "Biru", value: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-400/30" },
  { label: "Hijau", value: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-400/30" },
  { label: "Ungu", value: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-400/30" },
  { label: "Kuning", value: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/30" },
  { label: "Merah", value: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-400/30" },
  { label: "Indigo", value: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-400/30" },
  { label: "Abu-abu", value: "bg-muted text-muted-foreground border-border/30" },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states (Create/Edit)
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FinanceCategory | null>(null);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🍜");
  const [color, setColor] = useState(COLOR_PRESETS[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { confirmModal, openConfirm } = useConfirm();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/finance/categories");
      if (!res.ok) throw new Error("Gagal mengambil kategori");
      const data = await res.json();
      setCategories(data);
    } catch {
      toast.error("Gagal memuat kategori keuangan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/finance/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), icon, color }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal membuat kategori");
        return;
      }

      toast.success("Kategori berhasil ditambahkan!");
      setName("");
      setIcon("🍜");
      setColor(COLOR_PRESETS[0].value);
      fetchCategories();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (cat: FinanceCategory) => {
    setActiveCategory(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
    setIsEditOpen(true);
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategory) return;
    if (!name.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/finance/categories/${activeCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), icon, color }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal memperbarui kategori");
        return;
      }

      toast.success("Kategori berhasil diperbarui!");
      setIsEditOpen(false);
      setActiveCategory(null);
      setName("");
      setIcon("🍜");
      setColor(COLOR_PRESETS[0].value);
      fetchCategories();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat: FinanceCategory) => {
    const ok = await openConfirm({
      title: "Hapus Kategori",
      message: `Apakah Anda yakin ingin menghapus kategori "${cat.name}"? Kategori yang digunakan oleh transaksi tidak dapat dihapus secara acak.`,
      variant: "danger",
    });

    if (!ok) return;

    try {
      const res = await fetch(`/api/finance/categories/${cat.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menghapus kategori");
        return;
      }

      toast.success("Kategori berhasil dihapus");
      fetchCategories();
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  return (
    <div className="w-full px-4 lg:px-6">
      {confirmModal}

      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Kelola Kategori Keuangan</h1>
          <p className="text-muted-foreground font-mono text-xs">
            Buat kategori pemasukan/pengeluaran dinamis untuk pelacakan keuangan yang disesuaikan dengan kebutuhan Anda.
          </p>
        </div>
        <Link href="/dashboard/finance">
          <button className="px-4 py-2.5 border-2 border-border font-bold text-xs uppercase bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
            ← Dashboard
          </button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex h-[40vh] items-center justify-center text-muted-foreground font-mono">
          Memuat data kategori...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-start">
          {/* LEFT: CATEGORIES LIST */}
          <div className="lg:col-span-2 border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight border-b border-border/20 pb-3 mb-5">
              📋 Kategori Terdaftar ({categories.length}/20)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="border-2 border-border p-4 bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl p-1.5 border-2 border-border bg-card">{cat.icon}</span>
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-xs uppercase truncate block">{cat.name}</span>
                      <span className={`inline-block font-mono text-[7px] px-1 border font-semibold mt-1 uppercase ${cat.color}`}>
                        Label CSS
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1 border border-border bg-background hover:bg-muted font-bold text-[9px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                      title="Ubah"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1 border border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20 font-bold text-[9px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                      title="Hapus"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: CREATE FORM */}
          <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight border-b border-border/20 pb-3 mb-5">
              ➕ Tambah Kategori
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Transportasi, Jajan..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                />
              </div>

              {/* Emoji Selector */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">
                  Pilih Emoji ({icon})
                </label>
                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1 border border-border/30 bg-background mb-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setIcon(e)}
                      className={`text-lg p-1 border-2 transition-all cursor-pointer ${
                        icon === e ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">
                  Preset Warna Tag
                </label>
                <div className="space-y-1">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setColor(preset.value)}
                      className={`w-full py-1.5 px-3 border-2 font-mono font-bold text-[10px] text-left uppercase transition-all cursor-pointer flex justify-between items-center ${
                        color === preset.value
                          ? "border-primary shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className={`inline-block text-[8px] px-1.5 py-0.5 border ${preset.value}`}>
                        Contoh Tag
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || categories.length >= 20}
                className="w-full py-3 border-2 border-border bg-primary text-primary-foreground font-mono font-bold text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Kategori"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && activeCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="w-full max-w-sm border-2 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
            <h3 className="font-mono font-extrabold text-base uppercase border-b-2 border-border pb-3 mb-4">
              ✏️ Ubah Kategori
            </h3>
            <form onSubmit={handleEditCategory} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Transportasi..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                />
              </div>

              {/* Emoji Selector */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">
                  Pilih Emoji ({icon})
                </label>
                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1 border border-border/30 bg-background mb-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setIcon(e)}
                      className={`text-lg p-1 border-2 transition-all cursor-pointer ${
                        icon === e ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">
                  Preset Warna Tag
                </label>
                <div className="space-y-1">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setColor(preset.value)}
                      className={`w-full py-1.5 px-3 border-2 font-mono font-bold text-[10px] text-left uppercase transition-all cursor-pointer flex justify-between items-center ${
                        color === preset.value
                          ? "border-primary shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className={`inline-block text-[8px] px-1.5 py-0.5 border ${preset.value}`}>
                        Contoh Tag
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-3 border-t border-border/20">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); setActiveCategory(null); setName(""); }}
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
    </div>
  );
}
