"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useConfirm } from "@/components/ui/confirm-modal";

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

const EVENT_TYPE_META: Record<string, { icon: string; label: string; badgeColor: string }> = {
  MEETING: { icon: "📅", label: "Rapat",   badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-400/30" },
  EVENT:   { icon: "🎪", label: "Event",   badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-400/30" },
  SEMINAR: { icon: "📢", label: "Seminar", badgeColor: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-400/30" },
  PROKER:  { icon: "📋", label: "Proker",  badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/30" },
  OTHER:   { icon: "📁", label: "Lainnya", badgeColor: "bg-muted text-muted-foreground border-border/30" },
};

export default function OrgArchivePage() {
  const [archivedEvents, setArchivedEvents] = useState<OrgEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { confirmModal, openConfirm } = useConfirm();

  useEffect(() => { fetchArchived(); }, []);

  const fetchArchived = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/organizations/events?archived=true");
      if (!res.ok) throw new Error("Gagal");
      setArchivedEvents(await res.json());
    } catch { toast.error("Gagal memuat arsip kegiatan"); }
    finally { setIsLoading(false); }
  };

  const handleUnarchive = async (ev: OrgEvent) => {
    const ok = await openConfirm({
      title: "Kembalikan Agenda",
      message: `Kembalikan "${ev.title}" ke daftar agenda aktif?`,
      confirmLabel: "Ya, Kembalikan",
      variant: "default",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/organizations/events/${ev.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Agenda dikembalikan ke aktif");
      fetchArchived();
    } catch (e: any) { toast.error(e.message || "Gagal"); }
  };

  const handleDelete = async (ev: OrgEvent) => {
    const ok = await openConfirm({
      title: "Hapus Permanen",
      message: `Hapus permanen "${ev.title}"?\n\nSeluruh tugas terkait juga akan dihapus. Ini tidak dapat dibatalkan.`,
      confirmLabel: "Ya, Hapus Permanen",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/organizations/events/${ev.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Agenda dihapus permanen"); fetchArchived();
    } catch (e: any) { toast.error(e.message || "Gagal"); }
  };

  if (isLoading) return <div className="flex h-[50vh] items-center justify-center text-muted-foreground font-mono">Memuat arsip kegiatan...</div>;

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Confirm Modal */}
      {confirmModal}

      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Arsip Kegiatan</h1>
          <p className="text-muted-foreground">Riwayat kegiatan yang telah selesai — berguna untuk regenerasi dan evaluasi organisasi.</p>
        </div>
        <Link href="/dashboard/organizations/events">
          <button className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
            ← Kembali ke Agenda
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="border-2 border-border bg-card p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Kegiatan Diarsip</span>
          <h3 className="text-3xl font-extrabold font-mono mt-1 text-muted-foreground">{archivedEvents.length}</h3>
        </div>
        <div className="border-2 border-border bg-card p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Total Tugas Selesai</span>
          <h3 className="text-3xl font-extrabold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
            {archivedEvents.reduce((sum, ev) => sum + ev.tasks.filter(t => t.status === "DONE").length, 0)}
          </h3>
        </div>
        <div className="border-2 border-border bg-card p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Total Tugas Dibuat</span>
          <h3 className="text-3xl font-extrabold font-mono mt-1">
            {archivedEvents.reduce((sum, ev) => sum + ev.tasks.length, 0)}
          </h3>
        </div>
      </div>

      {archivedEvents.length === 0 ? (
        <div className="border-2 border-dashed border-border p-12 text-center bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <div className="text-5xl mb-4">📁</div>
          <h3 className="text-lg font-bold font-mono uppercase mb-2">Arsip Kosong</h3>
          <p className="text-sm text-muted-foreground font-mono max-w-sm mx-auto">
            Belum ada kegiatan yang diarsipkan. Setelah sebuah agenda selesai, klik "Arsip" di halaman Agenda Kegiatan.
          </p>
        </div>
      ) : (
        <div className="border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] p-6">
          <h3 className="font-mono font-extrabold text-sm uppercase tracking-wider mb-4 border-b border-border/20 pb-3">
            📁 Daftar Kegiatan Diarsipkan ({archivedEvents.length})
          </h3>
          <div className="space-y-4">
            {archivedEvents
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(ev => {
                const meta = EVENT_TYPE_META[ev.type] || EVENT_TYPE_META.OTHER;
                const date = new Date(ev.date);
                const doneTasks = ev.tasks.filter(t => t.status === "DONE").length;
                const totalTasks = ev.tasks.length;
                const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
                return (
                  <div key={ev.id} className="border-2 border-border bg-background p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]">
                    <div className="flex gap-3 items-start">
                      <div className="size-12 border-2 border-border flex items-center justify-center text-xl shrink-0 bg-muted/30">
                        {meta.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-mono font-bold text-sm uppercase">{ev.title}</h4>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 border uppercase ${meta.badgeColor}`}>{meta.label}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          {ev.organization.logoIcon} {ev.organization.name}
                          {ev.location ? ` · 📍 ${ev.location}` : ""}
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                          📅 {date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        {totalTasks > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="w-24 bg-muted border border-border h-2 overflow-hidden">
                              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${completionPct}%` }} />
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {doneTasks}/{totalTasks} tugas selesai ({completionPct}%)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleUnarchive(ev)}
                        className="px-3 py-1.5 border-2 border-border font-bold text-[10px] uppercase bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all">
                        Kembalikan
                      </button>
                      <button onClick={() => handleDelete(ev)}
                        className="px-3 py-1.5 border-2 border-destructive font-bold text-[10px] uppercase bg-destructive/10 text-destructive shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all">
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
