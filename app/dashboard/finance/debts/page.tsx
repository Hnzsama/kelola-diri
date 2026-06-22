"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { DatePicker } from "@/components/ui/date-picker";
import { CardGridSkeleton } from "@/components/ui/page-skeleton";

interface Debt {
  id: string;
  type: "DEBT" | "RECEIVABLE";
  contact: string;
  amount: number;
  purpose: string;
  dueDate: string;
  status: "PENDING" | "PAID";
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [type, setType] = useState<"DEBT" | "RECEIVABLE">("RECEIVABLE");
  const [contact, setContact] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "DEBT" | "RECEIVABLE">("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "PAID">("ALL");

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/finance/debts");
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      setDebts(data);
    } catch {
      toast.error("Gagal memuat data hutang & piutang");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!contact.trim()) {
      toast.error("Nama kontak wajib diisi");
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Nominal harus berupa angka positif");
      return;
    }
    if (!purpose.trim()) {
      toast.error("Keperluan wajib diisi");
      return;
    }
    if (!dueDate) {
      toast.error("Tanggal jatuh tempo wajib ditentukan");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/finance/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          contact: contact.trim(),
          amount: amountNum,
          purpose: purpose.trim(),
          dueDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mencatat");
        return;
      }

      toast.success("Catatan hutang/piutang berhasil disimpan!");
      setContact("");
      setAmount("");
      setPurpose("");
      setDueDate("");
      fetchDebts();
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePaid = async (debt: Debt) => {
    try {
      const newStatus = debt.status === "PAID" ? "PENDING" : "PAID";
      let paymentMethod = undefined;

      if (newStatus === "PAID") {
        const isNonTunai = window.confirm(
          `Pilih metode pelunasan:\n\n- Klik "OK" untuk NON-TUNAI\n- Klik "Batal" untuk TUNAI`
        );
        paymentMethod = isNonTunai ? "NON_TUNAI" : "TUNAI";
      }

      const res = await fetch(`/api/finance/debts/${debt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, paymentMethod }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memperbarui");
      }

      toast.success(
        newStatus === "PAID"
          ? "Catatan ditandai lunas! Transaksi otomatis tercatat."
          : "Status dikembalikan ke belum lunas."
      );
      fetchDebts();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan ini?")) return;

    try {
      const res = await fetch(`/api/finance/debts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("Catatan berhasil dihapus!");
      fetchDebts();
    } catch {
      toast.error("Gagal menghapus catatan");
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

  // Calculations
  const pendingReceivable = debts
    .filter((d) => d.type === "RECEIVABLE" && d.status === "PENDING")
    .reduce((sum, d) => sum + d.amount, 0);

  const pendingDebt = debts
    .filter((d) => d.type === "DEBT" && d.status === "PENDING")
    .reduce((sum, d) => sum + d.amount, 0);

  // Filtered list
  const filteredDebts = debts.filter((d) => {
    const matchType = filterType === "ALL" || d.type === filterType;
    const matchStatus = filterStatus === "ALL" || d.status === filterStatus;
    return matchType && matchStatus;
  });

  if (isLoading) return <CardGridSkeleton count={4} />;

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Hutang & Piutang</h1>
          <p className="text-muted-foreground font-mono text-xs">
            Lacak uang yang dipinjam atau dipinjamkan agar tidak lupa ditagih atau dibayar.
          </p>
        </div>
        <Link href="/dashboard/finance">
          <button className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] transition-all cursor-pointer">
            ← Kembali ke Dashboard
          </button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">📈 Total Piutang Aktif (Uangmu di Orang Lain)</span>
          <h2 className="text-3xl font-extrabold font-mono mt-2 text-emerald-600 dark:text-emerald-400">
            {formatRupiah(pendingReceivable)}
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-2">Budi dan teman-teman lainnya harus bayar ini.</p>
        </div>
        <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">📉 Total Hutang Aktif (Kewajiban Bayarmu)</span>
          <h2 className="text-3xl font-extrabold font-mono mt-2 text-rose-600 dark:text-rose-400">
            {formatRupiah(pendingDebt)}
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-2">Ingat dibayar sebelum jatuh tempo ya!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Form Column */}
        <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] lg:col-span-1">
          <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight border-b border-border/20 pb-3 mb-5">
            📝 Catat Baru
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Jenis Catatan</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("RECEIVABLE")}
                  className={`py-2 border-2 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    type === "RECEIVABLE"
                      ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-border bg-transparent text-muted-foreground"
                  }`}
                >
                  Piutang 📈
                </button>
                <button
                  type="button"
                  onClick={() => setType("DEBT")}
                  className={`py-2 border-2 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    type === "DEBT"
                      ? "border-rose-600 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                      : "border-border bg-transparent text-muted-foreground"
                  }`}
                >
                  Hutang 📉
                </button>
              </div>
            </div>

