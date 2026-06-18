"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoneySendIcon,
  Add01Icon,
  Delete02Icon,
  Calendar01Icon,
  Cancel01Icon,
  InvoiceIcon
} from "@hugeicons/core-free-icons";

interface Invoice {
  id: string;
  invoiceNumber: string;
}

interface Income {
  id: string;
  source: "FREELANCE" | "PART_TIME" | "MAGANG" | "BONUS" | string;
  amount: number;
  date: string;
  notes?: string;
  invoiceId?: string;
  invoice?: Invoice;
}

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");

  // Manual Log Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState<"FREELANCE" | "PART_TIME" | "MAGANG" | "BONUS">("FREELANCE");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/career/income");
      if (!res.ok) throw new Error("Gagal");
      const data = await res.json();
      setIncomes(data);
    } catch {
      toast.error("Gagal memuat data log pendapatan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) {
      toast.error("Nominal dan tanggal wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/career/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          amount,
          date,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan pendapatan");
      } else {
        toast.success("Log pendapatan berhasil dicatat!");
        setIsOpen(false);
        setAmount("");
        setDate("");
        setNotes("");
        setSource("FREELANCE");
        fetchIncomes();
      }
    } catch {
      toast.error("Gagal menyimpan pendapatan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data pendapatan ini? Transaksi keuangan terhubung di modul Finansial akan tetap tersimpan untuk mencegah data tidak seimbang.")) return;

    try {
      const res = await fetch(`/api/career/income/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Log pendapatan berhasil dihapus");
        fetchIncomes();
      } else {
        toast.error("Gagal menghapus pendapatan");
      }
    } catch {
      toast.error("Gagal menghapus pendapatan");
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

  // Grouped Calculations
  const totalFreelance = incomes.filter(inc => inc.source === "FREELANCE").reduce((sum, inc) => sum + inc.amount, 0);
  const totalPartTime = incomes.filter(inc => inc.source === "PART_TIME").reduce((sum, inc) => sum + inc.amount, 0);
  const totalMagang = incomes.filter(inc => inc.source === "MAGANG").reduce((sum, inc) => sum + inc.amount, 0);
  const totalBonus = incomes.filter(inc => inc.source === "BONUS").reduce((sum, inc) => sum + inc.amount, 0);
  const totalAll = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  // Filtered Income list
  const filteredIncomes = sourceFilter === "ALL"
    ? incomes
    : incomes.filter(inc => inc.source === sourceFilter);

  // Labels mappings
  const sourceLabels: Record<string, string> = {
    FREELANCE: "Freelance",
    PART_TIME: "Part-Time",
    MAGANG: "Magang / Intern",
    BONUS: "Bonus / Komisi",
  };

  const sourceColors: Record<string, string> = {
    FREELANCE: "bg-cyan-100 text-cyan-800 border-cyan-400",
    PART_TIME: "bg-violet-100 text-violet-800 border-violet-400",
    MAGANG: "bg-indigo-100 text-indigo-800 border-indigo-400",
    BONUS: "bg-amber-100 text-amber-800 border-amber-400",
  };

  return (
    <div className="w-full px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Log Pendapatan Karier</h1>
          <p className="text-muted-foreground font-mono text-xs">
            Catat pendapatan dari proyek freelance, magang berbayar, kerja sampingan, serta bonus tambahan Anda.
          </p>
        </div>
        <button
          onClick={() => {
            // Set date defaults to today
            const today = new Date().toISOString().substring(0, 10);
            setDate(today);
            setIsOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0"
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          <span>Catat Pendapatan</span>
        </button>
      </div>

      {/* Grid: Metrics summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="border-2 border-border bg-cyan-400/5 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] font-mono">
          <span className="text-[9px] font-bold text-muted-foreground uppercase">Freelance</span>
          <div className="text-sm font-extrabold truncate">{formatRupiah(totalFreelance)}</div>
        </div>
        <div className="border-2 border-border bg-violet-400/5 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] font-mono">
          <span className="text-[9px] font-bold text-muted-foreground uppercase">Part-Time</span>
          <div className="text-sm font-extrabold truncate">{formatRupiah(totalPartTime)}</div>
        </div>
        <div className="border-2 border-border bg-indigo-400/5 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] font-mono">
          <span className="text-[9px] font-bold text-muted-foreground uppercase">Magang / Intern</span>
          <div className="text-sm font-extrabold truncate">{formatRupiah(totalMagang)}</div>
        </div>
        <div className="border-2 border-border bg-amber-400/5 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] font-mono">
          <span className="text-[9px] font-bold text-muted-foreground uppercase">Bonus / Komisi</span>
          <div className="text-sm font-extrabold truncate">{formatRupiah(totalBonus)}</div>
        </div>
        <div className="border-2 border-border bg-emerald-400/10 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] font-mono col-span-2 md:col-span-1">
          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Total Akumulasi</span>
          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 truncate">{formatRupiah(totalAll)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 border-2 border-border p-3 bg-muted/20 font-mono text-xs">
        <button
          onClick={() => setSourceFilter("ALL")}
          className={`px-3 py-1.5 border font-bold uppercase transition-all cursor-pointer ${
            sourceFilter === "ALL" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted"
          }`}
        >
          Semua Sumber
        </button>
        {Object.entries(sourceLabels).map(([key, value]) => (
          <button
            key={key}
            onClick={() => setSourceFilter(key)}
            className={`px-3 py-1.5 border font-bold uppercase transition-all cursor-pointer ${
              sourceFilter === key ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {/* Table Section */}
      {filteredIncomes.length === 0 ? (
        <div className="border-2 border-dashed border-border p-12 text-center font-mono">
          <HugeiconsIcon icon={MoneySendIcon} className="size-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-extrabold uppercase text-sm mb-1">Log Pendapatan Kosong</h3>
          <p className="text-xs text-muted-foreground">Catat pendapatan manual pertama Anda atau lunasi tagihan invoice proyek.</p>
        </div>
      ) : (
        <div className="border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] overflow-x-auto">
          <table className="w-full font-mono text-xs text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-border bg-muted/30">
                <th className="p-3 font-bold uppercase">Tanggal</th>
                <th className="p-3 font-bold uppercase">Sumber</th>
                <th className="p-3 font-bold uppercase">Keterangan</th>
                <th className="p-3 font-bold uppercase text-right">Nominal</th>
                <th className="p-3 font-bold uppercase text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncomes.map((inc) => (
                <tr key={inc.id} className="border-b border-border hover:bg-muted/10">
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={Calendar01Icon} className="size-3.5 text-muted-foreground" />
                      {new Date(inc.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 border text-[8px] font-black uppercase ${sourceColors[inc.source] || "bg-slate-100 border-slate-300 text-slate-800"}`}>
                      {sourceLabels[inc.source] || inc.source}
                    </span>
                  </td>
                  <td className="p-3 max-w-xs truncate" title={inc.notes || ""}>
                    <span>{inc.notes || "-"}</span>
                    {inc.invoice && (
                      <span className="inline-flex items-center gap-0.5 ml-2 text-[8px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 px-1 font-bold">
                        <HugeiconsIcon icon={InvoiceIcon} className="size-2.5" />
                        {inc.invoice.invoiceNumber}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">{formatRupiah(inc.amount)}</td>
                  <td className="p-3 text-center">
                    {inc.invoiceId ? (
                      <span className="text-[10px] text-muted-foreground italic uppercase font-bold" title="Pendapatan dari pelunasan invoice tidak dapat dihapus manual">
                        Invoice Lunas
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDelete(inc.id)}
                        className="p-1 border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer transition-all"
                        title="Hapus Log Pendapatan"
                      >
                        <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- CREATE / MANUAL LOG MODAL --- */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="border-3 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-md font-mono">
            <div className="flex justify-between items-center border-b border-border/20 pb-2 mb-4">
              <h3 className="font-extrabold text-sm uppercase">➕ Catat Pendapatan Karier</h3>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Sumber Pendapatan *</label>
                <select
                  required
                  value={source}
                  onChange={(e) => setSource(e.target.value as any)}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                >
                  <option value="FREELANCE">Freelance</option>
                  <option value="PART_TIME">Part-Time / Kerja Sampingan</option>
                  <option value="MAGANG">Magang / Internship Berbayar</option>
                  <option value="BONUS">Bonus / Komisi Tambahan</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Nominal Pendapatan (Rp) *</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 1500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Tanggal Terima *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Keterangan / Catatan</label>
                <textarea
                  placeholder="Contoh: Honor asisten lab komputer bulan Mei..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 py-2.5 border-2 border-border bg-background hover:bg-muted font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 border-2 border-border bg-primary text-primary-foreground font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 hover:-translate-y-[1px] transition-all cursor-pointer"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Pendapatan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
