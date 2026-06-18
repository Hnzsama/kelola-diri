"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  InvoiceIcon,
  Add01Icon,
  Delete02Icon,
  Tick02Icon,
  Calendar01Icon,
  ArrowRight01Icon,
  Cancel01Icon
} from "@hugeicons/core-free-icons";

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
}

interface Project {
  id: string;
  name: string;
  contractValue: number;
  client: Client;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  project: Project;
}

function InvoicesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter Status
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create Invoice Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active printable invoice
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoicesAndProjects();
  }, []);

  // Handle URL printId parameter if any
  useEffect(() => {
    const printId = searchParams.get("printId");
    if (printId && invoices.length > 0) {
      const target = invoices.find((inv) => inv.id === printId);
      if (target) {
        setPrintInvoice(target);
      }
    }
  }, [searchParams, invoices]);

  const fetchInvoicesAndProjects = async () => {
    try {
      setIsLoading(true);
      const [invRes, projRes] = await Promise.all([
        fetch("/api/career/invoices"),
        fetch("/api/career/projects"),
      ]);

      if (!invRes.ok || !projRes.ok) throw new Error("Gagal mengambil data");

      const invData = await invRes.json();
      const projData = await projRes.json();

      setInvoices(invData);
      setProjects(projData);
    } catch {
      toast.error("Gagal memuat data invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !amount || !issuedDate || !dueDate) {
      toast.error("Kolom wajib harus diisi!");
      return;
    }

    const selectedProject = projects.find((p) => p.id === selectedProjectId);
    if (!selectedProject) {
      toast.error("Proyek tidak ditemukan");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/career/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          clientId: selectedProject.client.id,
          invoiceNumber: invoiceNumber.trim() || undefined,
          amount,
          issuedDate,
          dueDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Terjadi kesalahan");
      } else {
        toast.success("Invoice baru berhasil dibuat!");
        setIsAddOpen(false);
        setSelectedProjectId("");
        setInvoiceNumber("");
        setAmount("");
        setIssuedDate("");
        setDueDate("");
        fetchInvoicesAndProjects();
      }
    } catch {
      toast.error("Gagal menyimpan invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: Invoice["status"]) => {
    try {
      const res = await fetch(`/api/career/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal memperbarui invoice");
      } else {
        toast.success(data.success || "Invoice diperbarui!");
        fetchInvoicesAndProjects();
        if (printInvoice && printInvoice.id === id) {
          setPrintInvoice({ ...printInvoice, status });
        }
      }
    } catch {
      toast.error("Gagal memperbarui invoice");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus invoice ini?")) return;

    try {
      const res = await fetch(`/api/career/invoices/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Invoice berhasil dihapus");
        fetchInvoicesAndProjects();
      } else {
        toast.error("Gagal menghapus invoice");
      }
    } catch {
      toast.error("Gagal menghapus invoice");
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

  const triggerPrint = () => {
    window.print();
  };

  if (isLoading) return <DashboardSkeleton />;

  // Filter invoices list
  const filteredInvoices = statusFilter === "ALL" 
    ? invoices 
    : invoices.filter((inv) => inv.status === statusFilter);

  // If in print view mode, display the full printable sheet
  if (printInvoice) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8 font-mono print-container">
        {/* Print Styles injection */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            aside, header, nav, footer, .no-print {
              display: none !important;
            }
            body, main, .print-container {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              color: black !important;
              width: 100% !important;
            }
            .border-print {
              border-color: #000000 !important;
            }
          }
        `}} />

        {/* Action Controls for Screen View */}
        <div className="flex justify-between items-center no-print border-2 border-border p-4 bg-muted/20 mb-6">
          <button
            onClick={() => {
              setPrintInvoice(null);
              router.replace("/dashboard/career/invoices");
            }}
            className="px-4 py-2 border-2 border-border bg-background hover:bg-muted font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
          >
            ← Kembali
          </button>
          <div className="flex gap-3">
            {printInvoice.status !== "PAID" && (
              <button
                onClick={() => handleUpdateStatus(printInvoice.id, "PAID")}
                className="px-4 py-2 border-2 border-border bg-emerald-400 font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer text-black"
              >
                Tandai Lunas (PAID)
              </button>
            )}
            <button
              onClick={triggerPrint}
              className="px-5 py-2 border-2 border-border bg-yellow-400 font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer text-black"
            >
              Cetak Invoice
            </button>
          </div>
        </div>

        {/* A4 Paper Mockup Container */}
        <div id="printable-invoice" className="border-4 border-black bg-white text-black p-8 sm:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[297mm] flex flex-col justify-between border-print">
          <div className="space-y-8">
            {/* Header: Title and Status */}
            <div className="flex justify-between items-start border-b-4 border-black pb-6 border-print">
              <div>
                <h1 className="text-3xl font-extrabold uppercase tracking-tight">INVOICE</h1>
                <div className="text-sm font-bold mt-1 text-slate-600">{printInvoice.invoiceNumber}</div>
              </div>
              <div className="text-right">
                <div className={`inline-block px-3 py-1 border-2 border-black font-black uppercase text-xs ${
                  printInvoice.status === "PAID" ? "bg-emerald-100 text-emerald-800" :
                  printInvoice.status === "SENT" ? "bg-blue-100 text-blue-800" :
                  printInvoice.status === "OVERDUE" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-800"
                }`}>
                  {printInvoice.status}
                </div>
              </div>
            </div>

            {/* Billing Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div>
                <div className="font-extrabold uppercase text-[10px] text-slate-500 mb-1">DITERBITKAN OLEH:</div>
                <div className="font-bold text-sm">Freelancer Kelola Diri</div>
                <div>(Sistem Otomatis Student Worker OS)</div>
              </div>
              <div>
                <div className="font-extrabold uppercase text-[10px] text-slate-500 mb-1">DITAGIHKAN KEPADA:</div>
                <div className="font-bold text-sm">{printInvoice.project.client.name}</div>
                <div>{printInvoice.project.client.company}</div>
                <div>Email: {printInvoice.project.client.email}</div>
                <div>Telp: {printInvoice.project.client.phone}</div>
              </div>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-2 gap-6 border-y-2 border-black py-4 text-xs border-print">
              <div>
                <span className="font-bold uppercase text-[10px] text-slate-500 block">Tanggal Terbit</span>
                <span className="font-bold">
                  {new Date(printInvoice.issuedDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <div>
                <span className="font-bold uppercase text-[10px] text-slate-500 block">Jatuh Tempo</span>
                <span className="font-bold">
                  {new Date(printInvoice.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="space-y-4">
              <div className="font-bold uppercase text-[10px] text-slate-500">RINCIAN PROYEK:</div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-black border-print font-bold">
                    <th className="py-2">Deskripsi Layanan</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200 border-print">
                    <td className="py-4 font-bold">
                      {printInvoice.project.name}
                      <span className="block text-[10px] text-slate-500 font-normal mt-0.5">
                        Pengerjaan proyek freelance diselesaikan sesuai kesepakatan kontrak.
                      </span>
                    </td>
                    <td className="py-4 text-right font-bold">{formatRupiah(printInvoice.amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Total Block & Bank Account Details */}
          <div className="space-y-6 pt-12">
            <div className="flex justify-end text-right">
              <div className="border-2 border-black p-4 bg-muted/10 w-full sm:w-64 border-print">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">TOTAL TAGIHAN</span>
                <span className="text-xl font-extrabold">{formatRupiah(printInvoice.amount)}</span>
              </div>
            </div>

            <div className="border-t border-slate-300 pt-6 flex flex-col sm:flex-row justify-between gap-4 text-[10px] border-print">
              <div>
                <span className="font-bold uppercase block text-slate-500 mb-0.5">Informasi Pembayaran:</span>
                <span>Transfer Bank / E-Wallet via Rekening Terdaftar</span>
              </div>
              <div className="text-right sm:text-left">
                <span className="font-bold uppercase block text-slate-500 mb-0.5">Catatan:</span>
                <span>Terima kasih telah mempercayakan proyek Anda kepada kami!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Manajemen Invoice</h1>
          <p className="text-muted-foreground font-mono text-xs">
            Tebitkan tagihan profesional, kirim ke klien, dan verifikasi kelunasan pembayaran proyek.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0"
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          <span>Buat Invoice</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 border-2 border-border p-3 bg-muted/20 font-mono text-xs">
        {["ALL", "DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 border font-bold uppercase transition-all cursor-pointer ${
              statusFilter === status
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:bg-muted"
            }`}
          >
            {status === "ALL" ? "Semua Status" : status}
          </button>
        ))}
      </div>

      {/* Invoice List Table */}
      {filteredInvoices.length === 0 ? (
        <div className="border-2 border-dashed border-border p-12 text-center font-mono">
          <HugeiconsIcon icon={InvoiceIcon} className="size-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-extrabold uppercase text-sm mb-1">Invoice Tidak Ditemukan</h3>
          <p className="text-xs text-muted-foreground mb-6">Mulai buat invoice baru untuk melacak tagihan pembayaran.</p>
        </div>
      ) : (
        <div className="border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] overflow-x-auto">
          <table className="w-full font-mono text-xs text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b-2 border-border bg-muted/30">
                <th className="p-3 font-bold uppercase">No. Invoice</th>
                <th className="p-3 font-bold uppercase">Proyek & Klien</th>
                <th className="p-3 font-bold uppercase text-right">Nominal</th>
                <th className="p-3 font-bold uppercase">Jatuh Tempo</th>
                <th className="p-3 font-bold uppercase text-center">Status</th>
                <th className="p-3 font-bold uppercase text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => {
                const isPaid = inv.status === "PAID";
                return (
                  <tr key={inv.id} className="border-b border-border hover:bg-muted/10">
                    <td className="p-3 font-extrabold">{inv.invoiceNumber}</td>
                    <td className="p-3">
                      <div className="font-bold">{inv.project.name}</div>
                      <div className="text-[10px] text-muted-foreground">Klien: {inv.project.client.name} ({inv.project.client.company})</div>
                    </td>
                    <td className="p-3 text-right font-extrabold">{formatRupiah(inv.amount)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <HugeiconsIcon icon={Calendar01Icon} className="size-3.5 text-muted-foreground" />
                        {new Date(inv.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 border text-[8px] font-black uppercase ${
                        isPaid ? "bg-emerald-100 text-emerald-800 border-emerald-400" :
                        inv.status === "SENT" ? "bg-blue-100 text-blue-800 border-blue-400" :
                        inv.status === "OVERDUE" ? "bg-rose-100 text-rose-800 border-rose-400" : "bg-slate-100 text-slate-800 border-slate-400"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        {inv.status === "DRAFT" && (
                          <button
                            onClick={() => handleUpdateStatus(inv.id, "SENT")}
                            className="px-2 py-1 border border-border bg-blue-400 text-black hover:-translate-y-[1px] cursor-pointer font-bold text-[9px]"
                            title="Kirim ke Klien"
                          >
                            KIRIM
                          </button>
                        )}
                        {!isPaid && inv.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleUpdateStatus(inv.id, "PAID")}
                            className="px-2 py-1 border border-border bg-emerald-400 text-black hover:-translate-y-[1px] cursor-pointer font-bold text-[9px]"
                            title="Tandai Lunas"
                          >
                            LUNASI
                          </button>
                        )}
                        <button
                          onClick={() => setPrintInvoice(inv)}
                          className="px-2 py-1 border border-border bg-yellow-400 text-black hover:-translate-y-[1px] cursor-pointer font-bold text-[9px]"
                          title="Cetak & Cetak File A4"
                        >
                          CETAK
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-1 border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer"
                          title="Hapus Invoice"
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* --- CREATE INVOICE MODAL --- */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="border-3 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-md font-mono">
            <div className="flex justify-between items-center border-b border-border/20 pb-2 mb-4">
              <h3 className="font-extrabold text-sm uppercase">➕ Buat Invoice Baru</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-muted-foreground hover:text-foreground">
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                ⚠️ Anda harus memiliki proyek terdaftar terlebih dahulu untuk membuat invoice.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Pilih Proyek *</label>
                  <select
                    required
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                  >
                    <option value="">-- Pilih Proyek --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        💼 {p.name} (Klien: {p.client.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Nomor Invoice (Dibuat Otomatis Jika Kosong)</label>
                  <input
                    type="text"
                    placeholder="Contoh: INV-2026-0001"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Nominal Invoice (Rp) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 3500000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Tanggal Terbit *</label>
                    <input
                      type="date"
                      required
                      value={issuedDate}
                      onChange={(e) => setIssuedDate(e.target.value)}
                      className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Jatuh Tempo *</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="w-1/2 py-2.5 border-2 border-border bg-background hover:bg-muted font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-1/2 py-2.5 border-2 border-border bg-primary text-primary-foreground font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 hover:-translate-y-[1px] transition-all cursor-pointer"
                  >
                    {isSubmitting ? "Membuat..." : "Buat Invoice"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <InvoicesContent />
    </Suspense>
  );
}