            <div>
              <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Nama Teman / Kontak</label>
              <input
                type="text"
                placeholder="Budi, Andi, dsb."
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Nominal (Rp)</label>
              <input
                type="number"
                placeholder="150000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Keperluan / Untuk</label>
              <input
                type="text"
                placeholder="Patungan Seminar, Tiket Kost, dsb."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Jatuh Tempo</label>
              <DatePicker value={dueDate} onChange={setDueDate} placeholder="Pilih tanggal" />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 border-2 border-border font-bold text-xs uppercase bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Catatan"}
            </button>
          </form>
        </div>

        {/* Right Table/List Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 border-2 border-border bg-card p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase text-[10px] text-muted-foreground">Jenis:</span>
              <select
                value={filterType}
                onChange={(e: any) => setFilterType(e.target.value)}
                className="border-2 border-border px-2 py-1 bg-background"
              >
                <option value="ALL">Semua</option>
                <option value="RECEIVABLE">Piutang</option>
                <option value="DEBT">Hutang</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase text-[10px] text-muted-foreground">Status:</span>
              <select
                value={filterStatus}
                onChange={(e: any) => setFilterStatus(e.target.value)}
                className="border-2 border-border px-2 py-1 bg-background"
              >
                <option value="ALL">Semua</option>
                <option value="PENDING">Belum Lunas</option>
                <option value="PAID">Lunas</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div className="space-y-4">
            {filteredDebts.length === 0 ? (
              <div className="border-2 border-dashed border-border p-8 text-center bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-sm text-muted-foreground font-mono">Belum ada catatan hutang/piutang yang sesuai filter.</p>
              </div>
            ) : (
              filteredDebts.map((item) => {
                const isDebt = item.type === "DEBT";
                const isPaid = item.status === "PAID";
                const dDate = new Date(item.dueDate);
                const isOverdue = !isPaid && dDate.getTime() < Date.now();

                return (
                  <div
                    key={item.id}
                    className={`border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      isPaid ? "opacity-75" : ""
                    }`}
                  >
                    <div className="space-y-1 font-mono">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 border text-[9px] font-bold uppercase tracking-wider ${
                            isDebt
                              ? "bg-rose-500/10 border-rose-400/30 text-rose-700 dark:text-rose-400"
                              : "bg-emerald-500/10 border-emerald-400/30 text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {isDebt ? "Hutang 📉" : "Piutang 📈"}
                        </span>
                        <span className="font-bold text-sm">{item.contact}</span>
                        {isOverdue && (
                          <span className="px-1.5 py-0.5 border border-red-500 text-[8px] bg-red-500/10 text-red-600 font-bold uppercase tracking-wider">
                            Lewat Tempo ⚠️
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-extrabold">{formatRupiah(item.amount)}</h4>
                      <p className="text-xs text-muted-foreground">Untuk: {item.purpose}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Jatuh Tempo: {dDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleTogglePaid(item)}
                        className={`px-3 py-1.5 border-2 border-border text-xs font-mono font-bold uppercase transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-y-[2px] ${
                          isPaid
                            ? "bg-muted text-muted-foreground shadow-none translate-y-[2px]"
                            : "bg-background hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        {isPaid ? "✓ Lunas" : "Tandai Lunas"}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-1.5 border-2 border-destructive text-destructive text-xs font-mono font-bold uppercase bg-transparent shadow-[2px_2px_0px_0px_rgba(239,68,68,1)] hover:-translate-y-[1px] active:translate-y-0 transition-all cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
