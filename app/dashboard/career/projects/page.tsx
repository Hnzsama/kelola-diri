"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import Link from "next/link";
import { DatePicker } from "@/components/ui/date-picker";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete02Icon, PencilEdit01Icon, ArrowRight01Icon, Target02Icon, HelpCircleIcon } from "@hugeicons/core-free-icons";

interface Client {
  id: string;
  name: string;
  company: string;
}

interface ProjectTask {
  id: string;
  title: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  contractValue: number;
  startDate: string;
  endDate: string;
  status: string;
  clientId: string;
  financialGoalId?: string;
  client: Client;
  tasks: ProjectTask[];
}

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form States
  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("PLANNING");
  const [financialGoalId, setFinancialGoalId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View state: "kanban" or "list"
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [projectsRes, clientsRes, goalsRes] = await Promise.all([
        fetch("/api/career/projects"),
        fetch("/api/career/clients"),
        fetch("/api/finance/goals"),
      ]);

      if (!projectsRes.ok || !clientsRes.ok || !goalsRes.ok) throw new Error("Gagal");
      const [projectsData, clientsData, goalsData] = await Promise.all([
        projectsRes.json(),
        clientsRes.json(),
        goalsRes.json(),
      ]);

      setProjects(projectsData);
      setClients(clientsData);
      setGoals(goalsData);
    } catch {
      toast.error("Gagal memuat data proyek");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    if (clients.length === 0) {
      toast.warning("Silakan daftarkan klien terlebih dahulu sebelum membuat proyek!");
      return;
    }
    setEditId(null);
    setClientId(clients[0].id);
    setName("");
    setDescription("");
    setContractValue("");
    setStartDate("");
    setEndDate("");
    setStatus("PLANNING");
    setFinancialGoalId("");
    setIsOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditId(project.id);
    setClientId(project.clientId);
    setName(project.name);
    setDescription(project.description || "");
    setContractValue(String(project.contractValue));
    setStartDate(project.startDate.split("T")[0]);
    setEndDate(project.endDate.split("T")[0]);
    setStatus(project.status);
    setFinancialGoalId(project.financialGoalId || "");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !name || !contractValue || !startDate || !endDate) {
      toast.error("Kolom wajib harus diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editId ? `/api/career/projects/${editId}` : "/api/career/projects";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          name,
          description,
          contractValue,
          startDate,
          endDate,
          status,
          financialGoalId: financialGoalId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan proyek");
      } else {
        toast.success(editId ? "Proyek berhasil diperbarui!" : "Proyek berhasil dibuat!");
        setIsOpen(false);
        fetchData();
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus proyek ini? Semua invoice dan tugas di dalamnya akan ikut terhapus.")) return;

    try {
      const res = await fetch(`/api/career/projects/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menghapus proyek");
      } else {
        toast.success("Proyek berhasil dihapus");
        fetchData();
      }
    } catch {
      toast.error("Gagal menghapus proyek");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/career/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success("Status proyek berhasil diubah!");
      fetchData();
    } catch {
      toast.error("Gagal memperbarui status");
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

  // Kanban Columns
  const columns = [
    { id: "PLANNING", title: "📝 Planning", color: "bg-slate-100 border-slate-300 dark:bg-slate-900/30 dark:border-slate-800" },
    { id: "PROGRESS", title: "⚙️ Progress", color: "bg-cyan-50 border-cyan-300 dark:bg-cyan-950/20 dark:border-cyan-900" },
    { id: "WAITING_FEEDBACK", title: "💬 Feedback", color: "bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-900" },
    { id: "REVISION", title: "🎨 Revision", color: "bg-rose-50 border-rose-300 dark:bg-rose-950/20 dark:border-rose-900" },
    { id: "COMPLETED", title: "✅ Completed", color: "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900" },
  ];

  return (
    <div className="w-full px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Project Client</h1>
          <p className="text-muted-foreground font-mono text-xs">
            Kelola status pengerjaan proyek freelance, deadline pengerjaan, serta alokasi ke target tabungan.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* View Mode Switcher */}
          <div className="border-2 border-border flex shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-2 font-mono font-bold text-xs uppercase cursor-pointer ${
                viewMode === "kanban" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 font-mono font-bold text-xs uppercase cursor-pointer border-l-2 border-border ${
                viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              }`}
            >
              Daftar
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-5 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            <span>Proyek Baru</span>
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="border-2 border-dashed border-border p-12 text-center font-mono">
          <h3 className="font-extrabold uppercase text-sm mb-1">Belum Ada Proyek</h3>
          <p className="text-xs text-muted-foreground mb-6">Daftarkan proyek klien pertama Anda untuk mulai melacak pengerjaan.</p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 border-2 border-border bg-yellow-400 text-black font-bold text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] cursor-pointer"
          >
            Buat Proyek Pertama
          </button>
        </div>
      ) : viewMode === "kanban" ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const colProjects = projects.filter(p => p.status === col.id);
            return (
              <div key={col.id} className={`border-2 border-border p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] flex flex-col space-y-4 ${col.color} min-h-[450px]`}>
                <div className="border-b border-border/20 pb-2 flex justify-between items-center font-mono">
                  <h3 className="font-extrabold text-[11px] uppercase tracking-wide truncate max-w-[120px]">
                    {col.title}
                  </h3>
                  <span className="bg-background border border-border px-1.5 py-0.5 text-[9px] font-black">
                    {colProjects.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-1">
                  {colProjects.map((p) => {
                    const tasksCount = p.tasks.length;
                    const completedTasks = p.tasks.filter(t => t.status === "DONE").length;
                    const progressPct = tasksCount > 0 ? Math.round((completedTasks / tasksCount) * 100) : 0;
                    
                    return (
                      <div key={p.id} className="border-2 border-border bg-background p-3.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] font-mono hover:scale-[1.01] transition-transform space-y-2 relative">
                        <div>
                          <div className="text-[9px] text-muted-foreground uppercase font-black truncate">{p.client.company}</div>
                          <Link href={`/dashboard/career/projects/${p.id}`} className="font-extrabold text-xs hover:underline block truncate">
                            {p.name}
                          </Link>
                        </div>

                        <div className="text-[10px] font-extrabold text-cyan-600 dark:text-cyan-400">
                          {formatRupiah(p.contractValue)}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-0.5">
                          <div className="w-full bg-muted h-1.5 border border-border">
                            <div className="bg-primary h-full" style={{ width: `${progressPct}%` }} />
                          </div>
                          <div className="flex justify-between text-[7px] text-muted-foreground">
                            <span>Tasks: {completedTasks}/{tasksCount}</span>
                            <span>{progressPct}% Done</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[7px] border-t border-border/10 pt-2 mt-1">
                          <span className="text-rose-500 font-bold">
                            Dl: {new Date(p.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </span>
                          
                          {/* Goal Integration badge */}
                          {p.financialGoalId && (
                            <span className="text-emerald-500" title="Terintegrasi ke Goal Tabungan">
                              <HugeiconsIcon icon={Target02Icon} className="size-2.5 inline" /> Goal
                            </span>
                          )}
                        </div>

                        {/* Small Dropdown to Change Status fast */}
                        <div className="pt-1.5 border-t border-border/10 flex justify-between items-center gap-2">
                          <select
                            value={p.status}
                            onChange={(e) => handleUpdateStatus(p.id, e.target.value)}
                            className="bg-muted text-[8px] font-bold uppercase p-1 border border-border focus:outline-none w-2/3 cursor-pointer"
                          >
                            <option value="PLANNING">Planning</option>
                            <option value="PROGRESS">Progress</option>
                            <option value="WAITING_FEEDBACK">Feedback</option>
                            <option value="REVISION">Revision</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1 border border-border hover:bg-muted cursor-pointer"
                              title="Edit Proyek"
                            >
                              <HugeiconsIcon icon={PencilEdit01Icon} className="size-2.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1 border border-rose-500 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer"
                              title="Hapus Proyek"
                            >
                              <HugeiconsIcon icon={Delete02Icon} className="size-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* REGULAR LIST VIEW */
        <div className="border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-mono overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-border bg-muted/50 text-[10px] font-bold uppercase">
                <th className="p-4 border-r border-border">Nama Proyek</th>
                <th className="p-4 border-r border-border">Klien</th>
                <th className="p-4 border-r border-border">Nilai Kontrak</th>
                <th className="p-4 border-r border-border">Rentang Waktu</th>
                <th className="p-4 border-r border-border">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-border hover:bg-muted/20">
                  <td className="p-4 border-r border-border font-bold">
                    <Link href={`/dashboard/career/projects/${p.id}`} className="hover:underline flex items-center gap-1.5">
                      {p.name}
                      <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5 text-muted-foreground" />
                    </Link>
                  </td>
                  <td className="p-4 border-r border-border font-bold">
                    {p.client.name} <span className="text-[10px] text-muted-foreground block">({p.client.company})</span>
                  </td>
                  <td className="p-4 border-r border-border font-extrabold text-cyan-600 dark:text-cyan-400">
                    {formatRupiah(p.contractValue)}
                  </td>
                  <td className="p-4 border-r border-border">
                    {new Date(p.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - {new Date(p.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="p-4 border-r border-border font-bold uppercase">
                    <span className="bg-muted px-2 py-0.5 border border-border text-[10px]">{p.status}</span>
                  </td>
                  <td className="p-4 text-center space-x-2">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 border border-border bg-background hover:bg-muted text-foreground cursor-pointer inline-block"
                    >
                      <HugeiconsIcon icon={PencilEdit01Icon} className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 border border-rose-500 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer inline-block"
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CRUD DIALOG MODAL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="border-3 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-md font-mono relative max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-sm uppercase border-b border-border/20 pb-2 mb-4">
              {editId ? "📝 Edit Detail Proyek" : "➕ Buat Proyek Freelance Baru"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Pilih Klien *</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Nama Proyek *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Redesign Website PT Abadi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Deskripsi Proyek (Opsional)</label>
                <textarea
                  placeholder="Buat landing page responsif, 5 section, integrasi form kontak..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Nilai Kontrak Proyek (Rp) *</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 3500000"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Mulai *</label>
                  <DatePicker value={startDate} onChange={setStartDate} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Selesai (DL) *</label>
                  <DatePicker value={endDate} onChange={setEndDate} />
                </div>
              </div>

              {editId && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Status Proyek *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border-2 border-border bg-background p-2.5 font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                  >
                    <option value="PLANNING">Planning 📝</option>
                    <option value="PROGRESS">Progress ⚙️</option>
                    <option value="WAITING_FEEDBACK">Feedback 💬</option>
                    <option value="REVISION">Revision 🎨</option>
                    <option value="COMPLETED">Completed ✅</option>
                    <option value="CANCELLED">Cancelled ❌</option>
                  </select>
                </div>
              )}

              {/* Goal Integration selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1 flex items-center gap-1">
                  <span>🎯 Tautkan ke Goal Tabungan (Opsional)</span>
                </label>
                <select
                  value={financialGoalId}
                  onChange={(e) => setFinancialGoalId(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                >
                  <option value="">-- Tidak ditautkan --</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} (Target: {formatRupiah(g.targetAmount)})
                    </option>
                  ))}
                </select>
                <span className="block text-[8px] text-muted-foreground mt-1 leading-relaxed">
                  💡 Jika ditautkan, setiap kali pembayaran invoice dari proyek ini dilunasi (PAID), dana tabungan target akan otomatis bertambah secara real-time!
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 py-2.5 border-2 border-border bg-background text-foreground hover:bg-muted font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 border-2 border-border bg-primary text-primary-foreground font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-[1px] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Proyek"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
