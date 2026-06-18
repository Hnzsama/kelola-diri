"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  PencilEdit01Icon,
  Calendar01Icon,
  Cancel01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon
} from "@hugeicons/core-free-icons";

interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  jobLink?: string;
  appliedDate: string;
  status: "WISHLIST" | "APPLIED" | "HR_INTERVIEW" | "TECHNICAL_TEST" | "USER_INTERVIEW" | "OFFERING" | "ACCEPTED" | "REJECTED";
  notes?: string;
}

const COLUMNS = [
  { id: "WISHLIST", label: "Wishlist", color: "bg-slate-100 text-slate-800 border-slate-300" },
  { id: "APPLIED", label: "Applied", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { id: "HR_INTERVIEW", label: "HR Interview", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { id: "TECHNICAL_TEST", label: "Tech Test", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { id: "USER_INTERVIEW", label: "User Interview", color: "bg-pink-100 text-pink-800 border-pink-300" },
  { id: "OFFERING", label: "Offering", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { id: "ACCEPTED", label: "Accepted", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { id: "REJECTED", label: "Rejected", color: "bg-rose-100 text-rose-800 border-rose-300" },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [jobLink, setJobLink] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [status, setStatus] = useState<JobApplication["status"]>("WISHLIST");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/career/jobs");
      if (!res.ok) throw new Error("Gagal");
      const data = await res.json();
      setJobs(data);
    } catch {
      toast.error("Gagal memuat data lamaran kerja");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setCompanyName("");
    setPosition("");
    setJobLink("");
    setAppliedDate(new Date().toISOString().substring(0, 10));
    setStatus("WISHLIST");
    setNotes("");
    setIsOpen(true);
  };

  const handleOpenEdit = (job: JobApplication) => {
    setEditId(job.id);
    setCompanyName(job.companyName);
    setPosition(job.position);
    setJobLink(job.jobLink || "");
    setAppliedDate(job.appliedDate.substring(0, 10));
    setStatus(job.status);
    setNotes(job.notes || "");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !position || !appliedDate) {
      toast.error("Kolom wajib harus diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editId ? `/api/career/jobs/${editId}` : "/api/career/jobs";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          position,
          jobLink: jobLink.trim() || undefined,
          appliedDate,
          status,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan lamaran kerja");
      } else {
        toast.success(editId ? "Lamaran kerja berhasil diperbarui!" : "Lamaran kerja berhasil didaftarkan!");
        setIsOpen(false);
        fetchJobs();
      }
    } catch {
      toast.error("Gagal menyimpan lamaran kerja");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransitionStatus = async (id: string, newStatus: JobApplication["status"]) => {
    try {
      const res = await fetch(`/api/career/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Dipindahkan ke tahap ${COLUMNS.find(c => c.id === newStatus)?.label}`);
        fetchJobs();
      } else {
        toast.error("Gagal memindahkan status");
      }
    } catch {
      toast.error("Gagal memindahkan status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data lamaran kerja ini?")) return;

    try {
      const res = await fetch(`/api/career/jobs/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Lamaran kerja berhasil dihapus");
        fetchJobs();
      } else {
        toast.error("Gagal menghapus lamaran");
      }
    } catch {
      toast.error("Gagal menghapus lamaran");
    }
  };

  const shiftStatus = (job: JobApplication, direction: "prev" | "next") => {
    const currentIndex = COLUMNS.findIndex((col) => col.id === job.status);
    let nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < COLUMNS.length) {
      handleTransitionStatus(job.id, COLUMNS[nextIndex].id as JobApplication["status"]);
    }
  };

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="w-full px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Job Application Tracker</h1>
          <p className="text-muted-foreground font-mono text-xs">
            Lacak kemajuan proses lamaran kerja, magang, maupun proyek kontrak Anda dari pendaftaran hingga diterimanya tawaran.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0"
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          <span>Tambah Lamaran</span>
        </button>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2 font-mono scrollbar-thin scrollbar-thumb-border">
        {COLUMNS.map((col) => {
          const colJobs = jobs.filter((j) => j.status === col.id);

          return (
            <div
              key={col.id}
              className="flex-1 min-w-[270px] max-w-[320px] flex flex-col border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] p-4 min-h-[70vh]"
            >
              {/* Column Header */}
              <div className="flex justify-between items-center border-b-2 border-border pb-3 mb-4">
                <span className="font-extrabold text-xs uppercase tracking-wider">{col.label}</span>
                <span className="bg-muted text-foreground border border-border px-2 py-0.5 text-[10px] font-bold">
                  {colJobs.length}
                </span>
              </div>

              {/* Column Cards Container */}
              <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[60vh] pr-1">
                {colJobs.length === 0 ? (
                  <div className="border border-dashed border-border p-8 text-center text-[10px] text-muted-foreground italic bg-muted/5">
                    Kosong
                  </div>
                ) : (
                  colJobs.map((job) => (
                    <div
                      key={job.id}
                      className="border-2 border-border bg-background p-3.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] space-y-3 relative group"
                    >
                      {/* Job Header */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-slate-500 uppercase block truncate">
                          {job.companyName}
                        </span>
                        <h4 className="text-xs font-black truncate">{job.position}</h4>
                      </div>

                      {/* Info lines */}
                      <div className="text-[9px] text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <HugeiconsIcon icon={Calendar01Icon} className="size-2.5" />
                          <span>Lamar: {new Date(job.appliedDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                        </div>
                        {job.jobLink && (
                          <a
                            href={job.jobLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary font-bold hover:underline truncate block"
                          >
                            🔗 Buka Lowongan Kerja
                          </a>
                        )}
                        {job.notes && (
                          <div className="border border-border/40 p-1.5 bg-muted/20 text-[8px] italic leading-relaxed text-muted-foreground mt-1.5 whitespace-pre-line">
                            📝 {job.notes}
                          </div>
                        )}
                      </div>

                      {/* Actions & Transitions block */}
                      <div className="flex justify-between items-center pt-2.5 border-t border-border/10">
                        {/* Edit/Delete */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEdit(job)}
                            className="p-1 border border-border bg-background hover:bg-muted text-foreground cursor-pointer"
                            title="Edit"
                          >
                            <HugeiconsIcon icon={PencilEdit01Icon} className="size-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(job.id)}
                            className="p-1 border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer transition-all"
                            title="Hapus"
                          >
                            <HugeiconsIcon icon={Delete02Icon} className="size-3" />
                          </button>
                        </div>

                        {/* Arrows Status Shifts */}
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => shiftStatus(job, "prev")}
                            disabled={COLUMNS.findIndex(c => c.id === job.status) === 0}
                            className="p-1 border border-border bg-background hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Pindah ke Tahap Sebelumnya"
                          >
                            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3" />
                          </button>
                          <button
                            onClick={() => shiftStatus(job, "next")}
                            disabled={COLUMNS.findIndex(c => c.id === job.status) === COLUMNS.length - 1}
                            className="p-1 border border-border bg-background hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Pindah ke Tahap Selanjutnya"
                          >
                            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- ADD / EDIT APPLICATION MODAL --- */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="border-3 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-md font-mono max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border/20 pb-2 mb-4">
              <h3 className="font-extrabold text-sm uppercase">
                {editId ? "📝 Edit Info Lamaran Kerja" : "➕ Daftarkan Lamaran Baru"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Nama Perusahaan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Shopee Indonesia"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Posisi Jabatan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Frontend Engineer Intern"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Link Lowongan Kerja (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/jobs/..."
                  value={jobLink}
                  onChange={(e) => setJobLink(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Tanggal Lamar *</label>
                  <input
                    type="date"
                    required
                    value={appliedDate}
                    onChange={(e) => setAppliedDate(e.target.value)}
                    className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Status Tahapan *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                  >
                    {COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Catatan Tambahan</label>
                <textarea
                  placeholder="Kontak HR: hr@shopee.co.id, info gaji ditawarkan, kisi-kisi tes teknikal..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 py-2.5 border-2 border-border bg-background hover:bg-muted font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 border-2 border-border bg-primary text-primary-foreground font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 hover:-translate-y-[1px] transition-all cursor-pointer"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Lamaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
