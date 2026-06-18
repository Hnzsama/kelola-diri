"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Briefcase01Icon,
  Calendar01Icon,
  Target02Icon,
  UserGroupIcon,
  Add01Icon,
  Delete02Icon,
  PencilEdit01Icon,
  Tick02Icon,
  PlusSignCircleIcon,
  Cancel01Icon
} from "@hugeicons/core-free-icons";

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
}

interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "TODO" | "DONE";
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
}

interface Project {
  id: string;
  name: string;
  description?: string;
  contractValue: number;
  startDate: string;
  endDate: string;
  status: "PLANNING" | "PROGRESS" | "REVISION" | "WAITING_FEEDBACK" | "COMPLETED" | "CANCELLED";
  client: Client;
  financialGoalId?: string;
  tasks: ProjectTask[];
  invoices: Invoice[];
}

interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Project Modal State
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editContractValue, setEditContractValue] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editStatus, setEditStatus] = useState<Project["status"]>("PLANNING");
  const [editGoalId, setEditGoalId] = useState("");
  const [isSavingProject, setIsSavingProject] = useState(false);

  // Add Task Modal State
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [isSavingTask, setIsSavingTask] = useState(false);

  // Add Invoice Modal State
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceIssuedDate, setInvoiceIssuedDate] = useState("");
  const [invoiceDueDate, setInvoiceDueDate] = useState("");
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);

  useEffect(() => {
    fetchProjectDetail();
    fetchGoals();
  }, [projectId]);

  const fetchProjectDetail = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/career/projects/${projectId}`);
      if (!res.ok) throw new Error("Gagal mengambil detail proyek");
      const data = await res.json();
      setProject(data);
    } catch {
      toast.error("Gagal memuat detail proyek");
      router.push("/dashboard/career/projects");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/finance/goals");
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (err) {
      console.error("Gagal memuat target tabungan", err);
    }
  };

  const handleOpenEditProject = () => {
    if (!project) return;
    setEditName(project.name);
    setEditDescription(project.description || "");
    setEditContractValue(project.contractValue.toString());
    setEditStartDate(project.startDate.substring(0, 10));
    setEditEndDate(project.endDate.substring(0, 10));
    setEditStatus(project.status);
    setEditGoalId(project.financialGoalId || "");
    setIsEditProjectOpen(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !editContractValue || !editStartDate || !editEndDate) {
      toast.error("Kolom wajib harus diisi!");
      return;
    }
    setIsSavingProject(true);
    try {
      const res = await fetch(`/api/career/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          contractValue: editContractValue,
          startDate: editStartDate,
          endDate: editEndDate,
          status: editStatus,
          financialGoalId: editGoalId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal memperbarui proyek");
      } else {
        toast.success("Proyek berhasil diperbarui");
        setIsEditProjectOpen(false);
        fetchProjectDetail();
      }
    } catch {
      toast.error("Gagal memperbarui proyek");
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus proyek ini? Seluruh data sub-tugas dan invoice terkait akan dihapus permanen!")) return;
    try {
      const res = await fetch(`/api/career/projects/${projectId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Proyek berhasil dihapus");
        router.push("/dashboard/career/projects");
      } else {
        toast.error("Gagal menghapus proyek");
      }
    } catch {
      toast.error("Gagal menghapus proyek");
    }
  };

  // --- Task Methods ---
  const handleToggleTaskStatus = async (task: ProjectTask) => {
    const newStatus = task.status === "TODO" ? "DONE" : "TODO";
    try {
      const res = await fetch(`/api/career/projects/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(newStatus === "DONE" ? "Tugas selesai! 🎉" : "Tugas diubah menjadi Todo");
        fetchProjectDetail();
      } else {
        toast.error("Gagal mengubah status tugas");
      }
    } catch {
      toast.error("Gagal mengubah status tugas");
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskDueDate) {
      toast.error("Judul tugas dan tenggat waktu wajib diisi");
      return;
    }
    setIsSavingTask(true);
    try {
      const res = await fetch(`/api/career/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          dueDate: taskDueDate,
          priority: taskPriority,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Tugas berhasil ditambahkan");
        setIsAddTaskOpen(false);
        setTaskTitle("");
        setTaskDescription("");
        setTaskDueDate("");
        setTaskPriority("MEDIUM");
        fetchProjectDetail();
      } else {
        toast.error(data.error || "Gagal membuat tugas");
      }
    } catch {
      toast.error("Gagal membuat tugas");
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tugas ini?")) return;
    try {
      const res = await fetch(`/api/career/projects/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Tugas berhasil dihapus");
        fetchProjectDetail();
      } else {
        toast.error("Gagal menghapus tugas");
      }
    } catch {
      toast.error("Gagal menghapus tugas");
    }
  };

  // --- Invoice Methods ---
  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceAmount || !invoiceIssuedDate || !invoiceDueDate) {
      toast.error("Nominal, tanggal terbit, dan jatuh tempo wajib diisi");
      return;
    }
    setIsSavingInvoice(true);
    try {
      const res = await fetch("/api/career/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          clientId: project?.client.id,
          invoiceNumber: invoiceNumber.trim() || undefined,
          amount: invoiceAmount,
          issuedDate: invoiceIssuedDate,
          dueDate: invoiceDueDate,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Invoice berhasil dibuat");
        setIsAddInvoiceOpen(false);
        setInvoiceNumber("");
        setInvoiceAmount("");
        setInvoiceIssuedDate("");
        setInvoiceDueDate("");
        fetchProjectDetail();
      } else {
        toast.error(data.error || "Gagal membuat invoice");
      }
    } catch {
      toast.error("Gagal membuat invoice");
    } finally {
      setIsSavingInvoice(false);
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, status: Invoice["status"]) => {
    try {
      const res = await fetch(`/api/career/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.success || `Status invoice diubah ke ${status}`);
        fetchProjectDetail();
      } else {
        toast.error(data.error || "Gagal mengubah status invoice");
      }
    } catch {
      toast.error("Gagal mengubah status invoice");
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus invoice ini?")) return;
    try {
      const res = await fetch(`/api/career/invoices/${invoiceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Invoice berhasil dihapus");
        fetchProjectDetail();
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

  if (isLoading) return <DashboardSkeleton />;
  if (!project) return null;

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter(t => t.status === "DONE").length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Status Colors Mapping
  const statusStyles = {
    PLANNING: "bg-slate-200 text-slate-800 border-slate-400",
    PROGRESS: "bg-cyan-100 text-cyan-800 border-cyan-400",
    REVISION: "bg-amber-100 text-amber-800 border-amber-400",
    WAITING_FEEDBACK: "bg-indigo-100 text-indigo-800 border-indigo-400",
    COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-400",
    CANCELLED: "bg-rose-100 text-rose-800 border-rose-400",
  };

  const priorityStyles = {
    LOW: "bg-emerald-100 text-emerald-800 border-emerald-300",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-300",
    HIGH: "bg-rose-100 text-rose-800 border-rose-300",
  };

  return (
    <div className="w-full px-4 lg:px-6 space-y-6">
      {/* Back & Title Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div className="space-y-1">
          <Link
            href="/dashboard/career/projects"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-mono font-bold uppercase transition-all mb-1"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
            Kembali ke Daftar Proyek
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight font-mono uppercase truncate max-w-[280px] sm:max-w-md md:max-w-lg">
              {project.name}
            </h1>
            <span className={`text-xs px-2.5 py-0.5 border uppercase font-black font-mono shrink-0 ${statusStyles[project.status]}`}>
              {project.status}
            </span>
          </div>
        </div>

        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleOpenEditProject}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-border font-bold text-xs uppercase bg-yellow-400 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] transition-all cursor-pointer"
          >
            <HugeiconsIcon icon={PencilEdit01Icon} className="size-3.5" />
            Edit Proyek
          </button>
          <button
            onClick={handleDeleteProject}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-rose-500 font-bold text-xs uppercase bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] transition-all cursor-pointer"
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
            Hapus
          </button>
        </div>
      </div>

      {/* Grid: 3 columns summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Client details */}
        <div className="border-2 border-border bg-violet-400/5 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-mono">
          <div className="flex items-center gap-2 mb-2 border-b border-border/20 pb-2">
            <HugeiconsIcon icon={UserGroupIcon} className="size-4 text-violet-600" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Klien Freelance</span>
          </div>
          <div className="font-extrabold text-base">{project.client.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{project.client.company}</div>
          <div className="text-[10px] text-muted-foreground mt-3 space-y-1 border-t border-border/10 pt-2">
            <div>✉ {project.client.email}</div>
            <div>📞 {project.client.phone}</div>
          </div>
        </div>

        {/* Card 2: Financial Stats */}
        <div className="border-2 border-border bg-emerald-400/5 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-mono">
          <div className="flex items-center gap-2 mb-2 border-b border-border/20 pb-2">
            <HugeiconsIcon icon={Briefcase01Icon} className="size-4 text-emerald-600" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Detail Kontrak</span>
          </div>
          <div className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400">{formatRupiah(project.contractValue)}</div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Mulai: {new Date(project.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
          </div>
          <div className="text-[10px] text-muted-foreground">
            Tenggat: {new Date(project.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>

        {/* Card 3: Goals and Progress */}
        <div className="border-2 border-border bg-cyan-400/5 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-mono flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 border-b border-border/20 pb-2">
              <HugeiconsIcon icon={Target02Icon} className="size-4 text-cyan-600" />
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Target Tabungan & Progress</span>
            </div>
            {project.financialGoalId ? (
              (() => {
                const targetGoal = goals.find(g => g.id === project.financialGoalId);
                return (
                  <div className="space-y-1">
                    <div className="text-xs font-bold truncate">🎯 {targetGoal ? targetGoal.title : "Target Tabungan"}</div>
                    {targetGoal && (
                      <div className="text-[9px] text-muted-foreground">
                        Terkumpul: {formatRupiah(targetGoal.currentAmount)} / {formatRupiah(targetGoal.targetAmount)}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <span className="text-[10px] text-muted-foreground italic">Tidak ditautkan ke target tabungan</span>
            )}
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-bold mb-1">
              <span>PROGRESS TUGAS</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-muted h-3.5 border-2 border-border relative">
              <div className="bg-cyan-400 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {project.description && (
        <div className="border-2 border-border bg-card p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-mono text-xs leading-relaxed">
          <span className="font-extrabold text-[10px] uppercase text-muted-foreground block mb-1">Deskripsi Proyek</span>
          <p className="whitespace-pre-line">{project.description}</p>
        </div>
      )}

      {/* Grid: Tasks & Invoices Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sub-tasks Checklist (Span 7) */}
        <div className="lg:col-span-7 border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-mono space-y-4">
          <div className="flex justify-between items-center border-b border-border/20 pb-3">
            <h3 className="font-extrabold text-sm uppercase">📋 Daftar Tugas Internal ({completedTasks}/{totalTasks})</h3>
            <button
              onClick={() => setIsAddTaskOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 border border-border bg-primary text-primary-foreground font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer"
            >
              <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
              Tugas Baru
            </button>
          </div>

          {project.tasks.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground italic">
              Belum ada tugas pengerjaan proyek. Buat tugas baru untuk melacak progres.
            </div>
          ) : (
            <div className="space-y-3.5">
              {project.tasks.map((task) => {
                const isDone = task.status === "DONE";
                const isOverdue = new Date(task.dueDate) < new Date() && !isDone;
                return (
                  <div
                    key={task.id}
                    className={`border-2 border-border p-3.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] flex items-center justify-between transition-all ${
                      isDone ? "bg-muted/10 opacity-70" : isOverdue ? "bg-rose-500/5 border-rose-500" : "bg-background"
                    }`}
                  >
                    <div className="flex items-start mr-3 min-w-0">
                      {/* Custom Box Checkbox */}
                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        className={`w-5 h-5 border-2 border-border flex items-center justify-center cursor-pointer mr-3.5 shrink-0 ${
                          isDone ? "bg-emerald-500 text-white border-emerald-600" : "bg-white text-transparent"
                        }`}
                      >
                        <HugeiconsIcon icon={Tick02Icon} className="size-3.5 font-bold" />
                      </button>
                      <div className="min-w-0">
                        <span className={`text-xs font-bold block truncate ${isDone ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </span>
                        {task.description && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className={`text-[8px] px-1.5 py-0.25 border font-black ${priorityStyles[task.priority]}`}>
                            {task.priority}
                          </span>
                          <span className={`text-[8px] flex items-center gap-1 font-bold ${isOverdue ? "text-rose-500 font-extrabold" : "text-muted-foreground"}`}>
                            <HugeiconsIcon icon={Calendar01Icon} className="size-2.5" />
                            {new Date(task.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer transition-all shrink-0"
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Invoice List (Span 5) */}
        <div className="lg:col-span-5 border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-mono space-y-4">
          <div className="flex justify-between items-center border-b border-border/20 pb-3">
            <h3 className="font-extrabold text-sm uppercase">🧾 Invoice Tagihan</h3>
            <button
              onClick={() => setIsAddInvoiceOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 border border-border bg-primary text-primary-foreground font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all cursor-pointer"
            >
              <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
              Invoice Baru
            </button>
          </div>

          {project.invoices.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground italic">
              Belum ada invoice diterbitkan untuk proyek ini.
            </div>
          ) : (
            <div className="space-y-4">
              {project.invoices.map((inv) => {
                const isPaid = inv.status === "PAID";
                return (
                  <div
                    key={inv.id}
                    className={`border-2 border-border p-3.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] space-y-2 bg-background`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-black block">{inv.invoiceNumber}</span>
                        <span className="text-[10px] text-muted-foreground">
                          Jatuh Tempo: {new Date(inv.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-foreground">{formatRupiah(inv.amount)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/10 text-[9px] font-bold">
                      <span className={`px-2 py-0.5 border uppercase text-[8px] font-black ${
                        isPaid ? "bg-emerald-100 text-emerald-800 border-emerald-400" :
                        inv.status === "SENT" ? "bg-blue-100 text-blue-800 border-blue-400" :
                        inv.status === "OVERDUE" ? "bg-rose-100 text-rose-800 border-rose-400" : "bg-slate-100 text-slate-800 border-slate-400"
                      }`}>
                        {inv.status}
                      </span>

                      <div className="flex gap-2">
                        {inv.status === "DRAFT" && (
                          <button
                            onClick={() => handleUpdateInvoiceStatus(inv.id, "SENT")}
                            className="px-2 py-1 border border-border bg-blue-400 text-black hover:-translate-y-[1px] cursor-pointer"
                          >
                            KIRIM
                          </button>
                        )}
                        {!isPaid && inv.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleUpdateInvoiceStatus(inv.id, "PAID")}
                            className="px-2 py-1 border border-border bg-emerald-400 text-black hover:-translate-y-[1px] cursor-pointer"
                          >
                            LUNASI
                          </button>
                        )}
                        <Link
                          href={`/dashboard/career/invoices?printId=${inv.id}`}
                          className="px-2 py-1 border border-border bg-yellow-400 text-black hover:-translate-y-[1px] cursor-pointer text-center"
                        >
                          CETAK
                        </Link>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1 border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer"
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- EDIT PROJECT MODAL --- */}
      {isEditProjectOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="border-3 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-md font-mono max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border/20 pb-2 mb-4">
              <h3 className="font-extrabold text-sm uppercase">📝 Edit Profil Proyek</h3>
              <button onClick={() => setIsEditProjectOpen(false)} className="text-muted-foreground hover:text-foreground">
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Nama Proyek *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Website e-Commerce v2"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Nilai Kontrak (Rp) *</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 12000000"
                  value={editContractValue}
                  onChange={(e) => setEditContractValue(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Mulai *</label>
                  <input
                    type="date"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Tenggat Selesai *</label>
                  <input
                    type="date"
                    required
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Status Proyek *</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Project["status"])}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                >
                  <option value="PLANNING">Planning (Perencanaan)</option>
                  <option value="PROGRESS">Progress (Pengerjaan)</option>
                  <option value="REVISION">Revision (Revisi Klien)</option>
                  <option value="WAITING_FEEDBACK">Waiting Feedback (Menunggu Feedback)</option>
                  <option value="COMPLETED">Completed (Selesai)</option>
                  <option value="CANCELLED">Cancelled (Batal)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Tautkan ke Target Tabungan (Opsional)</label>
                <select
                  value={editGoalId}
                  onChange={(e) => setEditGoalId(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                >
                  <option value="">-- Tidak Ada --</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>🎯 {g.title} ({formatRupiah(g.currentAmount)} / {formatRupiah(g.targetAmount)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Deskripsi Singkat</label>
                <textarea
                  placeholder="Detail mengenai ruang lingkup pengerjaan proyek..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProjectOpen(false)}
                  className="w-1/2 py-2.5 border-2 border-border bg-background hover:bg-muted font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingProject}
                  className="w-1/2 py-2.5 border-2 border-border bg-primary text-primary-foreground font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 hover:-translate-y-[1px] transition-all cursor-pointer"
                >
                  {isSavingProject ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD TASK MODAL --- */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="border-3 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-md font-mono">
            <div className="flex justify-between items-center border-b border-border/20 pb-2 mb-4">
              <h3 className="font-extrabold text-sm uppercase">➕ Tambah Sub-Tugas Baru</h3>
              <button onClick={() => setIsAddTaskOpen(false)} className="text-muted-foreground hover:text-foreground">
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Judul Tugas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Slicing Frontend Navbar"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Tenggat Waktu *</label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Prioritas *</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
                    className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                  >
                    <option value="LOW">Low (Rendah)</option>
                    <option value="MEDIUM">Medium (Sedang)</option>
                    <option value="HIGH">High (Tinggi)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Keterangan / Detail Tugas</label>
                <textarea
                  placeholder="Deskripsi tugas atau file terkait yang harus dikerjakan..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={3}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(false)}
                  className="w-1/2 py-2.5 border-2 border-border bg-background hover:bg-muted font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingTask}
                  className="w-1/2 py-2.5 border-2 border-border bg-primary text-primary-foreground font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 hover:-translate-y-[1px] transition-all cursor-pointer"
                >
                  {isSavingTask ? "Menambahkan..." : "Tambah Tugas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD INVOICE MODAL --- */}
      {isAddInvoiceOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="border-3 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-md font-mono">
            <div className="flex justify-between items-center border-b border-border/20 pb-2 mb-4">
              <h3 className="font-extrabold text-sm uppercase">➕ Buat Invoice Proyek</h3>
              <button onClick={() => setIsAddInvoiceOpen(false)} className="text-muted-foreground hover:text-foreground">
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddInvoice} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Nomor Invoice (Dibuat Otomatis Jika Kosong)</label>
                <input
                  type="text"
                  placeholder="Contoh: INV-2026-8901"
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
                  placeholder="Contoh: 5000000"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Tanggal Terbit *</label>
                  <input
                    type="date"
                    required
                    value={invoiceIssuedDate}
                    onChange={(e) => setInvoiceIssuedDate(e.target.value)}
                    className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Jatuh Tempo *</label>
                  <input
                    type="date"
                    required
                    value={invoiceDueDate}
                    onChange={(e) => setInvoiceDueDate(e.target.value)}
                    className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddInvoiceOpen(false)}
                  className="w-1/2 py-2.5 border-2 border-border bg-background hover:bg-muted font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingInvoice}
                  className="w-1/2 py-2.5 border-2 border-border bg-primary text-primary-foreground font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 hover:-translate-y-[1px] transition-all cursor-pointer"
                >
                  {isSavingInvoice ? "Membuat..." : "Buat Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
