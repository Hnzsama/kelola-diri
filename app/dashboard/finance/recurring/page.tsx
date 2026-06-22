"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { CardGridSkeleton } from "@/components/ui/page-skeleton";

interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  isActive: boolean;
  isPaidThisMonth?: boolean;
}

export default function RecurringBillsPage() {
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/finance/recurring");
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      setBills(data);
    } catch {
      toast.error("Gagal memuat data tagihan berulang");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    const dayNum = parseInt(dueDay);

    if (!name.trim()) {
      toast.error("Nama tagihan wajib diisi");
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Nominal tagihan harus berupa angka positif");
      return;
    }
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      toast.error("Tanggal jatuh tempo bulanan harus antara 1-31");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/finance/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          amount: amountNum,
          dueDay: dayNum,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan");
        return;
      }

      toast.success("Tagihan berulang berhasil disimpan!");
      setName("");
      setAmount("");
      setDueDay("");
      fetchBills();
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePay = async (bill: RecurringBill) => {
    try {
      const res = await fetch(`/api/finance/recurring/${bill.id}/pay`, {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mencatat pembayaran");
      }

      toast.success(`Berhasil membayar tagihan ${bill.name}! Transaksi dicatat otomatis.`);
      fetchBills();
    } catch (error: any) {
      toast.error(error.message || "Gagal mencatat pembayaran");
    }
  };

  const handleToggleActive = async (bill: RecurringBill) => {
    try {
      const res = await fetch(`/api/finance/recurring/${bill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !bill.isActive }),
      });

      if (!res.ok) throw new Error("Gagal merubah status");
      toast.success(bill.isActive ? "Tagihan dinonaktifkan." : "Tagihan diaktifkan kembali.");
      fetchBills();
    } catch {
      toast.error("Gagal merubah status keaktifan");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tagihan berulang ini?")) return;

    try {
      const res = await fetch(`/api/finance/recurring/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("Tagihan berulang berhasil dihapus!");
      fetchBills();
    } catch {
      toast.error("Gagal menghapus tagihan");
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

  const totalMonthlyBills = bills
    .filter((b) => b.isActive)
    .reduce((sum, b) => sum + b.amount, 0);

  if (isLoading) return <CardGridSkeleton count={4} />;

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Tagihan Berulang</h1>
          <p className="text-muted-foreground font-mono text-xs">
            Kelola tagihan langganan bulanan (Spotify, ChatGPT, VPS, kost, dll.) dan bayar tepat waktu.
          </p>
        </div>
        <Link href="/dashboard/finance">
          <button className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] transition-all cursor-pointer">
            ← Kembali ke Dashboard
          </button>
        </Link>
      </div>

      {/* Summary Card */}
      <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] mb-8 max-w-md">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">⚡ Total Komitmen Pengeluaran Bulanan</span>
        <h2 className="text-3xl font-extrabold font-mono mt-2 text-purple-600 dark:text-purple-400">
          {formatRupiah(totalMonthlyBills)}
        </h2>
        <p className="text-xs text-muted-foreground font-mono mt-2">Akumulasi tagihan langganan aktif Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form Column */}
        <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] lg:col-span-1">
          <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight border-b border-border/20 pb-3 mb-5">
            ➕ Daftarkan Langganan
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Nama Layanan</label>
              <input
                type="text"
                placeholder="Spotify, ChatGPT, VPS, Kost, dsb."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Nominal (Rp)</label>
              <input
                type="number"
                placeholder="54990"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Tanggal Jatuh Tempo Bulanan (1-31)</label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="20"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 border-2 border-border font-bold text-xs uppercase bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Mendaftarkan..." : "Daftarkan Tagihan"}
            </button>
          </form>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bills.length === 0 ? (
              <div className="border-2 border-dashed border-border p-8 text-center bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:col-span-2">
                <p className="text-sm text-muted-foreground font-mono">Belum ada tagihan berulang yang didaftarkan.</p>
              </div>
            ) : (
              bills.map((bill) => {
                const isNotificationNear = Math.abs(bill.dueDay - new Date().getDate()) <= 3;

                return (
                  <div
                    key={bill.id}
                    className={`border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between gap-4 transition-all ${
                      !bill.isActive ? "opacity-60" : ""
                    }`}
                  >
                    <div className="font-mono">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-base truncate pr-2">{bill.name}</span>
                        <div className="flex gap-2">
                          {isNotificationNear && bill.isActive && (
                            <span className="px-1.5 py-0.5 border border-amber-500 text-[8px] bg-amber-500/10 text-amber-600 font-bold uppercase tracking-wider">
                              Segera Hadir ⏳
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 border text-[8px] font-bold uppercase tracking-wider ${
                              bill.isActive
                                ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-700 dark:text-emerald-400"
                                : "bg-muted border-border/50 text-muted-foreground"
                            }`}
                          >
                            {bill.isActive ? "Aktif" : "Mati"}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-xl font-extrabold">{formatRupiah(bill.amount)}</h4>
                      <p className="text-[10px] text-muted-foreground mt-2">Tagihan Tanggal {bill.dueDay} tiap bulan</p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border/10">
                      <button
                        onClick={() => handlePay(bill)}
                        disabled={!bill.isActive || bill.isPaidThisMonth}
                        className="px-2.5 py-1.5 border-2 border-border text-[10px] font-mono font-bold uppercase bg-background shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {bill.isPaidThisMonth ? "Sudah Dibayar ✓" : "Bayar 💳"}
                      </button>
                      <button
                        onClick={() => handleToggleActive(bill)}
                        className={`px-2.5 py-1.5 border-2 border-border text-[10px] font-mono font-bold uppercase transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-y-0 ${
                          bill.isActive ? "bg-muted/30" : "bg-emerald-500/10 text-emerald-600 border-emerald-500"
                        }`}
                      >
                        {bill.isActive ? "Matikan" : "Aktifkan"}
                      </button>
                      <button
                        onClick={() => handleDelete(bill.id)}
                        className="px-2.5 py-1.5 border-2 border-destructive text-destructive text-[10px] font-mono font-bold uppercase bg-transparent shadow-[1px_1px_0px_0px_rgba(239,68,68,1)] hover:-translate-y-[1px] active:translate-y-0 transition-all cursor-pointer ml-auto"
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
