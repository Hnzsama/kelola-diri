"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { useConfirm } from "@/components/ui/confirm-modal";
import { DatePicker } from "@/components/ui/date-picker";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";

interface Membership {
  organizationId: string;
  organization: { id: string; name: string; logoIcon: string };
}

interface OrgEvent {
  id: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  endDate: string | null;
  location: string | null;
  isArchived: boolean;
  organization: { id: string; name: string; logoIcon: string };
  tasks: { id: string; status: string }[];
}

const EVENT_TYPE_META: Record<string, { icon: string; label: string; dotColor: string; badgeColor: string; headerBg: string }> = {
  MEETING: { icon: "📅", label: "Rapat",   dotColor: "bg-blue-500",    badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-400/30",     headerBg: "border-blue-400/30 bg-blue-500/5" },
  EVENT:   { icon: "🎪", label: "Event",   dotColor: "bg-emerald-500", badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-400/30", headerBg: "border-emerald-400/30 bg-emerald-500/5" },
  SEMINAR: { icon: "📢", label: "Seminar", dotColor: "bg-purple-500",  badgeColor: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-400/30",  headerBg: "border-purple-400/30 bg-purple-500/5" },
  PROKER:  { icon: "📋", label: "Proker",  dotColor: "bg-amber-500",   badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/30",   headerBg: "border-amber-400/30 bg-amber-500/5" },
  OTHER:   { icon: "📁", label: "Lainnya", dotColor: "bg-gray-400",    badgeColor: "bg-muted text-muted-foreground border-border/30",                           headerBg: "border-border/30 bg-muted/30" },
};

const EVENT_TYPES = ["MEETING", "EVENT", "SEMINAR", "PROKER", "OTHER"];
const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
const DAYS_ID_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const DAYS_ID_FULL = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const REF_DATE = new Date("2026-06-14");

// ─── Event Detail Modal ─────────────────────────────────────────────────────

function EventDetailModal({
  event,
  onClose,
  onEdit,
  onArchive,
  onDelete,
}: {
  event: OrgEvent;
  onClose: () => void;
  onEdit: (ev: OrgEvent) => void;
  onArchive: (ev: OrgEvent) => void;
  onDelete: (ev: OrgEvent) => void;
}) {
  const meta = EVENT_TYPE_META[event.type] || EVENT_TYPE_META.OTHER;
  const date = new Date(event.date);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const isMultiDay = endDate && endDate.toDateString() !== date.toDateString();
  const isPast = date < new Date(REF_DATE.toDateString());
  const doneTasks = event.tasks.filter(t => t.status === "DONE").length;
  const totalTasks = event.tasks.length;
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md border-2 border-border bg-card shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] animate-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className={`p-5 border-b-2 border-border ${meta.headerBg}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{meta.icon}</span>
              <div>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 border uppercase ${meta.badgeColor}`}>
                  {meta.label}
                </span>
                <h2 className="font-mono font-extrabold text-base uppercase tracking-tight mt-1 leading-tight">
                  {event.title}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 size-7 flex items-center justify-center border-2 border-border bg-background font-bold text-sm hover:bg-muted transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-[1px]"
              title="Tutup (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Organisasi */}
          <div className="flex items-center gap-2">
            <span className="text-xl">{event.organization.logoIcon}</span>
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Organisasi</p>
              <p className="font-mono font-bold text-sm">{event.organization.name}</p>
            </div>
          </div>

          {/* Tanggal */}
          <div className="border-t border-border/20 pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase font-bold mb-1">📅 Tanggal Mulai</p>
              <p className="font-mono font-bold text-sm">
                {DAYS_ID_FULL[date.getDay()]},
              </p>
              <p className="font-mono font-bold text-sm">
                {date.getDate()} {MONTHS_ID[date.getMonth()]} {date.getFullYear()}
              </p>
            </div>
            {isMultiDay && (
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase font-bold mb-1">🏁 Tanggal Selesai</p>
                <p className="font-mono font-bold text-sm">
                  {DAYS_ID_FULL[endDate!.getDay()]},
                </p>
                <p className="font-mono font-bold text-sm">
                  {endDate!.getDate()} {MONTHS_ID[endDate!.getMonth()]} {endDate!.getFullYear()}
                </p>
              </div>
            )}
          </div>

          {/* Lokasi */}
          {event.location && (
            <div className="border-t border-border/20 pt-4">
              <p className="text-[10px] font-mono text-muted-foreground uppercase font-bold mb-1">📍 Lokasi</p>
              <p className="font-mono text-sm">{event.location}</p>
            </div>
          )}

          {/* Deskripsi */}
          {event.description && (
            <div className="border-t border-border/20 pt-4">
              <p className="text-[10px] font-mono text-muted-foreground uppercase font-bold mb-1">📝 Deskripsi</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p>
            </div>
          )}

          {/* Progress Tugas */}
          {totalTasks > 0 && (
            <div className="border-t border-border/20 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono text-muted-foreground uppercase font-bold">✅ Progress Tugas</p>
                <span className="text-[10px] font-mono font-bold">{doneTasks}/{totalTasks} ({completionPct}%)</span>
              </div>
              <div className="w-full bg-muted border border-border h-3 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Status badge */}
          {isPast && (
            <div className="border-t border-border/20 pt-3">
              <span className="text-[10px] font-mono font-bold px-2 py-1 border border-muted-foreground/30 bg-muted/30 text-muted-foreground uppercase">
                ⏰ Kegiatan Sudah Berlalu
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t-2 border-border bg-muted/20 flex gap-2 flex-wrap">
          <button
            onClick={() => { onClose(); onEdit(event); }}
            className="flex-1 px-3 py-2 border-2 border-border font-bold text-xs uppercase bg-background text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all font-mono"
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => { onClose(); onArchive(event); }}
            className="flex-1 px-3 py-2 border-2 border-amber-500 font-bold text-xs uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all font-mono"
          >
            📁 Arsipkan
          </button>
          <button
            onClick={() => { onClose(); onDelete(event); }}
            className="px-3 py-2 border-2 border-destructive font-bold text-xs uppercase bg-destructive/10 text-destructive shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all font-mono"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function OrgEventsPage() {
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterOrg, setFilterOrg] = useState("");
  const [editingEvent, setEditingEvent] = useState<OrgEvent | null>(null);

  // Modal state
  const [selectedEvent, setSelectedEvent] = useState<OrgEvent | null>(null);
  const { confirmModal, openConfirm } = useConfirm();

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date(REF_DATE.getFullYear(), REF_DATE.getMonth(), 1));

  // Form state
  const [fTitle, setFTitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fType, setFType] = useState("MEETING");
  const [fDate, setFDate] = useState(REF_DATE.toISOString().split("T")[0]);
  const [fEndDate, setFEndDate] = useState("");
  const [fLocation, setFLocation] = useState("");
  const [fOrgId, setFOrgId] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      const [eRes, mRes] = await Promise.all([
        fetch("/api/organizations/events"),
        fetch("/api/organizations"),
      ]);
      const [eData, mData] = await Promise.all([eRes.json(), mRes.json()]);
      setEvents(eData);
      setMemberships(mData);
      if (mData.length > 0) setFOrgId(mData[0].organization.id);
    } catch { toast.error("Gagal memuat agenda"); }
    finally { setIsLoading(false); }
  };

  const resetForm = useCallback(() => {
    setEditingEvent(null); setIsFormOpen(false);
    setFTitle(""); setFDesc(""); setFType("MEETING");
    setFDate(REF_DATE.toISOString().split("T")[0]); setFEndDate("");
    setFLocation(""); setFOrgId(memberships[0]?.organization.id || "");
  }, [memberships]);

  const handleEditClick = (ev: OrgEvent) => {
    setEditingEvent(ev);
    setFTitle(ev.title); setFDesc(ev.description || ""); setFType(ev.type);
    setFDate(ev.date.split("T")[0]); setFEndDate(ev.endDate ? ev.endDate.split("T")[0] : "");
    setFLocation(ev.location || ""); setFOrgId(ev.organization.id);
    setIsFormOpen(true);
    // Scroll to top to show form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fTitle.trim() || !fDate || !fOrgId) { toast.error("Judul, tanggal, dan organisasi wajib diisi"); return; }
    setIsSaving(true);
    try {
      const url = editingEvent ? `/api/organizations/events/${editingEvent.id}` : "/api/organizations/events";
      const method = editingEvent ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: fOrgId, title: fTitle, description: fDesc, type: fType, date: fDate, endDate: fEndDate || null, location: fLocation }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      toast.success(editingEvent ? "Agenda diperbarui!" : "Agenda berhasil ditambahkan!");
      resetForm(); fetchAll();
    } catch (e: any) { toast.error(e.message || "Gagal"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (ev: OrgEvent) => {
    const ok = await openConfirm({
      title: "Hapus Agenda",
      message: `Hapus agenda "${ev.title}"?\n\nData agenda ini akan dihapus permanen beserta semua tugas terkait.`,
      confirmLabel: "Ya, Hapus",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/organizations/events/${ev.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Agenda dihapus"); fetchAll();
    } catch (e: any) { toast.error(e.message || "Gagal"); }
  };

  const handleArchive = async (ev: OrgEvent) => {
    const ok = await openConfirm({
      title: "Arsipkan Agenda",
      message: `Arsipkan "${ev.title}"?\n\nAgenda akan dipindahkan ke Arsip Kegiatan dan tidak muncul di kalender aktif.`,
      confirmLabel: "Ya, Arsipkan",
      variant: "warning",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/organizations/events/${ev.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Agenda diarsipkan"); fetchAll();
    } catch (e: any) { toast.error(e.message || "Gagal"); }
  };

  const filteredEvents = events.filter(ev =>
    !ev.isArchived && (filterOrg === "" || ev.organization.id === filterOrg)
  );

  // Calendar helpers
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay(); // 0 = Sun

  const getEventsForDay = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return filteredEvents.filter(ev => ev.date.startsWith(dateStr));
  };

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="w-full px-4 lg:px-6">
      {/* ── Confirm Modal ── */}
      {confirmModal}

      {/* ── Event Detail Modal ── */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={handleEditClick}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Agenda Kegiatan</h1>
          <p className="text-muted-foreground">Rapat, seminar, event, dan proker dari semua organisasi Anda.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border-2 border-border overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            {(["calendar", "list"] as const).map((m) => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`px-4 py-2 font-bold text-xs uppercase font-mono transition-colors ${viewMode === m ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"}`}>
                {m === "calendar" ? "📅 Kalender" : "📋 List"}
              </button>
            ))}
          </div>
          <button onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }}
            className="flex items-center gap-2 px-5 py-2 border-2 border-border font-bold text-sm uppercase bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Tambah Agenda
          </button>
        </div>
      </div>

      {/* ADD/EDIT FORM */}
      {isFormOpen && (
        <div className="mb-8 border-2 border-border bg-card p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
          <h2 className="text-xl font-bold uppercase font-mono mb-4">{editingEvent ? "Edit Agenda" : "Tambah Agenda Baru"}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <Field className="md:col-span-2">
              <FieldLabel>Judul Agenda *</FieldLabel>
              <Input placeholder="Contoh: Rapat Divisi IT" value={fTitle} onChange={e => setFTitle(e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel>Organisasi *</FieldLabel>
              <select value={fOrgId} onChange={e => setFOrgId(e.target.value)} className="flex h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-hidden">
                {memberships.map(m => <option key={m.organization.id} value={m.organization.id}>{m.organization.logoIcon} {m.organization.name}</option>)}
              </select>
            </Field>
            <Field>
              <FieldLabel>Tipe Kegiatan</FieldLabel>
              <select value={fType} onChange={e => setFType(e.target.value)} className="flex h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-hidden">
                {EVENT_TYPES.map(t => <option key={t} value={t}>{EVENT_TYPE_META[t]?.icon} {EVENT_TYPE_META[t]?.label}</option>)}
              </select>
            </Field>
            <Field>
              <FieldLabel>Tanggal Mulai *</FieldLabel>
              <DatePicker value={fDate || ""} onChange={setFDate} />
            </Field>
            <Field>
              <FieldLabel>Tanggal Selesai (opsional)</FieldLabel>
              <DatePicker value={fEndDate || ""} onChange={setFEndDate} />
            </Field>
            <Field>
              <FieldLabel>Lokasi</FieldLabel>
              <Input placeholder="Contoh: Ruang Sidang Gedung A" value={fLocation} onChange={e => setFLocation(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Deskripsi</FieldLabel>
              <Input placeholder="Detail kegiatan..." value={fDesc} onChange={e => setFDesc(e.target.value)} />
            </Field>
            <div className="md:col-span-2 flex gap-3 pt-2">
              <Button type="submit" disabled={isSaving} className="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                {isSaving ? "Menyimpan..." : editingEvent ? "Update" : "Simpan"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">Batal</Button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
        <button onClick={() => setFilterOrg("")}
          className={`px-3 py-1.5 border-2 border-border font-bold text-xs uppercase font-mono whitespace-nowrap transition-all ${filterOrg === "" ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]" : "bg-background hover:bg-muted"}`}>
          Semua Organisasi
        </button>
        {memberships.map(m => (
          <button key={m.organization.id} onClick={() => setFilterOrg(m.organization.id)}
            className={`px-3 py-1.5 border-2 border-border font-bold text-xs uppercase font-mono whitespace-nowrap transition-all ${filterOrg === m.organization.id ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]" : "bg-background hover:bg-muted"}`}>
            {m.organization.logoIcon} {m.organization.name}
          </button>
        ))}
      </div>

      {/* CALENDAR VIEW */}
      {viewMode === "calendar" && (
        <div className="border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] p-5 mb-8">
          {/* Calendar Nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))}
              className="px-3 py-1.5 border-2 border-border font-bold text-sm bg-background hover:bg-muted shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all">←</button>
            <h3 className="font-mono font-extrabold text-base uppercase tracking-wider">
              {MONTHS_ID[calMonth]} {calYear}
            </h3>
            <button onClick={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))}
              className="px-3 py-1.5 border-2 border-border font-bold text-sm bg-background hover:bg-muted shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all">→</button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_ID_SHORT.map(d => (
              <div key={d} className="text-center font-mono text-[10px] font-bold uppercase text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 border-t border-l border-border">
            {/* Empty cells for first day offset */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="border-r border-b border-border min-h-[90px] bg-muted/10" />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dayEvents = getEventsForDay(day);
              const date = new Date(calYear, calMonth, day);
              const isToday = date.toDateString() === REF_DATE.toDateString();
              return (
                <div key={day} className={`border-r border-b border-border min-h-[90px] p-1.5 ${isToday ? "bg-primary/5" : "bg-background"}`}>
                  <div className={`font-mono font-bold text-xs mb-1.5 w-5 h-5 flex items-center justify-center ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => {
                      const meta = EVENT_TYPE_META[ev.type] || EVENT_TYPE_META.OTHER;
                      return (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`w-full text-left text-[9px] font-mono font-bold px-1 py-0.5 border truncate transition-all hover:brightness-95 hover:scale-[1.02] active:scale-[0.98] ${meta.badgeColor}`}
                          title={`${ev.title} — klik untuk detail`}
                        >
                          {meta.icon} {ev.title}
                        </button>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <button
                        onClick={() => setSelectedEvent(dayEvents[3])}
                        className="w-full text-left text-[9px] font-mono text-muted-foreground pl-1 hover:text-foreground transition-colors"
                      >
                        +{dayEvents.length - 3} lagi...
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-border/20">
            <span className="text-[10px] font-mono text-muted-foreground">Klik agenda untuk melihat detail ↓</span>
            <div className="flex flex-wrap gap-2 ml-auto">
              {EVENT_TYPES.map(t => {
                const m = EVENT_TYPE_META[t];
                return (
                  <span key={t} className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border uppercase ${m.badgeColor}`}>
                    {m.icon} {m.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      <div className="border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] p-6 mb-8">
        <h3 className="font-mono font-extrabold text-sm uppercase tracking-wider mb-4 border-b border-border/20 pb-3">
          📋 {viewMode === "calendar" ? "Daftar Agenda Aktif" : "Semua Agenda"} ({filteredEvents.length})
        </h3>
        {filteredEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground font-mono italic text-center py-6">Belum ada agenda kegiatan.</p>
        ) : (
          <div className="divide-y divide-border/20">
            {filteredEvents
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(ev => {
                const meta = EVENT_TYPE_META[ev.type] || EVENT_TYPE_META.OTHER;
                const date = new Date(ev.date);
                const isPast = date < new Date(REF_DATE.toDateString());
                const doneTasks = ev.tasks.filter(t => t.status === "DONE").length;
                return (
                  <div key={ev.id} className={`py-4 flex items-start justify-between gap-4 first:pt-0 last:pb-0 ${isPast ? "opacity-60" : ""}`}>
                    <button
                      className="flex gap-3 items-start text-left hover:opacity-80 transition-opacity group flex-1"
                      onClick={() => setSelectedEvent(ev)}
                    >
                      <div className={`size-10 border-2 border-border flex items-center justify-center text-lg shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] group-hover:-translate-y-[1px] transition-transform`}>
                        {meta.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-mono font-bold text-sm uppercase group-hover:text-primary transition-colors">{ev.title}</h4>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 border uppercase ${meta.badgeColor}`}>{meta.label}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          {ev.organization.logoIcon} {ev.organization.name}
                          {ev.location && ` · 📍 ${ev.location}`}
                        </p>
                        {ev.description && <p className="text-[11px] text-muted-foreground mt-0.5 max-w-md">{ev.description}</p>}
                        {ev.tasks.length > 0 && (
                          <p className="text-[10px] font-mono text-muted-foreground mt-1">
                            ✅ {doneTasks}/{ev.tasks.length} tugas selesai
                          </p>
                        )}
                      </div>
                    </button>
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <div>
                        <p className="font-mono font-bold text-xs text-primary">
                          {date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        {ev.endDate && ev.endDate !== ev.date && (
                          <p className="text-[10px] text-muted-foreground font-mono">
                            s.d. {new Date(ev.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleEditClick(ev)} className="px-2 py-0.5 border-2 border-border font-bold text-[10px] uppercase bg-background shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all">Edit</button>
                        <button onClick={() => handleArchive(ev)} className="px-2 py-0.5 border-2 border-amber-500 font-bold text-[10px] uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all">Arsip</button>
                        <button onClick={() => handleDelete(ev)} className="px-2 py-0.5 border-2 border-destructive font-bold text-[10px] uppercase bg-destructive/10 text-destructive shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all">Hapus</button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
