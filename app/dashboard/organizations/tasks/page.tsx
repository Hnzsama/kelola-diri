"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { useConfirm } from "@/components/ui/confirm-modal";

interface OrgEvent {
  id: string;
  title: string;
  organization: { id: string; name: string; logoIcon: string };
}

interface OrgTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  event: {
    id: string;
    title: string;
    organization: { id: string; name: string; logoIcon: string };
  } | null;
}

const STATUS_COLUMNS = [
  { key: "TODO",         label: "Belum Dikerjakan", icon: "⬜", color: "border-muted-foreground/40",  bg: "bg-muted/20",        dropBg: "bg-muted/40",        activeBg: "bg-blue-500/5 border-blue-400" },
  { key: "IN_PROGRESS",  label: "Sedang Dikerjakan", icon: "🔄", color: "border-amber-500/50",          bg: "bg-amber-500/5",     dropBg: "bg-amber-500/15",    activeBg: "bg-amber-500/10 border-amber-400" },
  { key: "DONE",         label: "Selesai",            icon: "✅", color: "border-emerald-500/50",        bg: "bg-emerald-500/5",   dropBg: "bg-emerald-500/15",  activeBg: "bg-emerald-500/10 border-emerald-400" },
];

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  HIGH:   { label: "Tinggi",  color: "text-rose-600 dark:text-rose-400 border-rose-400/30 bg-rose-500/10" },
  MEDIUM: { label: "Sedang",  color: "text-amber-600 dark:text-amber-400 border-amber-400/30 bg-amber-500/10" },
  LOW:    { label: "Rendah",  color: "text-emerald-600 dark:text-emerald-400 border-emerald-400/30 bg-emerald-500/10" },
};

const REF_DATE = new Date("2026-06-14");

// ─── Draggable Task Card ─────────────────────────────────────────────────────

