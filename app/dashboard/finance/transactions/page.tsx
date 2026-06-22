"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-modal";
import { DatePicker } from "@/components/ui/date-picker";
import { TableSkeleton } from "@/components/ui/page-skeleton";

interface FinanceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  categoryId: string;
  category: FinanceCategory | null;
  date: string;
  description: string | null;
  paymentMethod: string;
}

const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

export default function TransactionsHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterType, setFilterType] = useState("ALL");

  // Edit states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editType, setEditType] = useState("EXPENSE");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("TUNAI");
  const [isSaving, setIsSaving] = useState(false);

  const { confirmModal, openConfirm } = useConfirm();

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
  }, [filterMonth, filterYear]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/finance/categories");
      if (!res.ok) throw new Error("Gagal mengambil kategori");
      const data = await res.json();
      setCategories(data);
    } catch {
      toast.error("Gagal memuat kategori");
    }
  };

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/finance/transactions?month=${filterMonth}&year=${filterYear}`);
      if (!res.ok) throw new Error("Gagal");
      const data = await res.json();
      setTransactions(data);
    } catch {
      toast.error("Gagal memuat riwayat transaksi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const ok = await openConfirm({
      title: "Hapus Transaksi",
      message: "Apakah Anda yakin ingin menghapus catatan transaksi ini?",
      variant: "danger",
    });

    if (!ok) return;

    try {
      const res = await fetch(`/api/finance/transactions/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menghapus transaksi");
        return;
      }
      toast.success("Transaksi berhasil dihapus");
      fetchTransactions();
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditType(tx.type);
    setEditAmount(String(tx.amount));
    setEditCategory(tx.categoryId);
    setEditDate(tx.date.split("T")[0]);
    setEditDescription(tx.description || "");
    setEditPaymentMethod(tx.paymentMethod || "TUNAI");
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    const amountNum = parseFloat(editAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Nominal transaksi tidak valid");
      return;
    }

    if (!editCategory) {
      toast.error("Kategori transaksi wajib diisi");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/finance/transactions/${editingTx.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editType,
          amount: amountNum,
          categoryId: editCategory,
          date: editDate,
          description: editDescription,
          paymentMethod: editPaymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mengubah transaksi");
        return;
      }

      toast.success("Transaksi berhasil diperbarui!");
      setIsEditOpen(false);
      setEditingTx(null);
      fetchTransactions();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSaving(false);
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

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === "ALL") return true;
    return t.type === filterType;
  });

  return (
    <div className="w-full px-4 lg:px-6">
      {confirmModal}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Riwayat Transaksi</h1>
        <p className="text-muted-foreground font-mono text-xs">
          Pantau seluruh arus pemasukan dan pengeluaran Anda dari bulan ke bulan.
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="border-2 border-border bg-card p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] mb-6 flex flex-wrap gap-4 items-center">
        <span className="font-mono font-bold text-xs uppercase text-muted-foreground">Filter Bulan & Tipe:</span>
        <div className="flex flex-wrap gap-3">
          {/* Month Selector */}
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
            className="border-2 border-border bg-background p-2 font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="border-2 border-border bg-background p-2 font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
          >
            {[2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Type Selector */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border-2 border-border bg-background p-2 font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
          >
            <option value="ALL">Semua Transaksi</option>
            <option value="INCOME">Pemasukan (Income)</option>
            <option value="EXPENSE">Pengeluaran (Expense)</option>
          </select>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      {isLoading ? (
        <TableSkeleton />
      ) : filteredTransactions.length === 0 ? (
        <div className="border-2 border-dashed border-border p-12 text-center bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <p className="text-sm font-mono text-muted-foreground uppercase">Tidak ada catatan transaksi untuk periode ini.</p>
        </div>
      ) : (
        <div className="border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] overflow-x-auto mb-8">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-border bg-muted/30">
                <th className="p-3.5 font-extrabold uppercase">Tanggal</th>
                <th className="p-3.5 font-extrabold uppercase">Kategori</th>
                <th className="p-3.5 font-extrabold uppercase">Keterangan</th>
                <th className="p-3.5 font-extrabold uppercase">Metode</th>
                <th className="p-3.5 font-extrabold uppercase">Tipe</th>
                <th className="p-3.5 font-extrabold uppercase">Nominal</th>
                <th className="p-3.5 font-extrabold uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredTransactions.map((tx) => {
                const dateObj = new Date(tx.date);
                const cat = tx.category || { name: "Lainnya", icon: "💰", color: "bg-muted text-muted-foreground border-border/30" };
                const isIncome = tx.type === "INCOME";

                return (
                  <tr key={tx.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-3.5">
                      {dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-block font-mono text-[9px] px-1.5 py-0.5 border font-bold uppercase ${cat.color}`}>
                        {cat.icon} {cat.name}
                      </span>
                    </td>
                    <td className="p-3.5 truncate max-w-[200px]" title={tx.description || ""}>
                      {tx.description || "—"}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-1.5 py-0.5 border text-[9px] font-bold uppercase tracking-wider ${tx.paymentMethod === "NON_TUNAI" ? "bg-teal-500/10 border-teal-400/30 text-teal-700 dark:text-teal-400" : "bg-amber-500/10 border-amber-400/30 text-amber-700 dark:text-amber-400"}`}>
                        {tx.paymentMethod === "NON_TUNAI" ? "Non-Tunai 💳" : "Tunai 💵"}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`font-bold ${isIncome ? "text-emerald-600" : "text-rose-600"}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`p-3.5 font-bold ${isIncome ? "text-emerald-600" : "text-foreground"}`}>
                      {isIncome ? "+" : "-"} {formatRupiah(tx.amount)}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(tx)}
                        className="px-2 py-1 border border-border bg-background hover:bg-muted font-bold text-[9px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        Ubah ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="px-2 py-1 border border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20 font-bold text-[9px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        Hapus 🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="w-full max-w-sm border-2 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] max-h-[90vh] overflow-y-auto">
            <h3 className="font-mono font-extrabold text-base uppercase border-b-2 border-border pb-3 mb-4">
              ✏️ Ubah Transaksi
            </h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Type Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditType("EXPENSE")}
                  className={`py-2 border-2 border-border font-bold font-mono text-xs uppercase transition-all cursor-pointer ${
                    editType === "EXPENSE"
                      ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-rose-500"
                      : "bg-background hover:bg-muted text-foreground"
                  }`}
                >
                  Expense ⛽
                </button>
                <button
                  type="button"
                  onClick={() => setEditType("INCOME")}
                  className={`py-2 border-2 border-border font-bold font-mono text-xs uppercase transition-all cursor-pointer ${
                    editType === "INCOME"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-emerald-500"
                      : "bg-background hover:bg-muted text-foreground"
                  }`}
                >
                  Income 💰
                </button>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Metode Uang</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditPaymentMethod("TUNAI")}
                    className={`py-2 border-2 border-border font-bold font-mono text-xs uppercase transition-all cursor-pointer ${
                      editPaymentMethod === "TUNAI"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-amber-500"
                        : "bg-background hover:bg-muted text-foreground"
                    }`}
                  >
                    💵 Tunai
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPaymentMethod("NON_TUNAI")}
                    className={`py-2 border-2 border-border font-bold font-mono text-xs uppercase transition-all cursor-pointer ${
                      editPaymentMethod === "NON_TUNAI"
                        ? "bg-teal-500/10 text-teal-700 dark:text-teal-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-teal-500"
                        : "bg-background hover:bg-muted text-foreground"
                    }`}
                  >
                    💳 Non-Tunai
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 15000"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Kategori</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                >
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.icon} {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Tanggal</label>
                <DatePicker value={editDate} onChange={setEditDate} />
              </div>

              {/* Description */}
              <div>
                <label className="block font-mono font-bold text-[10px] uppercase text-muted-foreground mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  placeholder="Makan siang..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                />
              </div>

              {/* Form buttons */}
              <div className="flex gap-3 pt-3 border-t border-border/20">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); setEditingTx(null); }}
                  className="flex-1 py-2.5 border-2 border-border bg-background text-foreground font-bold font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 border-2 border-border bg-primary text-primary-foreground font-bold font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer"
                >
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
