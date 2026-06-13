"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface Organization {
  id: string;
  name: string;
  description: string | null;
  period: string | null;
  logoIcon: string;
  members: { id: string }[];
  events: { id: string }[];
}

interface Membership {
  id: string;
  role: string;
  position: string | null;
  period: string | null;
  organization: Organization;
}

interface OrgEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string | null;
  isArchived: boolean;
  organization: { id: string; name: string; logoIcon: string };
  tasks: { id: string; status: string }[];
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

const EVENT_TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  MEETING:  { icon: "📅", label: "Rapat",    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-400/30" },
  EVENT:    { icon: "🎪", label: "Event",    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-400/30" },
  SEMINAR:  { icon: "📢", label: "Seminar",  color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-400/30" },
  PROKER:   { icon: "📋", label: "Proker",   color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/30" },
  OTHER:    { icon: "📁", label: "Lainnya",  color: "bg-muted text-muted-foreground border-border/30" },
};

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  HIGH:   { label: "Tinggi",  color: "text-rose-600 dark:text-rose-400" },
  MEDIUM: { label: "Sedang",  color: "text-amber-600 dark:text-amber-400" },
  LOW:    { label: "Rendah",  color: "text-emerald-600 dark:text-emerald-400" },
};

const REF_DATE = new Date("2026-06-14");

export default function OrgDashboardPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [tasks, setTasks] = useState<OrgTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      const [mRes, eRes, tRes] = await Promise.all([
        fetch("/api/organizations"),
        fetch("/api/organizations/events"),
        fetch("/api/organizations/tasks"),
      ]);
      if (!mRes.ok || !eRes.ok || !tRes.ok) throw new Error("Gagal");
      const [mData, eData, tData] = await Promise.all([mRes.json(), eRes.json(), tRes.json()]);
      setMemberships(mData);
      setEvents(eData);
      setTasks(tData);
    } catch {
      toast.error("Gagal memuat data organisasi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedDummy = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/organizations/dummy", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Gagal"); return; }
      toast.success(data.success || "Data contoh berhasil dimuat!");
      fetchAll();
    } catch { toast.error("Terjadi kesalahan"); }
    finally { setIsSeeding(false); }
  };

  // Stats
  const now = REF_DATE;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 7);

  const activeOrgs = memberships.length;
  const eventsThisMonth = events.filter(e => {
    const d = new Date(e.date);
    return d >= startOfMonth && d <= endOfMonth && !e.isArchived;
  }).length;
  const totalTasks = tasks.filter(t => t.status !== "DONE").length;
  const deadlinesThisWeek = tasks.filter(t => {
    if (!t.dueDate || t.status === "DONE") return false;
    const d = new Date(t.dueDate);
    return d >= now && d <= endOfWeek;
  }).length;

  // Timeline: upcoming events sorted by date
  const upcomingEvents = events
    .filter(e => !e.isArchived && new Date(e.date) >= new Date(now.toDateString()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8);

  // Urgent tasks
  const urgentTasks = tasks
    .filter(t => t.status !== "DONE")
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground font-mono">
        Memuat dashboard organisasi...
      </div>
    );
  }

  const isEmpty = memberships.length === 0;

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Dashboard Organisasi</h1>
          <p className="text-muted-foreground">
            Ikut organisasi apa → Agenda minggu ini → Panitia apa → Tugas apa → Deadline kapan.
          </p>
        </div>
        {isEmpty && (
          <button
            onClick={handleSeedDummy}
            disabled={isSeeding}
            className="flex items-center gap-2 px-5 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSeeding ? "Memproses..." : "Muat Data Contoh"}
          </button>
        )}
      </div>

      {isEmpty ? (
        /* EMPTY STATE */
        <div className="border-2 border-dashed border-border p-12 text-center bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <div className="text-5xl mb-4">🏢</div>
          <h3 className="text-lg font-bold font-mono uppercase mb-1">Belum Ada Organisasi</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Mulai tambah organisasi yang Anda ikuti, atau gunakan data contoh untuk demo langsung.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/dashboard/organizations/list">
              <button className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-background text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all">
                Tambah Organisasi
              </button>
            </Link>
            <button
              onClick={handleSeedDummy}
              disabled={isSeeding}
              className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all"
            >
              {isSeeding ? "Memproses..." : "Muat Data Contoh"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* STATS CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Organisasi Aktif",    value: activeOrgs,        sub: "Terdaftar",        color: "text-blue-600 dark:text-blue-400" },
              { label: "Agenda Bulan Ini",    value: eventsThisMonth,   sub: "Kegiatan",          color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Tugas Kepanitiaan",   value: totalTasks,        sub: "Belum Selesai",    color: "text-amber-500" },
              { label: "Deadline Minggu Ini", value: deadlinesThisWeek, sub: "Tugas Mendesak",   color: "text-rose-600 dark:text-rose-400" },
            ].map((s) => (
              <div key={s.label} className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <h3 className={`text-4xl font-extrabold font-mono mt-2 ${s.color}`}>{s.value}</h3>
                <div className="mt-3 pt-2 border-t border-border/20 text-xs font-mono text-muted-foreground">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-start">
            {/* TIMELINE KEGIATAN */}
            <div className="lg:col-span-2 border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-5">
                <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight">⏱️ Timeline Kegiatan Mendatang</h3>
                <Link href="/dashboard/organizations/events">
                  <button className="px-3 py-1 border-2 border-border font-bold text-[10px] uppercase bg-background shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
                    Lihat Semua
                  </button>
                </Link>
              </div>

              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground font-mono italic py-4 text-center">Tidak ada agenda mendatang.</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-border/30" />
                  <div className="space-y-4">
                    {upcomingEvents.map((ev) => {
                      const meta = EVENT_TYPE_META[ev.type] || EVENT_TYPE_META.OTHER;
                      const d = new Date(ev.date);
                      const isToday = d.toDateString() === REF_DATE.toDateString();
                      const isTomorrow = d.toDateString() === new Date(REF_DATE.getTime() + 86400000).toDateString();
                      const dayLabel = isToday ? "Hari Ini" : isTomorrow ? "Besok" : d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
                      return (
                        <div key={ev.id} className="flex gap-4 relative">
                          <div className={`relative z-10 flex items-center justify-center size-11 border-2 border-border shrink-0 text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] bg-card ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}`}>
                            {meta.icon}
                          </div>
                          <div className="flex-1 border-2 border-border p-3 bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div>
                                <h4 className="font-mono font-bold text-sm uppercase">{ev.title}</h4>
                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                  {ev.organization.logoIcon} {ev.organization.name}
                                  {ev.location && ` · ${ev.location}`}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-mono font-bold text-xs text-primary">{dayLabel}</span>
                                <p className="text-[10px] text-muted-foreground font-mono">
                                  {d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* KARTU ORGANISASI */}
            <div className="space-y-4">
              <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-4">
                  <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight">🏢 Organisasi Saya</h3>
                  <Link href="/dashboard/organizations/list">
                    <button className="px-3 py-1 border-2 border-border font-bold text-[10px] uppercase bg-background shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
                      Kelola
                    </button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {memberships.map((m) => (
                    <div key={m.id} className="border-2 border-border p-3 bg-background flex gap-3 items-start hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all">
                      <span className="text-2xl shrink-0 mt-0.5">{m.organization.logoIcon}</span>
                      <div className="min-w-0">
                        <h4 className="font-mono font-bold text-sm uppercase truncate">{m.organization.name}</h4>
                        <p className="text-[11px] text-primary font-mono font-bold">{m.position || m.role}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{m.organization.period || m.period || "—"}</p>
                        <div className="flex gap-2 mt-1.5 text-[9px] font-mono text-muted-foreground uppercase">
                          <span>{m.organization.members.length} anggota</span>
                          <span>·</span>
                          <span>{m.organization.events.length} agenda</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tugas Mendatang */}
              <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-4">
                  <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight">⚡ Tugas Mendesak</h3>
                  <Link href="/dashboard/organizations/tasks">
                    <button className="px-3 py-1 border-2 border-border font-bold text-[10px] uppercase bg-background shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
                      Semua Tugas
                    </button>
                  </Link>
                </div>
                {urgentTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground font-mono italic text-center py-3">Semua tugas sudah selesai 🎉</p>
                ) : (
                  <div className="divide-y divide-border/20">
                    {urgentTasks.map((t) => {
                      const due = t.dueDate ? new Date(t.dueDate) : null;
                      const isOverdue = due && due < REF_DATE && t.status !== "DONE";
                      const pMeta = PRIORITY_META[t.priority] || PRIORITY_META.MEDIUM;
                      return (
                        <div key={t.id} className="py-2.5 flex items-start justify-between gap-2 first:pt-0 last:pb-0">
                          <div className="min-w-0">
                            <p className="font-mono font-bold text-xs uppercase truncate max-w-[160px]">{t.title}</p>
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                              {t.event ? `${t.event.organization.logoIcon} ${t.event.title}` : "—"}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            {due && (
                              <p className={`text-[10px] font-mono font-bold ${isOverdue ? "text-rose-600" : "text-muted-foreground"}`}>
                                {isOverdue ? "❗ " : ""}
                                {due.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                              </p>
                            )}
                            <p className={`text-[9px] font-mono font-bold uppercase ${pMeta.color}`}>{pMeta.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] mb-8">
            <h3 className="font-mono font-extrabold text-xs uppercase tracking-widest border-b border-border/20 pb-3 mb-4 text-muted-foreground">⚡ Akses Cepat</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { href: "/dashboard/organizations/list",   label: "Daftar Organisasi", sub: "Kelola Keanggotaan" },
                { href: "/dashboard/organizations/events", label: "Agenda Kegiatan",   sub: "Calendar & Timeline" },
                { href: "/dashboard/organizations/tasks",  label: "Tugas Kepanitiaan", sub: "Kanban & Tabel" },
                { href: "/dashboard/organizations/archive",label: "Arsip Kegiatan",    sub: "Riwayat Kegiatan" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="block text-center border-2 border-border p-4 bg-muted/20 hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <span className="block text-sm font-extrabold font-mono uppercase">{item.label}</span>
                  <span className="text-[10px] font-mono opacity-80">{item.sub}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
