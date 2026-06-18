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
  lecturer: string | null;
  day: string;
  startTime: string;
  endTime: string;
  room: string | null;
  credits: number;
  semesterId: string | null;
}

const DAYS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>("ACTIVE");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [lecturer, setLecturer] = useState("");
  const [day, setDay] = useState("Senin");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");
  const [room, setRoom] = useState("");
  const [credits, setCredits] = useState("2");
  const [semesterId, setSemesterId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    if (semesters.length > 0) {
      fetchCourses();
    }
  }, [semesters, selectedSemesterFilter]);

  const fetchSemesters = async () => {
    try {
      const res = await fetch("/api/academic/semesters");
      if (!res.ok) throw new Error("Gagal");
      const data = await res.json();
      setSemesters(data);

      const active = data.find((s: Semester) => s.isActive);
      if (active) {
        setSemesterId(active.id);
      } else if (data.length > 0) {
        setSemesterId(data[0].id);
      }
    } catch (error) {
      console.error("Gagal memuat semester", error);
    }
  };

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      let url = "/api/academic/courses";
      if (selectedSemesterFilter === "ACTIVE") {
        // Automatically filtered by active semester by default on the backend
      } else if (selectedSemesterFilter !== "ALL") {
        url += `?semesterId=${selectedSemesterFilter}`;
      } else {
        url += "?semesterId=ALL";
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      setCourses(data);
    } catch (error) {
      toast.error("Gagal memuat mata kuliah");
    } finally {
      setIsLoading(false);
    }
  };

  const openAddForm = () => {
    if (semesters.length === 0) {
      toast.error("Silakan buat semester terlebih dahulu di menu 'Kelola Semester'!");
      return;
    }
    setEditingCourse(null);
    setName("");
    setCode("");
    setLecturer("");
    setDay("Senin");
    setStartTime("08:00");
    setEndTime("10:00");
    setRoom("");
    setCredits("2");

    // Default to currently selected semester filter or active semester
    const active = semesters.find((s) => s.isActive);
    if (selectedSemesterFilter !== "ALL" && selectedSemesterFilter !== "ACTIVE") {
      setSemesterId(selectedSemesterFilter);
    } else if (active) {
      setSemesterId(active.id);
    } else {
      setSemesterId(semesters[0].id);
    }

    setIsFormOpen(true);
  };

  const openEditForm = (course: Course) => {
    setEditingCourse(course);
    setName(course.name);
    setCode(course.code || "");
    setLecturer(course.lecturer || "");
    setDay(course.day);
    setStartTime(course.startTime);
    setEndTime(course.endTime);
    setRoom(course.room || "");
    setCredits(String(course.credits));
    setSemesterId(course.semesterId || semesters[0]?.id || "");
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !day || !startTime || !endTime) {
      toast.error("Nama, Hari, Jam Mulai, dan Jam Selesai wajib diisi!");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingCourse
        ? `/api/academic/courses/${editingCourse.id}`
        : "/api/academic/courses";
      const method = editingCourse ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          lecturer,
          day,
          startTime,
          endTime,
          room,
          credits: parseInt(credits, 10) || 2,
          semesterId: semesterId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan data");
      } else {
        toast.success(
          editingCourse
            ? "Mata kuliah berhasil diperbarui!"
            : "Mata kuliah berhasil ditambahkan!"
        );
        setIsFormOpen(false);
        fetchCourses();
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus mata kuliah ini? Semua tugas dan ujian terkait juga akan dihapus.")) {
      return;
    }

    try {
      const res = await fetch(`/api/academic/courses/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus");
      }
      toast.success("Mata kuliah berhasil dihapus");
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus mata kuliah");
    }
  };

  const activeSemester = semesters.find((s) => s.isActive);

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Mata Kuliah</h1>
          <p className="text-muted-foreground">
            Kelola daftar mata kuliah, jadwal mingguan, dan dosen pengampu Anda.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 px-5 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider text-left transition-all cursor-pointer bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Tambah Matkul</span>
          </button>
        </div>
      </div>

      {/* Semester Filter Dropdown */}
      <div className="mb-6 flex items-center gap-3 border-2 border-border bg-card p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] w-full max-w-md">
        <label htmlFor="semesterFilter" className="text-xs font-mono font-bold uppercase shrink-0">
          Semester:
        </label>
        <select
          id="semesterFilter"
          value={selectedSemesterFilter}
          onChange={(e) => setSelectedSemesterFilter(e.target.value)}
          className="flex-1 min-w-0 w-full h-9 border-2 border-border bg-background px-3 text-xs font-mono font-bold uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] focus-visible:outline-hidden cursor-pointer dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]"
        >
          <option value="ACTIVE">Semester Aktif ({activeSemester?.name || "Tidak Ada"})</option>
          <option value="ALL">Semua Semester</option>
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {isFormOpen && (
        <div className="mb-8 border-2 border-border bg-card p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
          <h2 className="text-xl font-bold uppercase font-mono mb-4">
            {editingCourse ? "Edit Mata Kuliah" : "Tambah Mata Kuliah Baru"}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <Field>
                <FieldLabel htmlFor="courseName">Nama Mata Kuliah *</FieldLabel>
                <Input
                  id="courseName"
                  placeholder="Contoh: Pemrograman Web"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="courseCode">Kode Matkul</FieldLabel>
                <Input
                  id="courseCode"
                  placeholder="Contoh: IF224"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="credits">SKS</FieldLabel>
                <Input
                  id="credits"
                  type="number"
                  placeholder="Contoh: 3"
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="courseSemester">Semester *</FieldLabel>
                <select
                  id="courseSemester"
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                  className="flex h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-hidden"
                >
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="lecturer">Dosen Pengampu</FieldLabel>
                <Input
                  id="lecturer"
                  placeholder="Contoh: Ir. Rina Wijaya"
                  value={lecturer}
                  onChange={(e) => setLecturer(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="room">Ruang Kelas</FieldLabel>
                <Input
                  id="room"
                  placeholder="Contoh: Ruang A-402"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="day">Hari Kuliah *</FieldLabel>
                <select
                  id="day"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="flex h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-hidden"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="startTime">Jam Mulai (HH:MM) *</FieldLabel>
                <Input
                  id="startTime"
                  placeholder="Contoh: 08:00"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="endTime">Jam Selesai (HH:MM) *</FieldLabel>
                <Input
                  id="endTime"
                  placeholder="Contoh: 10:30"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </Field>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSaving} className="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                {isSaving ? "Menyimpan..." : "Simpan Mata Kuliah"}
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

      {isLoading ? (
        <TableSkeleton />
      ) : courses.length === 0 ? (
        <div className="border-2 border-dashed border-border p-12 text-center bg-card">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mx-auto size-12 text-muted-foreground mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
          <h3 className="text-lg font-bold font-mono uppercase mb-1">Belum Ada Mata Kuliah</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tambahkan mata kuliah Anda untuk semester ini.
          </p>
          <button
            onClick={openAddForm}
            className="px-4 py-2 border-2 border-border font-bold text-xs uppercase tracking-wider transition-all bg-background text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:bg-muted dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
          >
            Tambah Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const courseSemester = semesters.find((s) => s.id === course.semesterId);
            return (
              <div
                key={course.id}
                className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1 transition-all flex flex-col justify-between min-h-[200px]"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 uppercase">
                      {course.code || "NO CODE"} • {course.credits} SKS
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditForm(course)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.82a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        title="Hapus"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold font-mono uppercase tracking-tight mb-1">{course.name}</h3>
                  {course.lecturer && (
                    <p className="text-xs text-muted-foreground mb-1">
                      Dosen: <span className="font-semibold">{course.lecturer}</span>
                    </p>
                  )}
                  <p className="text-[10px] font-mono text-muted-foreground/80 mb-3">
                    Semester: <span className="font-bold uppercase text-primary/70">{courseSemester?.name || "Tanpa Semester"}</span>
                  </p>
                </div>
                <div className="border-t border-border/40 pt-3 mt-2 flex flex-wrap justify-between items-center text-xs font-mono text-muted-foreground gap-2">
                  <div className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                    <span>{course.day}, {course.startTime} - {course.endTime}</span>
                  </div>
                  {course.room && (
                    <div className="flex items-center gap-1 px-2 py-0.5 border border-border/60 bg-muted/30">
                      <span>{course.room}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
