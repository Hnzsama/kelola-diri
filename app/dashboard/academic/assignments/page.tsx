"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { TableSkeleton } from "@/components/ui/page-skeleton";

interface Semester {
  id: string;
  name: string;
  isActive: boolean;
}

interface Course {
  id: string;
  name: string;
  code: string | null;
}

interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  course: Course;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "TODO" | "IN_PROGRESS" | "DONE">("ALL");

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [coursesRes, assignmentsRes, semestersRes] = await Promise.all([
        fetch("/api/academic/courses"), // Automatically filters by active semester
        fetch("/api/academic/assignments"), // Automatically filters by active semester
        fetch("/api/academic/semesters"),
      ]);

      if (!coursesRes.ok || !assignmentsRes.ok || !semestersRes.ok) throw new Error("Gagal memuat data");

      const coursesData = await coursesRes.json();
      const assignmentsData = await assignmentsRes.json();
      const semestersData = await semestersRes.json();

      setCourses(coursesData);
      setAssignments(assignmentsData);
      setSemesters(semestersData);

      if (coursesData.length > 0 && !courseId) {
        setCourseId(coursesData[0].id);
      }
    } catch (error) {
      toast.error("Gagal memuat data tugas");
    } finally {
      setIsLoading(false);
    }
  };

  const openAddForm = () => {
    if (courses.length === 0) {
      toast.error("Silakan tambahkan mata kuliah terlebih dahulu untuk semester aktif!");
      return;
    }
    setEditingAssignment(null);
    setCourseId(courses[0].id);
    setTitle("");
    setDescription("");
    // Set default due date to tomorrow at 23:59
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0] + "T23:59";
    setDueDate(dateStr);
    setPriority("MEDIUM");
    setIsFormOpen(true);
  };

  const openEditForm = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setCourseId(assignment.courseId);
    setTitle(assignment.title);
    setDescription(assignment.description || "");
    const formattedDate = new Date(assignment.dueDate).toISOString().slice(0, 16);
    setDueDate(formattedDate);
    setPriority(assignment.priority);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !title || !dueDate) {
      toast.error("Mata kuliah, Judul, dan Tanggal Tenggat wajib diisi!");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingAssignment
        ? `/api/academic/assignments/${editingAssignment.id}`
        : "/api/academic/assignments";
      const method = editingAssignment ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title,
          description,
          dueDate: new Date(dueDate).toISOString(),
          priority,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan tugas");
      } else {
        toast.success(
          editingAssignment
            ? "Tugas berhasil diperbarui!"
            : "Tugas berhasil ditambahkan!"
        );
        setIsFormOpen(false);
        fetchData();
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (assignment: Assignment, newStatus: "TODO" | "IN_PROGRESS" | "DONE") => {
    try {
      const res = await fetch(`/api/academic/assignments/${assignment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal memperbarui status");
      }

      toast.success(`Tugas dipindahkan ke ${newStatus === "DONE" ? "Selesai" : newStatus === "IN_PROGRESS" ? "Sedang Dikerjakan" : "Belum Dikerjakan"}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
      return;
    }

    try {
      const res = await fetch(`/api/academic/assignments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus");
      }
      toast.success("Tugas berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus tugas");
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (activeTab === "ALL") return true;
    return a.status === activeTab;
  });

  const getPriorityColor = (p: "LOW" | "MEDIUM" | "HIGH") => {
    switch (p) {
      case "HIGH":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20";
      case "LOW":
        return "bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20";
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activeSemester = semesters.find((s) => s.isActive);

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Pelacak Tugas</h1>
          <p className="text-muted-foreground">
            Pantau semua tugas kuliah untuk semester aktif saat ini.
          </p>
        </div>
        <div>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 px-5 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider text-left transition-all cursor-pointer bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Tambah Tugas</span>
          </button>
        </div>
      </div>

      {/* Active Semester Banner */}
      <div className="mb-6 border-2 border-border bg-card p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] max-w-md text-xs font-mono font-bold uppercase">
        🚀 Semester Aktif: <span className="text-accent font-extrabold">{activeSemester?.name || "TIDAK ADA"}</span>
      </div>

      {isFormOpen && (
        <div className="mb-8 border-2 border-border bg-card p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
          <h2 className="text-xl font-bold uppercase font-mono mb-4">
            {editingAssignment ? "Edit Tugas Kuliah" : "Tambah Tugas Kuliah Baru"}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="courseSelect">Mata Kuliah *</FieldLabel>
                <select
                  id="courseSelect"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="flex h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-hidden"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.code ? `(${c.code})` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="taskTitle">Judul Tugas *</FieldLabel>
                <Input
                  id="taskTitle"
                  placeholder="Contoh: Laporan Normalisasi DB"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="taskDesc">Deskripsi Tugas</FieldLabel>
              <textarea
                id="taskDesc"
                placeholder="Rincian instruksi tugas, link referensi, dll."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-20 w-full border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-hidden"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="dueDate">Tenggat Waktu *</FieldLabel>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="prioritySelect">Prioritas</FieldLabel>
                <select
                  id="prioritySelect"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="flex h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-hidden"
                >
                  <option value="LOW">LOW (Rendah)</option>
                  <option value="MEDIUM">MEDIUM (Sedang)</option>
                  <option value="HIGH">HIGH (Tinggi)</option>
                </select>
              </Field>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSaving} className="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                {isSaving ? "Menyimpan..." : "Simpan Tugas"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
              >
                Batal
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs Filter */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-border/40 pb-4">
        {(["ALL", "TODO", "IN_PROGRESS", "DONE"] as const).map((tab) => {
          const isActive = activeTab === tab;
          const label =
            tab === "ALL"
              ? "Semua Tugas"
              : tab === "TODO"
              ? "Belum Mulai (TODO)"
              : tab === "IN_PROGRESS"
              ? "Sedang Dikerjakan"
              : "Selesai (DONE)";
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-2 border-border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[2px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                  : "bg-background text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:bg-muted dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : filteredAssignments.length === 0 ? (
        <div className="border-2 border-dashed border-border p-12 text-center bg-card">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mx-auto size-12 text-muted-foreground mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.375c1.08 0 1.95-.87 1.95-1.95v-9c0-1.08-.87-1.95-1.95-1.95H4.95C3.87 1.125 3 1.995 3 3.075v9c0 1.08.87 1.95 1.95 1.95H9Zm0 0v2.4a2.4 2.4 0 0 0 2.4 2.4h3.6a2.4 2.4 0 0 0 2.4-2.4V12M9 12h3.75M16.5 21.15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          </svg>
          <h3 className="text-lg font-bold font-mono uppercase mb-1">Tidak Ada Tugas</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {activeTab === "ALL"
              ? "Tambahkan tugas baru untuk mulai memantau perkembangan belajar Anda."
              : "Tidak ada tugas dengan status filter ini."}
          </p>
          {activeTab === "ALL" && (
            <button
              onClick={openAddForm}
              className="px-4 py-2 border-2 border-border font-bold text-xs uppercase tracking-wider transition-all bg-background text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:bg-muted dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
            >
              Tambah Sekarang
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2 gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 truncate uppercase">
                    {assignment.course.name}
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => openEditForm(assignment)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.82a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      title="Hapus"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
                <h3 className="text-base font-bold font-mono uppercase tracking-tight mb-1">{assignment.title}</h3>
                {assignment.description && (
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                    {assignment.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 border ${getPriorityColor(assignment.priority)}`}>
                    PRIORITY: {assignment.priority}
                  </span>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 border ${
                    assignment.status === "DONE"
                      ? "bg-green-500/10 text-green-600 border-green-500/20"
                      : assignment.status === "IN_PROGRESS"
                      ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                  }`}>
                    STATUS: {assignment.status}
                  </span>
                </div>
              </div>

              <div className="border-t border-border/40 pt-3 mt-2 flex flex-col gap-3">
                <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-3.5 text-destructive shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span>Deadline: <span className="font-bold text-foreground">{formatDate(assignment.dueDate)}</span></span>
                </div>

                <div className="flex gap-2">
                  {assignment.status !== "TODO" && (
                    <button
                      onClick={() => handleStatusChange(assignment, "TODO")}
                      className="flex-1 py-1.5 px-2 border-2 border-border font-bold text-[10px] uppercase tracking-wider text-center transition-all bg-background text-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:bg-muted dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]"
                    >
                      Mundur ke TODO
                    </button>
                  )}
                  {assignment.status !== "IN_PROGRESS" && (
                    <button
                      onClick={() => handleStatusChange(assignment, "IN_PROGRESS")}
                      className="flex-1 py-1.5 px-2 border-2 border-border font-bold text-[10px] uppercase tracking-wider text-center transition-all bg-primary text-primary-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:bg-primary/90 dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]"
                    >
                      Kerjakan
                    </button>
                  )}
                  {assignment.status !== "DONE" && (
                    <button
                      onClick={() => handleStatusChange(assignment, "DONE")}
                      className="flex-1 py-1.5 px-2 border-2 border-border font-bold text-[10px] uppercase tracking-wider text-center transition-all bg-green-600 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:bg-green-700 dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]"
                    >
                      Selesai (DONE)
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
