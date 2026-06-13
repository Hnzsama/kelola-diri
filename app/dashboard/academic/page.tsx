"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
}

interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  course: {
    name: string;
  };
}

interface Exam {
  id: string;
  courseId: string;
  title: string;
  date: string;
  room: string | null;
  type: string;
  course: {
    name: string;
  };
}

const DAYS_INDONESIAN = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const REF_DATE = new Date("2026-06-14"); // Tanggal referensi aplikasi

export default function AcademicDashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleTab, setScheduleTab] = useState<"TODAY" | "WEEK">("TODAY");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [coursesRes, assignmentsRes, examsRes, semestersRes] = await Promise.all([
        fetch("/api/academic/courses"),
        fetch("/api/academic/assignments"),
        fetch("/api/academic/exams"),
        fetch("/api/academic/semesters"),
      ]);

      if (!coursesRes.ok || !assignmentsRes.ok || !examsRes.ok || !semestersRes.ok) {
        throw new Error("Gagal mengambil data");
      }

      setCourses(await coursesRes.json());
      setAssignments(await assignmentsRes.json());
      setExams(await examsRes.json());
      setSemesters(await semestersRes.json());
    } catch (error) {
      toast.error("Gagal memuat dashboard akademik");
    } finally {
      setIsLoading(false);
    }
  };

  const activeSemester = semesters.find((s) => s.isActive);

  // Perhitungan Statistik
  const totalCourses = courses.length;
  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);
  
  const pendingAssignments = assignments.filter((a) => a.status !== "DONE");
  const completedAssignmentsCount = assignments.filter((a) => a.status === "DONE").length;
  const totalAssignments = assignments.length;
  const assignmentProgress = totalAssignments > 0 ? Math.round((completedAssignmentsCount / totalAssignments) * 100) : 0;

  const upcomingExams = exams.filter((e) => new Date(e.date) >= REF_DATE);

  // Jadwal Kuliah Hari Ini (Gunakan Senin jika di demo ingin mensimulasikan hari kuliah, tapi di sini gunakan hari dari REF_DATE)
  const todayDayName = DAYS_INDONESIAN[REF_DATE.getDay()]; // "Minggu"
  const todayCourses = courses.filter((c) => c.day.toLowerCase() === todayDayName.toLowerCase())
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Mendapatkan mata kuliah per hari untuk tampilan mingguan
  const getCoursesForDay = (day: string) => {
    return courses.filter((c) => c.day.toLowerCase() === day.toLowerCase())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Gabungkan tugas pending dan ujian mendatang, diurutkan berdasarkan tanggal terdekat
  const upcomingDeadlines = [
    ...assignments
      .filter((a) => a.status !== "DONE" && new Date(a.dueDate) >= REF_DATE)
      .map((a) => ({
        id: `assignment-${a.id}`,
        type: "ASSIGNMENT",
        title: a.title,
        subtitle: a.course.name,
        date: new Date(a.dueDate),
        badgeText: "Tugas",
        badgeColor: "bg-amber-500 text-white",
        priority: a.priority,
        link: "/dashboard/academic/assignments",
      })),
    ...exams
      .filter((e) => new Date(e.date) >= REF_DATE)
      .map((e) => ({
        id: `exam-${e.id}`,
        type: "EXAM",
        title: e.title,
        subtitle: e.course.name,
        date: new Date(e.date),
        badgeText: "Ujian",
        badgeColor: "bg-destructive text-white",
        priority: "HIGH",
        link: "/dashboard/academic/exams",
      })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);

  const getPriorityBorder = (priority?: string) => {
    if (priority === "HIGH") return "border-l-4 border-l-destructive";
    if (priority === "MEDIUM") return "border-l-4 border-l-amber-500";
    return "border-l-4 border-l-blue-500";
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground font-mono">
        Memuat dashboard akademik...
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Title */}
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Dashboard Akademik</h1>
        <p className="text-muted-foreground">
          Pantau mata kuliah, progres tugas, jadwal kuliah harian, dan ujian terdekat Anda.
        </p>
      </div>

      {/* Active Semester Banner */}
      <div className="mb-8 border-2 border-border bg-card p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="font-mono font-bold uppercase text-sm">
          🚀 Semester Aktif: <span className="text-accent text-base font-extrabold">{activeSemester?.name || "Belum Ditetapkan"}</span>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/dashboard/academic/planner">
            <button className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
              Buka Kalender Planner
            </button>
          </Link>
          <Link href="/dashboard/academic/semesters">
            <button className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-background text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
              Kelola Semester
            </button>
          </Link>
        </div>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Courses Card */}
        <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Mata Kuliah</span>
            <h3 className="text-3xl font-extrabold font-mono mt-1">{totalCourses}</h3>
          </div>
          <div className="mt-4 pt-2 border-t border-border/20 text-xs font-mono text-muted-foreground flex justify-between">
            <span>Beban Kuliah:</span>
            <span className="font-bold text-foreground">{totalCredits} SKS</span>
          </div>
        </div>

        {/* Pending Assignments Card */}
        <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Tugas Belum Selesai</span>
            <h3 className="text-3xl font-extrabold font-mono mt-1 text-amber-600 dark:text-amber-400">{pendingAssignments.length}</h3>
          </div>
          <div className="mt-4 pt-2 border-t border-border/20 text-xs font-mono text-muted-foreground flex justify-between">
            <span>Sudah Selesai:</span>
            <span className="font-bold text-foreground">{completedAssignmentsCount} Tugas</span>
          </div>
        </div>

        {/* Upcoming Exams Card */}
        <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Jadwal Ujian Terdekat</span>
            <h3 className="text-3xl font-extrabold font-mono mt-1 text-destructive">{upcomingExams.length}</h3>
          </div>
          <div className="mt-4 pt-2 border-t border-border/20 text-xs font-mono text-muted-foreground flex justify-between">
            <span>Jenis Ujian:</span>
            <span className="font-bold text-foreground">UTS / UAS</span>
          </div>
        </div>

        {/* Tasks Progress Card */}
        <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Persentase Tugas Selesai</span>
            <h3 className="text-3xl font-extrabold font-mono mt-1">{assignmentProgress}%</h3>
          </div>
          <div className="mt-4">
            <div className="w-full bg-muted border border-border h-3 rounded-none overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500"
                style={{ width: `${assignmentProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-start">
        {/* SCHEDULE PANEL (LEFT, 2 COLS) */}
        <div className="lg:col-span-2 border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-4 mb-6">
            <h3 className="font-mono font-extrabold text-lg uppercase tracking-tight flex items-center gap-2">
              📅 Jadwal Perkuliahan
            </h3>

            <div className="flex border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              <button
                onClick={() => setScheduleTab("TODAY")}
                className={`px-3 py-1.5 text-xs font-bold font-mono uppercase cursor-pointer transition-all border-r-2 border-border ${
                  scheduleTab === "TODAY" ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                Hari Ini ({todayDayName})
              </button>
              <button
                onClick={() => setScheduleTab("WEEK")}
                className={`px-3 py-1.5 text-xs font-bold font-mono uppercase cursor-pointer transition-all ${
                  scheduleTab === "WEEK" ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                Semua Hari
              </button>
            </div>
          </div>

          {scheduleTab === "TODAY" ? (
            <div className="space-y-4">
              {todayCourses.length === 0 ? (
                <div className="border-2 border-dashed border-border p-8 text-center text-muted-foreground font-mono text-sm">
                  🌴 Bebas kuliah hari ini! Tidak ada jadwal kuliah untuk hari {todayDayName}.
                </div>
              ) : (
                todayCourses.map((c) => (
                  <div
                    key={c.id}
                    className="border-2 border-border p-4 bg-muted/10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-400/30">
                          {c.code || "KODE"}
                        </span>
                        <h4 className="font-mono font-bold text-base uppercase">{c.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Dosen: <span className="font-bold text-foreground/80">{c.lecturer || "-"}</span> • SKS: <span className="font-bold text-foreground/80">{c.credits}</span>
                      </p>
                    </div>
                    <div className="flex flex-col sm:items-end font-mono text-xs gap-1">
                      <span className="font-bold uppercase tracking-wide bg-background border border-border px-2 py-0.5 w-fit">
                        ⏰ {c.startTime} - {c.endTime}
                      </span>
                      {c.room && (
                        <span className="text-[10px] text-muted-foreground">
                          Ruangan: <span className="font-bold text-foreground">{c.room}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((dayName) => {
                const dayCourses = getCoursesForDay(dayName);
                if (dayCourses.length === 0) return null;

                return (
                  <div key={dayName} className="border-2 border-border p-4">
                    <h4 className="font-mono font-extrabold text-sm uppercase tracking-wider border-b border-border/20 pb-1.5 mb-3 text-primary">
                      {dayName}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dayCourses.map((c) => (
                        <div
                          key={c.id}
                          className="border border-border/80 p-3 bg-card flex flex-col justify-between min-h-[100px]"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[9px] font-bold font-mono px-1.5 bg-muted border border-border/60">
                                {c.code || "NO CODE"}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-muted-foreground">
                                {c.startTime} - {c.endTime}
                              </span>
                            </div>
                            <h5 className="font-mono font-bold text-xs uppercase mb-1 line-clamp-1">{c.name}</h5>
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground border-t border-border/20 pt-2 flex justify-between">
                            <span>Ruang: {c.room || "-"}</span>
                            <span>{c.credits} SKS</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {courses.length === 0 && (
                <div className="border-2 border-dashed border-border p-8 text-center text-muted-foreground font-mono text-sm">
                  Belum ada jadwal kuliah yang terdaftar.
                </div>
              )}
            </div>
          )}
        </div>

        {/* DEADLINES & EXAMS PANEL (RIGHT, 1 COL) */}
        <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <h3 className="font-mono font-extrabold text-lg uppercase tracking-tight border-b border-border/30 pb-4 mb-4 flex items-center gap-2">
            🚨 Agenda Mendatang
          </h3>

          <div className="space-y-4">
            {upcomingDeadlines.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-border text-center text-muted-foreground font-mono text-xs italic">
                Semua beres! Tidak ada tugas pending atau ujian terdekat.
              </div>
            ) : (
              upcomingDeadlines.map((item) => (
                <Link key={item.id} href={item.link} className="block">
                  <div
                    className={`p-3 border-2 border-border bg-muted/5 hover:-translate-y-[2px] hover:bg-muted/20 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer ${getPriorityBorder(
                      item.priority
                    )}`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <span className={`text-[8px] font-bold font-mono px-1.5 uppercase ${item.badgeColor}`}>
                        {item.badgeText}
                      </span>
                      <span className="text-[9px] font-mono text-muted-foreground font-semibold">
                        {item.date.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <h4 className="font-mono font-bold text-xs line-clamp-1 uppercase text-foreground">{item.title}</h4>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">{item.subtitle}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* QUICK LINKS GRID */}
      <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] mb-8">
        <h3 className="font-mono font-extrabold text-sm uppercase tracking-widest border-b border-border/20 pb-3 mb-4 text-muted-foreground">
          ⚡ Akses Cepat Modul Akademik
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link href="/dashboard/academic/planner" className="block text-center border-2 border-border p-4 bg-muted/20 hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
            <span className="block text-base font-bold font-mono uppercase">Planner</span>
            <span className="text-[10px] font-mono opacity-80">Kalender Terpadu</span>
          </Link>
          <Link href="/dashboard/academic/courses" className="block text-center border-2 border-border p-4 bg-muted/20 hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
            <span className="block text-base font-bold font-mono uppercase">Mata Kuliah</span>
            <span className="text-[10px] font-mono opacity-80">Jadwal & Dosen</span>
          </Link>
          <Link href="/dashboard/academic/assignments" className="block text-center border-2 border-border p-4 bg-muted/20 hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
            <span className="block text-base font-bold font-mono uppercase">Tugas</span>
            <span className="text-[10px] font-mono opacity-80">Pelacak Progres</span>
          </Link>
          <Link href="/dashboard/academic/exams" className="block text-center border-2 border-border p-4 bg-muted/20 hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
            <span className="block text-base font-bold font-mono uppercase">Ujian</span>
            <span className="text-[10px] font-mono opacity-80">Jadwal UTS/UAS</span>
          </Link>
          <Link href="/dashboard/academic/semesters" className="block text-center border-2 border-border p-4 bg-muted/20 hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all col-span-2 md:col-span-1">
            <span className="block text-base font-bold font-mono uppercase">Semester</span>
            <span className="text-[10px] font-mono opacity-80">Struktur Semester</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
