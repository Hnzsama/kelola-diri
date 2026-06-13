"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

interface Semester {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/academic/semesters");
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      setSemesters(data);
    } catch (error) {
      toast.error("Gagal memuat data semester");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama semester tidak boleh kosong!");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/academic/semesters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), isActive }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan semester");
      } else {
        toast.success("Semester berhasil ditambahkan!");
        setIsFormOpen(false);
        setName("");
        setIsActive(false);
        fetchSemesters();
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const res = await fetch(`/api/academic/semesters/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengaktifkan");
      }

      toast.success("Semester berhasil diaktifkan!");
      fetchSemesters();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengaktifkan semester");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus semester ini? Menghapus semester akan melepaskan keterkaitan seluruh mata kuliah di dalamnya (mata kuliah akan bernilai 'Tanpa Semester')."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/academic/semesters/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus");
      }

      toast.success("Semester berhasil dihapus");
      fetchSemesters();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus semester");
    }
  };

  return (
    <div className="w-full px-4 lg:px-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Kelola Semester</h1>
          <p className="text-muted-foreground">
            Definisikan struktur semester akademik Anda dan tentukan mana yang aktif digunakan saat ini.
          </p>
        </div>
        <div>
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-2 px-5 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider text-left transition-all cursor-pointer bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Tambah Semester</span>
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="mb-8 border-2 border-border bg-card p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
          <h2 className="text-xl font-bold uppercase font-mono mb-4">Tambah Semester Baru</h2>
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            <Field>
              <FieldLabel htmlFor="semName">Nama Semester *</FieldLabel>
              <Input
                id="semName"
                placeholder="Contoh: Semester Ganjil 2025/2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>

            <div className="flex items-center gap-2 pt-2">
              <input
                id="semActive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 rounded-none border-2 border-border text-primary focus:ring-0 cursor-pointer"
              />
              <label htmlFor="semActive" className="text-xs font-mono font-bold uppercase select-none cursor-pointer">
                Atur sebagai Semester Aktif
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSaving} className="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                {isSaving ? "Menyimpan..." : "Simpan Semester"}
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

      {isLoading ? (
        <div className="flex h-[30vh] items-center justify-center text-muted-foreground font-mono">
          Memuat data semester...
        </div>
      ) : semesters.length === 0 ? (
        <div className="border-2 border-dashed border-border p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mx-auto size-12 text-muted-foreground mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <h3 className="text-lg font-bold font-mono uppercase mb-1">Belum Ada Semester</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Buat semester aktif agar data mata kuliah, tugas, dan ujian dapat dikelompokkan dengan rapi.
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 border-2 border-border font-bold text-xs uppercase tracking-wider transition-all bg-background text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:bg-muted dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
          >
            Tambah Semester Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {semesters.map((sem) => (
            <div
              key={sem.id}
              className={`border-2 border-border p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1 transition-all flex flex-col justify-between min-h-[140px] bg-card ${
                sem.isActive ? "border-accent outline-2 outline-accent outline-offset-[-2px]" : ""
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 border uppercase ${
                      sem.isActive
                        ? "bg-accent text-accent-foreground border-accent"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {sem.isActive ? "AKTIF" : "TIDAK AKTIF"}
                  </span>
                  {!sem.isActive && (
                    <button
                      onClick={() => handleDelete(sem.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      title="Hapus"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  )}
                </div>
                <h3 className="text-base font-bold font-mono uppercase tracking-tight mb-2">
                  {sem.name}
                </h3>
              </div>

              {!sem.isActive && (
                <div className="border-t border-border/20 pt-3 mt-2">
                  <button
                    onClick={() => handleActivate(sem.id)}
                    className="w-full py-1.5 px-3 border-2 border-border font-bold text-[10px] uppercase tracking-wider text-center transition-all bg-background text-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:bg-muted dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] cursor-pointer"
                  >
                    Aktifkan Semester
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
