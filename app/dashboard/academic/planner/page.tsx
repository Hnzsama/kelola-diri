"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
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

interface CalendarEvent {
  id: string;
  type: "CLASS" | "ASSIGNMENT" | "EXAM" | "PRESENTATION" | "DEBT" | "RECEIVABLE" | "BILL";
  title: string;
  subtitle: string;
  date: Date;
  endDate?: Date;
  room?: string;
  priority?: string;
  status?: string;
  details?: string;
}

const DAYS_INDONESIAN = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const DAY_MAP_ID_TO_INDEX: { [key: string]: number } = {
  minggu: 0,
  sunday: 0,
  senin: 1,
  monday: 1,
  selasa: 2,
  tuesday: 2,
  rabu: 3,
  wednesday: 3,
  kamis: 4,
  thursday: 4,
  jumat: 5,
  friday: 5,
  sabtu: 6,
  saturday: 6,
};

export default function AcademicPlannerPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date("2026-06-14"));
  const [viewMode, setViewMode] = useState<"MONTH" | "WEEK" | "AGENDA">("WEEK");
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [recurringBills, setRecurringBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    fetchPlannerData();
  }, []);

  const fetchPlannerData = async () => {
    try {
      setIsLoading(true);
      const [coursesRes, assignmentsRes, examsRes, semestersRes, debtsRes, recurringRes] = await Promise.all([
        fetch("/api/academic/courses"),
        fetch("/api/academic/assignments"),
        fetch("/api/academic/exams"),
        fetch("/api/academic/semesters"),
        fetch("/api/finance/debts").catch(() => null),
        fetch("/api/finance/recurring").catch(() => null),
      ]);

      if (!coursesRes.ok || !assignmentsRes.ok || !examsRes.ok || !semestersRes.ok) {
        throw new Error("Gagal mengambil data dari server");
      }

      const coursesData = await coursesRes.json();
      const assignmentsData = await assignmentsRes.json();
      const examsData = await examsRes.json();
      const semestersData = await semestersRes.json();
      const debtsData = debtsRes && debtsRes.ok ? await debtsRes.json() : [];
      const recurringData = recurringRes && recurringRes.ok ? await recurringRes.json() : [];

      setCourses(coursesData);
      setAssignments(assignmentsData);
      setExams(examsData);
      setSemesters(semestersData);
      setDebts(debtsData);
      setRecurringBills(recurringData);
    } catch (error) {
      toast.error("Gagal memuat jadwal planner");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedDummy = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/academic/dummy", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal memuat data contoh");
      } else {
        toast.success(data.success || "Data contoh berhasil dimuat!");
        fetchPlannerData();
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSeeding(false);
    }
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const dateStr = date.toISOString().split("T")[0];

    // 1. Weekly Class Schedules
    const dayOfWeekIndex = date.getDay();
    courses.forEach((course) => {
      const courseDayIndex = DAY_MAP_ID_TO_INDEX[course.day.toLowerCase()];
      if (courseDayIndex === dayOfWeekIndex) {
        const [startH, startM] = course.startTime.split(":").map(Number);
        const [endH, endM] = course.endTime.split(":").map(Number);

        const eventDate = new Date(date);
        eventDate.setHours(startH, startM, 0, 0);

        const eventEndDate = new Date(date);
        eventEndDate.setHours(endH, endM, 0, 0);

        events.push({
          id: `class-${course.id}-${dateStr}`,
          type: "CLASS",
          title: `📚 ${course.name}`,
          subtitle: `${course.startTime} - ${course.endTime}`,
          date: eventDate,
          endDate: eventEndDate,
          room: course.room || undefined,
          details: `Dosen: ${course.lecturer || "-"} • SKS: ${course.credits}`,
        });
      }
    });

    // 2. Assignments
    assignments.forEach((assignment) => {
      const assignDate = new Date(assignment.dueDate);
      const assignDateStr = assignDate.toISOString().split("T")[0];

      if (assignDateStr === dateStr) {
        const isPresentation =
          assignment.title.toLowerCase().includes("presentasi") ||
          (assignment.description && assignment.description.toLowerCase().includes("presentasi"));

        events.push({
          id: `assignment-${assignment.id}`,
          type: isPresentation ? "PRESENTATION" : "ASSIGNMENT",
          title: isPresentation ? `🎤 ${assignment.title}` : `📝 ${assignment.title}`,
          subtitle: `Tenggat: ${assignDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
          date: assignDate,
          priority: assignment.priority,
          status: assignment.status,
          details: assignment.description || undefined,
        });
      }
    });

    // 3. Exams
    exams.forEach((exam) => {
      const examDate = new Date(exam.date);
      const examDateStr = examDate.toISOString().split("T")[0];

      if (examDateStr === dateStr) {
        const isPresentation =
          exam.title.toLowerCase().includes("presentasi");

        events.push({
          id: `exam-${exam.id}`,
          type: isPresentation ? "PRESENTATION" : "EXAM",
          title: isPresentation ? `🎤 ${exam.title}` : `📖 ${exam.title}`,
          subtitle: `Jam: ${examDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
          date: examDate,
          room: exam.room || undefined,
          details: `Sifat: ${exam.type.replace("_", " ")}`,
        });
      }
    });

    // 4. Debts and Receivables
    debts.forEach((debt) => {
      const debtDate = new Date(debt.dueDate);
      const debtDateStr = debtDate.toISOString().split("T")[0];
      if (debtDateStr === dateStr) {
        events.push({
          id: `debt-${debt.id}`,
          type: debt.type,
          title: debt.type === "DEBT" ? `👤 Hutang ke ${debt.contact}` : `👤 Piutang dari ${debt.contact}`,
          subtitle: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(debt.amount),
          date: debtDate,
          details: `Tujuan: ${debt.purpose} | Status: ${debt.status === "PAID" ? "Lunas" : "Belum Lunas"}`,
        });
      }
    });

    // 5. Recurring Bills
    recurringBills.forEach((bill) => {
      if (bill.isActive && date.getDate() === bill.dueDay) {
        events.push({
          id: `bill-${bill.id}-${dateStr}`,
          type: "BILL",
          title: `💸 Tagihan: ${bill.name}`,
          subtitle: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(bill.amount),
          date: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0),
          details: `Tagihan berulang bulanan tanggal ${bill.dueDay}`,
        });
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const days: Date[] = [];
    let startOffset = firstDayOfMonth.getDay();
    startOffset = startOffset === 0 ? 6 : startOffset - 1;

    for (let i = startOffset; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const getDaysInWeek = (date: Date): Date[] => {
    const day = date.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(monday.getDate() + mondayOffset);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const prevPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "MONTH") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "MONTH") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date("2026-06-14"));
  };

  const getSidebarEvents = (filter: "TODAY" | "THIS_WEEK" | "NEXT_WEEK"): CalendarEvent[] => {
    const refDate = new Date("2026-06-14");
    refDate.setHours(0, 0, 0, 0);

    const events: CalendarEvent[] = [];
    for (let i = -1; i < 20; i++) {
      const activeD = new Date(refDate);
      activeD.setDate(refDate.getDate() + i);
      events.push(...getEventsForDate(activeD));
    }

    return events.filter((ev) => {
      const evDate = new Date(ev.date);
      evDate.setHours(0, 0, 0, 0);

      const todayTime = refDate.getTime();
      const evTime = evDate.getTime();

      if (filter === "TODAY") {
        return evTime === todayTime;
      } else if (filter === "THIS_WEEK") {
        const dayOfWeek = refDate.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(refDate);
        monday.setDate(refDate.getDate() + mondayOffset);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        return evTime >= monday.getTime() && evTime <= sunday.getTime();
      } else {
        const dayOfWeek = refDate.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const nextMonday = new Date(refDate);
        nextMonday.setDate(refDate.getDate() + mondayOffset + 7);

        const nextSunday = new Date(nextMonday);
        nextSunday.setDate(nextMonday.getDate() + 6);

        return evTime >= nextMonday.getTime() && evTime <= nextSunday.getTime();
      }
    });
  };

  const getEventBgColor = (type: string) => {
    switch (type) {
      case "CLASS":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-400/30 hover:bg-blue-500/20";
      case "ASSIGNMENT":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/30 hover:bg-amber-500/20";
      case "EXAM":
        return "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20";
      case "PRESENTATION":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-400/30 hover:bg-purple-500/20";
      case "DEBT":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-400/30 hover:bg-rose-500/20";
      case "RECEIVABLE":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-400/30 hover:bg-emerald-500/20";
      case "BILL":
        return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-400/30 hover:bg-indigo-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case "CLASS":
        return "bg-blue-500 text-white";
      case "ASSIGNMENT":
        return "bg-amber-500 text-white";
      case "EXAM":
        return "bg-destructive text-white";
      case "PRESENTATION":
        return "bg-purple-500 text-white";
      case "DEBT":
        return "bg-rose-500 text-white";
      case "RECEIVABLE":
        return "bg-emerald-500 text-white";
      case "BILL":
        return "bg-indigo-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const currentMonthLabel = currentDate.toLocaleString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const activeSemester = semesters.find((s) => s.isActive);

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Title */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Planner Akademik</h1>
          <p className="text-muted-foreground">
            Kalender terintegrasi yang menyatukan jadwal kuliah, tugas, presentasi, dan ujian.
          </p>
        </div>
        {courses.length === 0 && (
          <div>
            <button
              onClick={handleSeedDummy}
              disabled={isSeeding}
              className="flex items-center gap-2 px-5 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider text-left transition-all cursor-pointer bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.656 48.656 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3M4.5 12l-3 3m3-3 3 3M4.5 12c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662" />
              </svg>
              <span>{isSeeding ? "Memuat..." : "Muat Data Contoh"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Active Semester Header Banner */}
      <div className="mb-6 border-2 border-border bg-card p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] max-w-md text-xs font-mono font-bold uppercase">
        🚀 Semester Aktif: <span className="text-accent font-extrabold">{activeSemester?.name || "BELUM ADA (Silakan buat di 'Kelola Semester')"}</span>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row items-start">
        {/* LEFT COLUMN: Main Calendar */}
        <div className="flex-1 w-full border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] p-4 sm:p-6">
          {/* Calendar Navigation & Modes */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={prevPeriod}
                className="p-2 border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-[1px] hover:bg-muted transition-all active:translate-y-[1px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <h2 className="text-xl font-bold font-mono uppercase">{currentMonthLabel}</h2>
              <button
                onClick={nextPeriod}
                className="p-2 border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-[1px] hover:bg-muted transition-all active:translate-y-[1px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 border-2 border-border text-xs font-bold font-mono uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-[1px] hover:bg-muted transition-all active:translate-y-[1px]"
              >
                Hari Ini
              </button>
            </div>

            <div className="flex border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              {(["MONTH", "WEEK", "AGENDA"] as const).map((mode) => {
                const isActive = viewMode === mode;
                const label = mode === "MONTH" ? "Bulanan" : mode === "WEEK" ? "Mingguan" : "Agenda";
                return (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 text-xs font-bold font-mono uppercase cursor-pointer transition-all ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"
                    } ${mode !== "AGENDA" ? "border-r-2 border-border" : ""}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-[40vh] items-center justify-center text-muted-foreground font-mono">
              Memuat kalender terpadu semester...
            </div>
          ) : semesters.length === 0 ? (
            <div className="border-2 border-dashed border-border p-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mx-auto size-12 text-muted-foreground mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <h3 className="text-lg font-bold font-mono uppercase mb-1">Semester Belum Dibuat</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Silakan muat data contoh untuk membuat semester dummy secara instan atau buat manual di menu Kelola Semester.
              </p>
              <button
                onClick={handleSeedDummy}
                disabled={isSeeding}
                className="px-4 py-2 border-2 border-border font-bold text-xs uppercase tracking-wider transition-all bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
              >
                {isSeeding ? "Memproses..." : "Muat Data Contoh"}
              </button>
            </div>
          ) : (
            <>
              {/* MONTH VIEW */}
              {viewMode === "MONTH" && (
                <div className="grid grid-cols-7 border-t border-l border-border/80">
                  {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((dayName) => (
                    <div
                      key={dayName}
                      className="border-r border-b border-border/85 bg-muted/40 p-2 text-center text-xs font-bold font-mono uppercase tracking-wider"
                    >
                      {dayName}
                    </div>
                  ))}

                  {getDaysInMonth(currentDate).map((dayDate, idx) => {
                    const isCurrentMonth = dayDate.getMonth() === currentDate.getMonth();
                    const isToday =
                      dayDate.toDateString() === new Date("2026-06-14").toDateString();
                    const dayEvents = getEventsForDate(dayDate);

                    return (
                      <div
                        key={idx}
                        className={`min-h-[100px] border-r border-b border-border/70 p-1 flex flex-col justify-between transition-colors ${
                          isCurrentMonth ? "bg-background" : "bg-muted/15 text-muted-foreground opacity-50"
                        } ${isToday ? "bg-accent/10 outline-2 outline-accent outline-offset-[-2px]" : ""}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span
                            className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-sm ${
                              isToday ? "bg-accent text-accent-foreground" : ""
                            }`}
                          >
                            {dayDate.getDate()}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] pr-0.5 scrollbar-thin">
                          {dayEvents.slice(0, 3).map((event) => (
                            <button
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className={`text-[10px] text-left font-mono font-semibold px-1 py-0.5 border rounded-sm truncate cursor-pointer transition-all ${getEventBgColor(
                                event.type
                              )}`}
                              title={event.title}
                            >
                              {event.title}
                            </button>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-[9px] font-mono text-muted-foreground pl-1 font-bold">
                              +{dayEvents.length - 3} lainnya
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* WEEK VIEW */}
              {viewMode === "WEEK" && (
                <div className="grid grid-cols-1 md:grid-cols-7 border-t border-l border-border/85">
                  {getDaysInWeek(currentDate).map((dayDate, idx) => {
                    const isToday =
                      dayDate.toDateString() === new Date("2026-06-14").toDateString();
                    const dayEvents = getEventsForDate(dayDate);
                    const weekdayName = DAYS_INDONESIAN[dayDate.getDay()];

                    return (
                      <div
                        key={idx}
                        className={`min-h-[250px] border-r border-b border-border/80 flex flex-col ${
                          isToday ? "bg-accent/5" : ""
                        }`}
                      >
                        <div
                          className={`p-2 border-b border-border text-center flex flex-col items-center gap-0.5 ${
                            isToday ? "bg-accent text-accent-foreground" : "bg-muted/30"
                          }`}
                        >
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                            {weekdayName}
                          </span>
                          <span className="text-sm font-bold font-mono">
                            {dayDate.getDate()} {dayDate.toLocaleString("id-ID", { month: "short" })}
                          </span>
                        </div>

                        <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto max-h-[300px]">
                          {dayEvents.length === 0 ? (
                            <span className="text-[10px] text-muted-foreground font-mono italic text-center mt-4">
                              Tidak ada kegiatan
                            </span>
                          ) : (
                            dayEvents.map((event) => (
                              <div
                                key={event.id}
                                onClick={() => setSelectedEvent(event)}
                                className={`p-2 border rounded-sm cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between text-left min-h-[65px] ${getEventBgColor(
                                  event.type
                                )}`}
                              >
                                <div>
                                  <h4 className="text-[11px] font-bold font-mono uppercase tracking-tight line-clamp-2">
                                    {event.title}
                                  </h4>
                                  <p className="text-[9px] font-mono opacity-80 mt-0.5">
                                    {event.subtitle}
                                  </p>
                                </div>
                                {event.room && (
                                  <span className="text-[8px] font-mono font-semibold px-1 py-0.2 border border-current/20 w-fit mt-1.5 uppercase bg-background/50">
                                    {event.room}
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* AGENDA VIEW */}
              {viewMode === "AGENDA" && (
                <div className="space-y-6">
                  {Array.from({ length: 14 }).map((_, idx) => {
                    const targetD = new Date(currentDate);
                    targetD.setDate(currentDate.getDate() + idx - 3);
                    const dayEvents = getEventsForDate(targetD);

                    if (dayEvents.length === 0) return null;

                    const isToday =
                      targetD.toDateString() === new Date("2026-06-14").toDateString();

                    return (
                      <div
                        key={idx}
                        className={`border-2 border-border p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] ${
                          isToday ? "bg-accent/5 border-accent" : "bg-card"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-3 border-b border-border/20 pb-2">
                          <h3 className="font-mono font-bold text-sm uppercase">
                            {DAYS_INDONESIAN[targetD.getDay()]},{" "}
                            {targetD.toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </h3>
                          {isToday && (
                            <span className="bg-accent text-accent-foreground text-[9px] font-mono font-bold px-2 py-0.5 border border-accent uppercase">
                              Hari Ini
                            </span>
                          )}
                        </div>

                        <div className="space-y-3">
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className="flex items-start justify-between gap-4 p-3 border border-border/60 hover:bg-muted/20 cursor-pointer transition-colors"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[8px] font-bold font-mono px-1.5 py-0.2 uppercase ${getEventBadgeColor(event.type)}`}>
                                    {event.type}
                                  </span>
                                  <h4 className="font-mono font-bold text-sm">{event.title}</h4>
                                </div>
                                <p className="text-xs text-muted-foreground pl-1">
                                  {event.subtitle} {event.room ? `• Ruangan: ${event.room}` : ""}
                                </p>
                                {event.details && (
                                  <p className="text-xs text-muted-foreground/85 pl-1 italic line-clamp-1">
                                    {event.details}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1.5 text-xs font-mono shrink-0">
                                {event.priority && (
                                  <span className={`text-[9px] font-bold px-1.5 border ${
                                    event.priority === "HIGH" ? "text-destructive border-destructive/30" : "text-muted-foreground border-border"
                                  }`}>
                                    {event.priority}
                                  </span>
                                )}
                                {event.status && (
                                  <span className={`text-[9px] font-bold px-1.5 border ${
                                    event.status === "DONE" ? "text-green-600 border-green-600/30" : "text-muted-foreground border-border"
                                  }`}>
                                    {event.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar Upcoming */}
        <div className="w-full lg:w-72 shrink-0 space-y-6">
          <div className="border-2 border-border bg-card p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <h3 className="font-mono font-bold text-sm uppercase mb-2">Petunjuk Warna</h3>
            <div className="space-y-1.5 text-xs font-mono font-semibold">
              <div className="flex items-center gap-2">
                <span className="size-3 bg-blue-500 border border-border" />
                <span>Biru: Kuliah Mingguan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 bg-amber-500 border border-border" />
                <span>Oranye: Tenggat Tugas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 bg-destructive border border-border" />
                <span>Merah: UTS / UAS / Ujian</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 bg-purple-500 border border-border" />
                <span>Ungu: Presentasi Kampus</span>
              </div>
            </div>
          </div>

          {semesters.length > 0 && (
            <div className="border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <div className="p-3 border-b-2 border-border bg-muted/20">
                <h3 className="font-mono font-extrabold text-sm uppercase tracking-wider">Agenda Terdekat</h3>
              </div>

              <div className="p-4 space-y-6">
                <div>
                  <h4 className="font-mono font-bold text-xs uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-1 mb-2">
                    Hari Ini
                  </h4>
                  <div className="space-y-2">
                    {getSidebarEvents("TODAY").length === 0 ? (
                      <p className="text-xs text-muted-foreground font-mono italic">Tidak ada agenda hari ini</p>
                    ) : (
                      getSidebarEvents("TODAY").map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`p-2 border cursor-pointer hover:bg-muted/10 transition-colors ${getEventBgColor(ev.type)}`}
                        >
                          <h5 className="text-xs font-bold font-mono truncate">{ev.title}</h5>
                          <p className="text-[10px] font-mono opacity-80">{ev.subtitle}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-mono font-bold text-xs uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-1 mb-2">
                    Minggu Ini
                  </h4>
                  <div className="space-y-2">
                    {getSidebarEvents("THIS_WEEK").length === 0 ? (
                      <p className="text-xs text-muted-foreground font-mono italic">Tidak ada agenda minggu ini</p>
                    ) : (
                      getSidebarEvents("THIS_WEEK").map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`p-2 border cursor-pointer hover:bg-muted/10 transition-colors ${getEventBgColor(ev.type)}`}
                        >
                          <h5 className="text-xs font-bold font-mono truncate">{ev.title}</h5>
                          <p className="text-[10px] font-mono opacity-80">{ev.subtitle}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-mono font-bold text-xs uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-1 mb-2">
                    Minggu Depan
                  </h4>
                  <div className="space-y-2">
                    {getSidebarEvents("NEXT_WEEK").length === 0 ? (
                      <p className="text-xs text-muted-foreground font-mono italic">Tidak ada agenda minggu depan</p>
                    ) : (
                      getSidebarEvents("NEXT_WEEK").map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`p-2 border cursor-pointer hover:bg-muted/10 transition-colors ${getEventBgColor(ev.type)}`}
                        >
                          <h5 className="text-xs font-bold font-mono truncate">{ev.title}</h5>
                          <p className="text-[10px] font-mono opacity-80">{ev.subtitle}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="border-2 border-border bg-card p-6 max-w-md w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
            <div className="flex justify-between items-start gap-4 mb-3">
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 border uppercase ${getEventBadgeColor(selectedEvent.type)}`}>
                {selectedEvent.type}
              </span>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 border-2 border-border shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-[1px] active:translate-y-[1px] bg-background cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <h3 className="text-xl font-bold font-mono uppercase tracking-tight mb-2">
              {selectedEvent.title}
            </h3>

            <div className="space-y-2 text-xs font-mono text-muted-foreground mb-6">
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4 shrink-0 text-foreground">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>Waktu: <span className="font-bold text-foreground">
                  {selectedEvent.date.toLocaleString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span></span>
              </div>

              {selectedEvent.room && (
                <div className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4 shrink-0 text-foreground">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  <span>Ruangan: <span className="font-bold text-foreground">{selectedEvent.room}</span></span>
                </div>
              )}

              {selectedEvent.priority && (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground">Prioritas:</span>
                  <span className={`font-bold px-1.5 border uppercase ${
                    selectedEvent.priority === "HIGH" ? "text-destructive border-destructive/30" : "text-muted-foreground border-border"
                  }`}>
                    {selectedEvent.priority}
                  </span>
                </div>
              )}

              {selectedEvent.status && (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground">Status:</span>
                  <span className={`font-bold px-1.5 border uppercase ${
                    selectedEvent.status === "DONE" ? "text-green-600 border-green-600/30" : "text-muted-foreground border-border"
                  }`}>
                    {selectedEvent.status}
                  </span>
                </div>
              )}
            </div>

            {selectedEvent.details && (
              <div className="border-t border-border/20 pt-4">
                <h4 className="text-xs font-bold font-mono uppercase text-foreground mb-1">Keterangan / Rincian</h4>
                <p className="text-xs leading-relaxed text-muted-foreground bg-muted/20 p-3 border border-border/50">
                  {selectedEvent.details}
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setSelectedEvent(null)}
                className="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] uppercase font-mono font-bold text-xs"
              >
                Tutup Detail
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
