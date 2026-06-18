"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { CardGridSkeleton } from "@/components/ui/page-skeleton";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const PRESET_COLORS = [
  { name: "Biru (Akademik)", value: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-400/20" },
  { name: "Hijau (Kesehatan)", value: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-400/20" },
  { name: "Ungu (Spiritual)", value: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-400/20" },
  { name: "Kuning (Karier)", value: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/20" },
  { name: "Merah (Olahraga)", value: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-400/20" },
  { name: "Sian (Sosial)", value: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-400/20" },
  { name: "Oranye (Self-Growth)", value: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-400/20" },
  { name: "Abu-abu (Lainnya)", value: "bg-muted text-muted-foreground border-border" }
];

const PRESET_ICONS = ["📚", "💪", "🕌", "💼", "🍳", "🚰", "🧘", "📖", "✍️", "🍎", "🏃", "🛌", "🎨", "🎵", "💻", "🎯", "📌"];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📌");
  const [color, setColor] = useState(PRESET_COLORS[0].value);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/habits/categories");
      if (!res.ok) throw new Error("Gagal mengambil kategori");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      toast.error("Gagal memuat kategori");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama kategori tidak boleh kosong!");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingId ? `/api/habits/categories/${editingId}` : "/api/habits/categories";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          icon: icon.trim(),
          color,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan");
      }

      toast.success(editingId ? "Kategori berhasil diperbarui!" : "Kategori baru berhasil ditambahkan!");
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan kategori");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
  };

  const handleDelete = async (id: string, catName: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus kategori "${catName}"?\n\nKebiasaan yang masuk dalam kategori ini akan berubah menjadi "Tanpa Kategori" (tidak akan dihapus).`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/habits/categories/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus");
      }

      toast.success("Kategori berhasil dihapus");
      if (editingId === id) resetForm();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus kategori");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setIcon("📌");
    setColor(PRESET_COLORS[0].value);
  };

  if (isLoading) return <CardGridSkeleton count={3} />;

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Title Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Kategori Kebiasaan</h1>
          <p className="text-muted-foreground">
            Kelola kategori kustom untuk mengelompokkan kebiasaan harian Anda secara terstruktur.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/habits">
            <button className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-background text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
              Dashboard Habit
            </button>
          </Link>
          <Link href="/dashboard/habits/checklist">
            <button className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
              Checklist Harian
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-8">
        {/* LIST KATEGORI */}
        <div className="lg:col-span-2 border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] p-6">
          <h3 className="font-mono font-extrabold text-sm uppercase tracking-wider mb-4 border-b border-border/20 pb-3">
            📋 Daftar Kategori Terdaftar ({categories.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono border-collapse">
              <thead>
                <tr className="border-b-2 border-border bg-muted/40 text-xs font-bold uppercase select-none">
                  <th className="p-3">Nama Kategori</th>
                  <th className="p-3">Ikon</th>
                  <th className="p-3">Pratinjau Badge</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-border/20">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-3 font-bold uppercase">{cat.name}</td>
                    <td className="p-3 text-lg">{cat.icon}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.8 border text-[10px] font-bold uppercase ${cat.color}`}>
                        {cat.icon} {cat.name}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(cat)}
                          className="px-2.5 py-1 border-2 border-border font-bold text-[10px] uppercase bg-background text-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="px-2.5 py-1 border-2 border-destructive font-bold text-[10px] uppercase bg-destructive/10 text-destructive shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FORM TAMBAH / EDIT KATEGORI */}
        <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <h3 className="font-mono font-extrabold text-sm uppercase tracking-wider mb-4 border-b border-border/20 pb-3">
            {editingId ? "⚡ Edit Kategori" : "➕ Tambah Kategori"}
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="catName">Nama Kategori *</FieldLabel>
              <Input
                id="catName"
                placeholder="Contoh: Sosial, Spiritual, Hobi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="catIcon">Ikon Kategori *</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="catIcon"
                  placeholder="Emoji"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  maxLength={4}
                  className="w-16 text-center text-lg"
                  required
                />
                <div className="flex-1 flex flex-wrap gap-1 items-center max-h-24 overflow-y-auto border border-border p-1.5 bg-muted/20">
                  {PRESET_ICONS.map((pIcon) => (
                    <button
                      key={pIcon}
                      type="button"
                      onClick={() => setIcon(pIcon)}
                      className={`size-6 flex items-center justify-center text-sm border hover:bg-background transition-colors ${
                        icon === pIcon ? "border-primary bg-primary/10" : "border-transparent"
                      }`}
                    >
                      {pIcon}
                    </button>
                  ))}
                </div>
              </div>
            </Field>

            <Field>
              <FieldLabel>Pilihan Warna & Gaya *</FieldLabel>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1.5 border border-border bg-muted/20 scrollbar-thin">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setColor(preset.value)}
                    className={`p-2 border-2 text-[10px] font-mono font-bold text-left rounded-none transition-all flex flex-col justify-between ${
                      color === preset.value
                        ? "border-primary bg-primary/5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] translate-x-[-2px] translate-y-[-2px]"
                        : "border-border bg-background"
                    }`}
                  >
                    <span>{preset.name}</span>
                    <span className={`mt-1.5 px-1.5 py-0.2 border text-[8px] uppercase inline-block ${preset.value}`}>
                      {icon} {name || "PREVIEW"}
                    </span>
                  </button>
                ))}
              </div>
            </Field>

            <div className="pt-2 border-t border-border/10 flex gap-2">
              <Button type="submit" disabled={isSaving} className="flex-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                {isSaving ? "Menyimpan..." : editingId ? "Update Kategori" : "Simpan Kategori"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                >
                  Batal
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