function TaskCard({
  task,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  task: OrgTask;
  onEdit: (t: OrgTask) => void;
  onDelete: (t: OrgTask) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const pMeta = PRIORITY_META[task.priority] || PRIORITY_META.MEDIUM;
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = due && due < REF_DATE && task.status !== "DONE";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id);
        // Tiny delay so the element has time to render "ghost" correctly
        setTimeout(() => onDragStart(task.id), 0);
      }}
      onDragEnd={onDragEnd}
      className={`
        border-2 border-border bg-background p-3 select-none
        cursor-grab active:cursor-grabbing
        transition-all duration-150
        shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]
        ${isDragging
          ? "opacity-40 scale-[0.97] shadow-none rotate-1"
          : "hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
        }
      `}
    >
      {/* Drag handle indicator */}
      <div className="flex items-start gap-1.5 mb-1.5">
        <div className="flex flex-col gap-0.5 mt-0.5 shrink-0 opacity-30">
          <span className="block w-3 h-0.5 bg-current" />
          <span className="block w-3 h-0.5 bg-current" />
          <span className="block w-3 h-0.5 bg-current" />
        </div>
        <div className="flex items-start justify-between gap-1 flex-1 min-w-0">
          <h4 className="font-mono font-bold text-xs uppercase leading-tight">{task.title}</h4>
          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 border uppercase shrink-0 ${pMeta.color}`}>
            {pMeta.label}
          </span>
        </div>
      </div>

      {task.event && (
        <p className="text-[10px] text-muted-foreground font-mono mb-1.5 truncate pl-4">
          {task.event.organization.logoIcon} {task.event.title}
        </p>
      )}
      {task.description && (
        <p className="text-[10px] text-muted-foreground mb-1.5 leading-snug pl-4">{task.description}</p>
      )}
      {due && (
        <p className={`text-[10px] font-mono font-bold mb-2 pl-4 ${isOverdue ? "text-rose-600" : "text-muted-foreground"}`}>
          {isOverdue ? "❗ " : "📅 "}
          {due.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
        </p>
      )}

      <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border/20">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          className="text-[9px] font-mono font-bold px-1.5 py-0.5 border border-border uppercase hover:bg-muted transition-colors"
        >
          Edit
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task); }}
          className="text-[9px] font-mono font-bold px-1.5 py-0.5 border border-destructive uppercase bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Kanban Column ───────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  tasks,
  draggingId,
  onDrop,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
}: {
  col: typeof STATUS_COLUMNS[number];
  tasks: OrgTask[];
  draggingId: string | null;
  onDrop: (taskId: string, newStatus: string) => void;
  onEdit: (t: OrgTask) => void;
  onDelete: (t: OrgTask) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}) {
  const [isOver, setIsOver] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsOver(true);
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) setIsOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsOver(false);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) onDrop(taskId, col.key);
  };

  return (
    <div
      className={`border-2 transition-all duration-150 bg-card
        ${isOver && draggingId
          ? `${col.activeBg} shadow-[0px_0px_0px_2px_rgba(0,0,0,0.3)] scale-[1.01]`
          : `border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]`
        }
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className={`px-4 py-3 border-b-2 border-border ${col.bg} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span>{col.icon}</span>
          <h3 className="font-mono font-extrabold text-xs uppercase tracking-wider">{col.label}</h3>
        </div>
        <span className="font-mono font-bold text-xs bg-background border border-border px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        className={`p-3 space-y-3 min-h-[140px] transition-all duration-150 ${
          isOver && draggingId ? col.dropBg : ""
        }`}
      >
        {/* Empty drop hint */}
        {tasks.length === 0 && (
          <div className={`border-2 border-dashed flex items-center justify-center h-20 transition-colors ${
            isOver && draggingId ? "border-primary text-primary" : "border-border/30 text-muted-foreground"
          }`}>
            <p className="text-[11px] font-mono italic">
              {isOver && draggingId ? "Lepas di sini ↓" : "Kosong"}
            </p>
          </div>
        )}

        {/* Task cards */}
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            isDragging={draggingId === task.id}
            onEdit={onEdit}
            onDelete={onDelete}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}

        {/* Non-empty drop hint */}
        {tasks.length > 0 && isOver && draggingId && (
          <div className="border-2 border-dashed border-primary/50 flex items-center justify-center h-12 text-primary">
            <p className="text-[10px] font-mono font-bold uppercase">Lepas di sini</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function OrgTasksPage() {
  const [tasks, setTasks] = useState<OrgTask[]>([]);
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTask, setEditingTask] = useState<OrgTask | null>(null);

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const { confirmModal, openConfirm } = useConfirm();

  // Form
  const [fTitle, setFTitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fDueDate, setFDueDate] = useState("");
  const [fPriority, setFPriority] = useState("MEDIUM");
  const [fStatus, setFStatus] = useState("TODO");
  const [fEventId, setFEventId] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      const [tRes, eRes] = await Promise.all([
        fetch("/api/organizations/tasks"),
        fetch("/api/organizations/events"),
      ]);
      const [tData, eData] = await Promise.all([tRes.json(), eRes.json()]);
      setTasks(tData);
      setEvents(eData.filter((e: any) => !e.isArchived));
    } catch { toast.error("Gagal memuat tugas kepanitiaan"); }
    finally { setIsLoading(false); }
  };

  const resetForm = () => {
    setEditingTask(null); setIsFormOpen(false);
    setFTitle(""); setFDesc(""); setFDueDate("");
    setFPriority("MEDIUM"); setFStatus("TODO"); setFEventId("");
  };

  const handleEditClick = (task: OrgTask) => {
    setEditingTask(task);
    setFTitle(task.title); setFDesc(task.description || "");
    setFDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    setFPriority(task.priority); setFStatus(task.status);
    setFEventId(task.event?.id || "");
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fTitle.trim()) { toast.error("Judul tugas wajib diisi"); return; }
    setIsSaving(true);
    try {
      const url = editingTask ? `/api/organizations/tasks/${editingTask.id}` : "/api/organizations/tasks";
      const method = editingTask ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: fTitle, description: fDesc || null, dueDate: fDueDate || null, priority: fPriority, status: fStatus, eventId: fEventId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editingTask ? "Tugas diperbarui!" : "Tugas berhasil ditambahkan!");
      resetForm(); fetchAll();
    } catch (e: any) { toast.error(e.message || "Gagal"); }
    finally { setIsSaving(false); }
  };

  const handleStatusChange = async (task: OrgTask, newStatus: string) => {
    if (task.status === newStatus) return;
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    try {
      const res = await fetch(`/api/organizations/tasks/${task.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Gagal");
    } catch {
      toast.error("Gagal update status");
      fetchAll(); // rollback
    }
  };

  const handleDrop = (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Status label untuk toast
    const colLabel = STATUS_COLUMNS.find(c => c.key === newStatus)?.label || newStatus;
    toast.success(`Dipindah ke "${colLabel}"`);
    handleStatusChange(task, newStatus);
  };

  const handleDelete = async (task: OrgTask) => {
    const ok = await openConfirm({
      title: "Hapus Tugas",
      message: `Hapus tugas "${task.title}"?\n\nTugas ini akan dihapus permanen.`,
      confirmLabel: "Ya, Hapus",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/organizations/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal");
      toast.success("Tugas dihapus"); fetchAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

  if (isLoading) return <div className="flex h-[50vh] items-center justify-center text-muted-foreground font-mono">Memuat tugas kepanitiaan...</div>;

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Confirm Modal */}
      {confirmModal}

      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Tugas Kepanitiaan</h1>
          <p className="text-muted-foreground">
            Kelola tugas panitia — <span className="font-semibold">drag & drop</span> kartu untuk pindah status.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex border-2 border-border overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            {(["kanban", "table"] as const).map((m) => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`px-4 py-2 font-bold text-xs uppercase font-mono transition-colors ${viewMode === m ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"}`}>
                {m === "kanban" ? "🗂️ Kanban" : "📋 Tabel"}
              </button>
            ))}
          </div>
          <button onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }}
            className="flex items-center gap-2 px-5 py-2 border-2 border-border font-bold text-sm uppercase bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Tambah Tugas
          </button>
        </div>
      </div>

      {/* FORM */}
      {isFormOpen && (
        <div className="mb-8 border-2 border-border bg-card p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
          <h2 className="text-xl font-bold uppercase font-mono mb-4">{editingTask ? "Edit Tugas" : "Tambah Tugas Baru"}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <Field className="md:col-span-2">
              <FieldLabel>Judul Tugas *</FieldLabel>
              <Input placeholder="Contoh: Desain Poster Seminar" value={fTitle} onChange={e => setFTitle(e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel>Kegiatan Terkait</FieldLabel>
              <select value={fEventId} onChange={e => setFEventId(e.target.value)} className="flex h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-hidden">
                <option value="">— Tidak Terkait Event —</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.organization.logoIcon} {ev.title}</option>)}
              </select>
            </Field>
            <Field>
              <FieldLabel>Deadline</FieldLabel>
              <Input type="date" value={fDueDate} onChange={e => setFDueDate(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Prioritas</FieldLabel>
              <select value={fPriority} onChange={e => setFPriority(e.target.value)} className="flex h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-hidden">
                <option value="HIGH">🔴 Tinggi</option>
                <option value="MEDIUM">🟡 Sedang</option>
                <option value="LOW">🟢 Rendah</option>
              </select>
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="flex h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-hidden">
                <option value="TODO">Belum Dikerjakan</option>
                <option value="IN_PROGRESS">Sedang Dikerjakan</option>
                <option value="DONE">Selesai</option>
              </select>
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel>Deskripsi</FieldLabel>
              <Input placeholder="Detail tugas..." value={fDesc} onChange={e => setFDesc(e.target.value)} />
            </Field>
            <div className="md:col-span-2 flex gap-3 pt-2">
              <Button type="submit" disabled={isSaving} className="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                {isSaving ? "Menyimpan..." : editingTask ? "Update" : "Simpan"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">Batal</Button>
            </div>
          </form>
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === "kanban" && (
        <>
          {/* Drag hint */}
          {tasks.length > 0 && !draggingId && (
            <div className="mb-4 flex items-center gap-2 text-[11px] text-muted-foreground font-mono border border-border/30 px-3 py-2 bg-muted/20 w-fit">
              <span>⟺</span>
              <span>Seret kartu ke kolom lain untuk mengubah status</span>
            </div>
          )}
          {draggingId && (
            <div className="mb-4 flex items-center gap-2 text-[11px] font-mono font-bold border border-primary/40 px-3 py-2 bg-primary/5 text-primary w-fit animate-pulse">
              <span>↓</span>
              <span>Lepas ke kolom tujuan...</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 items-start">
            {STATUS_COLUMNS.map(col => (
              <KanbanColumn
                key={col.key}
                col={col}
                tasks={getTasksByStatus(col.key)}
                draggingId={draggingId}
                onDrop={handleDrop}
                onEdit={handleEditClick}
                onDelete={handleDelete}
                onDragStart={setDraggingId}
                onDragEnd={() => setDraggingId(null)}
              />
            ))}
          </div>
        </>
      )}

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <div className="border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] p-6 mb-8">
          <h3 className="font-mono font-extrabold text-sm uppercase tracking-wider mb-4 border-b border-border/20 pb-3">Semua Tugas ({tasks.length})</h3>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground font-mono italic text-center py-6">Belum ada tugas kepanitiaan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono border-collapse">
                <thead>
                  <tr className="border-b-2 border-border bg-muted/40 text-xs font-bold uppercase select-none">
                    <th className="p-3">Tugas</th>
                    <th className="p-3">Kegiatan</th>
                    <th className="p-3 text-center">Deadline</th>
                    <th className="p-3 text-center">Prioritas</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-border/20">
                  {tasks
                    .sort((a, b) => {
                      const order: Record<string, number> = { TODO: 0, IN_PROGRESS: 1, DONE: 2 };
                      return (order[a.status] || 0) - (order[b.status] || 0);
                    })
                    .map(task => {
                      const pMeta = PRIORITY_META[task.priority] || PRIORITY_META.MEDIUM;
                      const due = task.dueDate ? new Date(task.dueDate) : null;
                      const isOverdue = due && due < REF_DATE && task.status !== "DONE";
                      return (
                        <tr key={task.id} className={`hover:bg-muted/10 transition-colors ${task.status === "DONE" ? "opacity-60" : ""}`}>
                          <td className="p-3">
                            <p className="font-bold uppercase">{task.title}</p>
                            {task.description && <p className="text-muted-foreground text-[10px] max-w-[180px] truncate">{task.description}</p>}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {task.event ? <span>{task.event.organization.logoIcon} {task.event.title}</span> : "—"}
                          </td>
                          <td className="p-3 text-center">
                            {due ? (
                              <span className={`font-bold ${isOverdue ? "text-rose-600" : ""}`}>
                                {isOverdue ? "❗ " : ""}
                                {due.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`text-[9px] font-bold px-2 py-0.5 border uppercase ${pMeta.color}`}>{pMeta.label}</span>
                          </td>
                          <td className="p-3 text-center">
                            <select
                              value={task.status}
                              onChange={e => handleStatusChange(task, e.target.value)}
                              className="border border-border bg-background px-1 py-0.5 text-[10px] font-mono font-bold uppercase focus:outline-none cursor-pointer"
                            >
                              {STATUS_COLUMNS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => handleEditClick(task)} className="px-2 py-0.5 border-2 border-border font-bold text-[10px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all">Edit</button>
                              <button onClick={() => handleDelete(task)} className="px-2 py-0.5 border-2 border-destructive font-bold text-[10px] uppercase bg-destructive/10 text-destructive shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all">Hapus</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
