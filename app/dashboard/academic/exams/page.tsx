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

interface Exam {
  id: string;
  courseId: string;
  title: string;
  date: string;
  room: string | null;
  type: "OPEN_BOOK" | "CLOSED_BOOK" | "TAKE_HOME";
  course: Course;
}

const EXAM_TYPES = [
  { value: "CLOSED_BOOK", label: "Closed Book (Ujian Tertutup)" },
  { value: "OPEN_BOOK", label: "Open Book (Ujian Terbuka)" },
  { value: "TAKE_HOME", label: "Take Home (Bawa Pulang)" },
];

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<"UPCOMING" | "PAST">("UPCOMING");

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [room, setRoom] = useState("");
  const [type, setType] = useState("CLOSED_BOOK");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [coursesRes, examsRes, semestersRes] = await Promise.all([
        fetch("/api/academic/courses"), // Automatically filters by active semester
        fetch("/api/academic/exams"), // Automatically filters by active semester
        fetch("/api/academic/semesters"),
      ]);

      if (!coursesRes.ok || !examsRes.ok || !semestersRes.ok) throw new Error("Gagal memuat data");

      const coursesData = await coursesRes.json();
      const examsData = await examsRes.json();
      const semestersData = await semestersRes.json();

      setCourses(coursesData);
      setExams(examsData);
      setSemesters(semestersData);

      if (coursesData.length > 0 && !courseId) {
        setCourseId(coursesData[0].id);
      }
    } catch (error) {
      toast.error("Gagal memuat data ujian");
    } finally {
      setIsLoading(false);
    }
  };

  const openAddForm = () => {
    if (courses.length === 0) {
      toast.error("Silakan tambahkan mata kuliah terlebih dahulu untuk semester aktif!");
      return;
    }
    setEditingExam(null);
    setCourseId(courses[0].id);
    setTitle("");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    tomorrow.setHours(9, 0, 0, 0);
    const dateStr = tomorrow.toISOString().slice(0, 16);
    setDate(dateStr);
    setRoom("");
    setType("CLOSED_BOOK");
    setIsFormOpen(true);
  };

  const openEditForm = (exam: Exam) => {
    setEditingExam(exam);
    setCourseId(exam.courseId);
    setTitle(exam.title);
    const formattedDate = new Date(exam.date).toISOString().slice(0, 16);
    setDate(formattedDate);
    setRoom(exam.room || "");
    setType(exam.type);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !title || !date) {
      toast.error("Mata kuliah, Judul, dan Tanggal Ujian wajib diisi!");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingExam
        ? `/api/academic/exams/${editingExam.id}`
        : "/api/academic/exams";
      const method = editingExam ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title,
          date: new Date(date).toISOString(),
          room,
          type,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan jadwal ujian");
      } else {
        toast.success(
          editingExam
            ? "Jadwal ujian berhasil diperbarui!"
            : "Jadwal ujian berhasil ditambahkan!"
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

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus jadwal ujian ini?")) {
      return;
    }

    try {
      const res = await fetch(`/api/academic/exams/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus");
      }
      toast.success("Jadwal ujian berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus jadwal ujian");
    }
  };

  const now = new Date();
  const filteredExams = exams.filter((exam) => {
    const examDate = new Date(exam.date);
    if (filterMode === "UPCOMING") {
      return examDate >= now;
    } else {
      return examDate < now;
    }
  });

  const getExamTypeBadge = (t: string) => {
    switch (t) {
      case "CLOSED_BOOK":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "OPEN_BOOK":
        return "bg-primary/10 text-primary border-primary/20";
      case "TAKE_HOME":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
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
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Jadwal Ujian</h1>
          <p className="text-muted-foreground">
            Kelola jadwal UTS, UAS, dan evaluasi mata kuliah untuk semester aktif saat ini.
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
            <span>Tambah Ujian</span>
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
            {editingExam ? "Edit Jadwal Ujian" : "Tambah Jadwal Ujian Baru"}
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
                <FieldLabel htmlFor="examTitle">Judul Ujian *</FieldLabel>
                <Input
                  id="examTitle"
                  placeholder="Contoh: UTS Teori Basis Data"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="examDate">Tanggal & Waktu Ujian *</FieldLabel>
                <Input
                  id="examDate"
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="room">Ruang Ujian</FieldLabel>
                <Input
                  id="room"
                  placeholder="Contoh: Ruang C-102"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="examType">Sifat Ujian</FieldLabel>
                <select
                  id="examType"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="flex h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-hidden"
                >
                  {EXAM_TYPES.map((et) => (
                    <option key={et.value} value={et.value}>
                      {et.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSaving} className="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                {isSaving ? "Menyimpan..." : "Simpan Jadwal"}
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
      <div className="flex gap-2 mb-6 border-b border-border/40 pb-4">
        <button
          onClick={() => setFilterMode("UPCOMING")}
          className={`px-4 py-2 border-2 border-border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            filterMode === "UPCOMING"
              ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[2px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
              : "bg-background text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:bg-muted dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
          }`}
        >
          Ujian Mendatang
        </button>
        <button
          onClick={() => setFilterMode("PAST")}
          className={`px-4 py-2 border-2 border-border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            filterMode === "PAST"
              ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[2px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
              : "bg-background text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:bg-muted dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
          }`}
        >
          Riwayat Ujian
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : filteredExams.length === 0 ? (
        <div className="border-2 border-dashed border-border p-12 text-center bg-card">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mx-auto size-12 text-muted-foreground mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
          <h3 className="text-lg font-bold font-mono uppercase mb-1">Tidak Ada Ujian</h3>
          <p className="text-sm text-muted-foreground">
            {filterMode === "UPCOMING"
              ? "Tidak ada jadwal ujian mendatang. Nikmati waktu santai Anda!"
              : "Belum ada riwayat ujian yang tercatat."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2 gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 truncate uppercase">
                    {exam.course.name}
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => openEditForm(exam)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.82a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      title="Hapus"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
                <h3 className="text-base font-bold font-mono uppercase tracking-tight mb-2">{exam.title}</h3>
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 border ${getExamTypeBadge(exam.type)}`}>
                  {exam.type.replace("_", " ")}
                </span>
              </div>

              <div className="border-t border-border/40 pt-3 mt-4 flex flex-col gap-2 text-xs font-mono text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-3.5 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  <span>Waktu: <span className="font-bold text-foreground">{formatDate(exam.date)}</span></span>
                </div>
                {exam.room && (
                  <div className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-3.5 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    <span>Ruangan: <span className="font-bold text-foreground">{exam.room}</span></span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
