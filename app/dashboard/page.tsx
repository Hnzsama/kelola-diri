"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";

export default function RootDashboardPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [orgTasks, setOrgTasks] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [
        resGoals,
        resCourses,
        resAssignments,
        resExams,
        resEvents,
        resOrgTasks,
        resHabits,
      ] = await Promise.all([
        fetch("/api/goals"),
        fetch("/api/academic/courses"),
        fetch("/api/academic/assignments"),
        fetch("/api/academic/exams"),
        fetch("/api/organizations/events"),
        fetch("/api/organizations/tasks"),
        fetch("/api/habits"),
      ]);

      const [
        goalsData,
        coursesData,
        assignmentsData,
        examsData,
        eventsData,
        orgTasksData,
        habitsData,
      ] = await Promise.all([
        resGoals.ok ? resGoals.json() : [],
        resCourses.ok ? resCourses.json() : [],
        resAssignments.ok ? resAssignments.json() : [],
        resExams.ok ? resExams.json() : [],
        resEvents.ok ? resEvents.json() : [],
        resOrgTasks.ok ? resOrgTasks.json() : [],
        resHabits.ok ? resHabits.json() : [],
      ]);

      setGoals(goalsData);
      setCourses(coursesData);
      setAssignments(assignmentsData);
      setExams(examsData);
      setEvents(eventsData);
      setOrgTasks(orgTasksData);
      setHabits(habitsData);
    } catch (error) {
      console.error("[DASHBOARD_FETCH_ERROR]", error);
      toast.error("Gagal memuat data dashboard harian");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleHabit = async (habitId: string, currentlyCompleted: boolean) => {
    const today = new Date();
    const dateStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
    try {
      const res = await fetch("/api/habits/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitId,
          completed: !currentlyCompleted,
          date: dateStr,
        }),
      });

      if (!res.ok) throw new Error("Gagal");

      // Update locally
      const updatedHabits = habits.map((h) => {
        if (h.id === habitId) {
          let updatedLogs = [...(h.logs || [])];
          const logIdx = updatedLogs.findIndex((l) => {
            const logDate = new Date(l.date).toDateString();
            return logDate === today.toDateString();
          });

          if (logIdx >= 0) {
            updatedLogs[logIdx] = { ...updatedLogs[logIdx], completed: !currentlyCompleted };
          } else {
            updatedLogs.push({ date: today.toISOString(), completed: !currentlyCompleted });
          }
          return { ...h, logs: updatedLogs };
        }
        return h;
      });

      setHabits(updatedHabits);
      toast.success(currentlyCompleted ? "Kebiasaan ditandai belum selesai" : "Kebiasaan selesai hari ini! Mantap! 💪");
    } catch {
      toast.error("Gagal menyimpan catatan harian");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground font-mono">
        Memuat dashboard utama Kelola Diri...
      </div>
    );
  }

  // Date and Greeting configuration
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  const todayFormatted = today.toLocaleDateString("id-ID", options);

  const hours = today.getHours();
  let greeting = "Yo, Pagi! ✨";
  if (hours >= 11 && hours < 15) greeting = "Siang, Fam! ⚡";
  else if (hours >= 15 && hours < 18) greeting = "Sore, Guys! 🌇";
  else if (hours >= 18 || hours < 4) greeting = "Malam, Bro/Sis! 🌙";

  const todayDayName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][today.getDay()];
  const todayDateStr = today.toDateString();

  // 1. GABUNGAN AGENDA HARI INI
  const agendaItems: any[] = [];

  // Kuliah
  courses.forEach((c) => {
    if (c.day === todayDayName) {
      agendaItems.push({
        time: c.startTime,
        type: "COURSE",
        title: `Kuliah ${c.name}`,
        subtitle: `🏫 Ruang ${c.room || "—"} · ${c.credits} SKS`,
        rawTime: c.startTime,
      });
    }
  });

  // Rapat / Proker Organisasi
  events.forEach((e) => {
    if (!e.isArchived && new Date(e.date).toDateString() === todayDateStr) {
      const timeStr = new Date(e.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      agendaItems.push({
        time: timeStr,
        type: "ORG_EVENT",
        title: `🏢 Rapat ${e.title}`,
        subtitle: `📍 ${e.location || "—"} (${e.organization.name})`,
        rawTime: timeStr,
      });
    }
  });

  // Ujian
  exams.forEach((ex) => {
    if (new Date(ex.date).toDateString() === todayDateStr) {
      agendaItems.push({
        time: "07:00",
        type: "EXAM",
        title: `🔥 Ujian: ${ex.title}`,
        subtitle: `📚 Kuliah: ${ex.course?.name || "Mata Kuliah"} · 🏫 Ruang ${ex.room || "—"}`,
        rawTime: "07:00",
      });
    }
  });

  // Deadlines (Assignments)
  assignments.forEach((a) => {
    if (a.status !== "DONE" && a.dueDate && new Date(a.dueDate).toDateString() === todayDateStr) {
      agendaItems.push({
        time: "23:59",
        type: "ASSIGNMENT",
        title: `⏳ Deadline Tugas: ${a.title}`,
        subtitle: `📚 Matkul: ${a.course?.name || "Mata Kuliah"}`,
        rawTime: "23:59",
      });
    }
  });

  // Deadlines (Org Tasks)
  orgTasks.forEach((t) => {
    if (t.status !== "DONE" && t.dueDate && new Date(t.dueDate).toDateString() === todayDateStr) {
      agendaItems.push({
        time: "23:59",
        type: "ORG_TASK",
        title: `⏳ Deadline Tugas Org: ${t.title}`,
        subtitle: `🏢 Proker: ${t.event?.title || "Organisasi"}`,
        rawTime: "23:59",
      });
    }
  });

  const sortedAgenda = agendaItems.sort((a, b) => a.rawTime.localeCompare(b.rawTime));

  // 2. HABIT HARI INI CHECKLIST
  const todayHabits = habits.map((h) => {
    const isCompletedToday = h.logs?.some((l: any) => {
      const logDate = new Date(l.date).toDateString();
      return logDate === todayDateStr && l.completed;
    }) || false;

    return {
      id: h.id,
      name: h.name,
      completed: isCompletedToday,
    };
  });

  // 3. TUGAS MENDESAK (≤ 3 hari)
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);

  const urgentTasksList: any[] = [];
  assignments.forEach((a) => {
    if (a.status !== "DONE" && a.dueDate) {
      const d = new Date(a.dueDate);
      if (d >= today && d <= threeDaysFromNow) {
        urgentTasksList.push({
          id: a.id,
          title: a.title,
          sub: a.course?.name || "Akademik",
          dueDate: d,
          type: "ACADEMIC",
          priority: a.priority,
        });
      }
    }
  });
  orgTasks.forEach((t) => {
    if (t.status !== "DONE" && t.dueDate) {
      const d = new Date(t.dueDate);
      if (d >= today && d <= threeDaysFromNow) {
        urgentTasksList.push({
          id: t.id,
          title: t.title,
          sub: t.event?.title || "Organisasi",
          dueDate: d,
          type: "ORGANIZATION",
          priority: t.priority,
        });
      }
    }
  });
  const sortedUrgentTasks = urgentTasksList.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  // 4. GOAL PRIORITAS
  const activeGoals = goals.filter((g) => g.status === "ACTIVE");
  const priorityGoal = [...activeGoals].sort((a, b) => {
    if (a.targetDate && b.targetDate) {
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    }
    return b.progress - a.progress;
  })[0] || null;

  // 5. GOAL YANG PERLU PERHATIAN (progress < 35% ATAU tidak ada progress dalam 14 hari)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(today.getDate() - 14);

  const attentionGoalsList = activeGoals.filter((g) => {
    if (g.progress < 35) return true;

    // check milestones completed recently
    const hasMilestoneUpdates = g.milestones?.some((m: any) => {
      if (!m.isCompleted) return false;
      const d = new Date(m.updatedAt || m.createdAt);
      return d >= fourteenDaysAgo;
    }) || false;

    // check reviews created recently
    const hasReviewUpdates = g.reviews?.some((r: any) => {
      const d = new Date(r.createdAt);
      return d >= fourteenDaysAgo;
    }) || false;

    return !hasMilestoneUpdates && !hasReviewUpdates;
  });

  // 6. RINGKASAN STATISTIK
  const undoneAssignments = assignments.filter((a) => a.status !== "DONE").length + exams.filter((ex) => new Date(ex.date) >= today).length;
  const upcomingEvents = events.filter((e) => new Date(e.date) >= today && !e.isArchived).length;
  const activeHabitsCount = habits.length;
  const completedHabitsToday = todayHabits.filter((h) => h.completed).length;
  const habitCompletionPct = activeHabitsCount > 0 ? Math.round((completedHabitsToday / activeHabitsCount) * 100) : 0;
  const totalActiveGoalsProgress = activeGoals.reduce((sum, g) => sum + g.progress, 0);
  const avgGoalProgress = activeGoals.length > 0 ? Math.round(totalActiveGoalsProgress / activeGoals.length) : 0;

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Welcome Banner */}
      <div className="mb-6 border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">
            ⚡ {greeting}
          </h1>
          <p className="text-muted-foreground font-mono mt-1 text-xs">
            Hari baru, semangat baru. No mager-mager club, mari gaspol kejar target hari ini! 🚀
          </p>
        </div>
        <div className="border-2 border-border bg-background px-4 py-2 font-mono font-bold text-xs uppercase tracking-wider text-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] shrink-0">
          📆 {todayFormatted}
        </div>
      </div>

      {/* SECTION 1: FOKUS HARI INI */}
      <h2 className="font-mono font-extrabold text-xs uppercase tracking-widest text-muted-foreground mb-4">🎯 Fokus Hari Ini</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1: Goal Prioritas */}
        <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between">
          <div>
            <div className="border-b border-border/20 pb-3 mb-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">🎯 Goal Prioritas</span>
            </div>
            {priorityGoal ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl p-1 border border-border bg-background">{priorityGoal.emoji}</span>
                  <div>
                    <h3 className="font-mono font-bold text-sm uppercase">{priorityGoal.title}</h3>
                    <span className="inline-block text-[8px] bg-primary/10 border border-primary/20 font-bold uppercase px-1 font-mono text-primary mt-1">
                      {priorityGoal.category}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold uppercase text-muted-foreground">
                    <span>Progress</span>
                    <span>{priorityGoal.progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-muted border border-border">
                    <div className="h-full bg-primary border-r border-border" style={{ width: `${priorityGoal.progress}%` }} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground font-mono italic">Belum ada goal prioritas yang aktif.</p>
            )}
          </div>
          {priorityGoal && (
            <div className="mt-6 pt-3 border-t border-border/20 flex justify-between items-center text-[10px] font-mono">
              <span className="text-muted-foreground">
                Target: {priorityGoal.targetDate ? new Date(priorityGoal.targetDate).toLocaleDateString("id-ID", { month: "short", year: "numeric" }) : "—"}
              </span>
              <Link href={`/dashboard/goals/roadmap?goalId=${priorityGoal.id}`}>
                <span className="text-primary hover:underline font-bold uppercase cursor-pointer">Lihat Peta Jalan ↗</span>
              </Link>
            </div>
          )}
        </div>

        {/* Card 2: Agenda Hari Ini */}
        <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <div className="border-b border-border/20 pb-3 mb-4">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">📅 Agenda Hari Ini</span>
          </div>
          {sortedAgenda.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono italic py-4 text-center">Tidak ada jadwal kuliah atau agenda organisasi hari ini. Hari yang tenang! ☕</p>
          ) : (
            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
              {sortedAgenda.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start border-2 border-border bg-background p-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">
                  <span className="font-mono font-bold text-xs text-primary shrink-0">{item.time}</span>
                  <div className="min-w-0">
                    <h4 className="font-mono font-bold text-[11px] uppercase truncate">{item.title}</h4>
                    <p className="text-[9px] text-muted-foreground font-mono truncate">{item.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 3: Habit Hari Ini */}
        <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col justify-between">
          <div>
            <div className="border-b border-border/20 pb-3 mb-4 flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">☑ Habit Hari Ini</span>
              <Link href="/dashboard/habits/checklist">
                <span className="text-[9px] font-mono font-bold text-primary uppercase hover:underline cursor-pointer">Catat Log ↗</span>
              </Link>
            </div>
            {todayHabits.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono italic">Belum ada kebiasaan yang dibuat.</p>
            ) : (
              <div className="space-y-2.5 max-h-[130px] overflow-y-auto pr-1">
                {todayHabits.map((h) => (
                  <label key={h.id} className="flex items-center gap-2.5 cursor-pointer font-mono text-xs select-none">
                    <input
                      type="checkbox"
                      checked={h.completed}
                      onChange={() => handleToggleHabit(h.id, h.completed)}
                      className="size-4.5 border-2 border-border bg-background checked:bg-primary focus:ring-0 cursor-pointer shrink-0"
                    />
                    <span className={`truncate uppercase ${h.completed ? "line-through text-muted-foreground" : "font-bold"}`}>
                      {h.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 pt-2 border-t border-border/20 text-[9px] font-mono text-muted-foreground uppercase text-center">
            Penyelesaian Hari Ini: {completedHabitsToday} dari {activeHabitsCount} Kebiasaan
          </div>
        </div>
      </div>

      {/* SECTION 2: PERHATIAN & TINDAKAN MENDESAK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Card 4: Tugas Mendesak (≤ 3 Hari) */}
        <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <div className="border-b border-border/20 pb-3 mb-4 flex justify-between items-center">
            <h3 className="font-mono font-extrabold text-xs uppercase tracking-wider">⚡ Tugas Mendesak (≤ 3 Hari)</h3>
            <span className="text-[9px] bg-rose-500/10 border border-rose-400/20 text-rose-600 font-bold font-mono px-1.5 py-0.5 uppercase">Mendesak</span>
          </div>

          {sortedUrgentTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono italic py-4 text-center">Semua tugas akademik & organisasi aman! 🎉</p>
          ) : (
            <div className="divide-y divide-border/20">
              {sortedUrgentTasks.map((t) => {
                const diffTime = t.dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const dayString = diffDays === 0 ? "Hari Ini" : diffDays === 1 ? "Besok" : `Dalam ${diffDays} hari`;
                
                return (
                  <div key={t.id} className="py-2.5 flex items-start justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-xs uppercase truncate">{t.title}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                        {t.type === "ACADEMIC" ? "📚 Matkul: " : "🏢 Proker: "}{t.sub}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-mono font-bold text-rose-600">{dayString}</p>
                      <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
                        {t.dueDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card 5: Goal yang Perlu Perhatian */}
        <div className="border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <div className="border-b border-border/20 pb-3 mb-4 flex justify-between items-center">
            <h3 className="font-mono font-extrabold text-xs uppercase tracking-wider">⚠️ Goal yang Perlu Perhatian</h3>
            <span className="text-[9px] bg-amber-500/10 border border-amber-400/20 text-amber-600 font-bold font-mono px-1.5 py-0.5 uppercase">Tinjau Ulang</span>
          </div>

          {attentionGoalsList.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono italic py-4 text-center">Seluruh target Anda berada pada jalur yang benar! 🌟</p>
          ) : (
            <div className="space-y-3.5">
              {attentionGoalsList.map((g) => {
                const isVeryLow = g.progress < 35;
                return (
                  <div key={g.id} className="border border-border bg-background p-3 flex gap-3 items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">{g.emoji}</span>
                        <h4 className="font-mono font-bold text-xs uppercase truncate">{g.title}</h4>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono mt-1 font-bold">
                        {isVeryLow ? "⚠️ Progress rendah (<35%)" : "⚠️ Tidak ada pembaharuan progress dalam 14 hari terakhir"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-extrabold text-xs text-amber-600">{g.progress}%</span>
                      <p className="text-[8px] font-mono text-muted-foreground uppercase mt-0.5">{g.status}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: RINGKASAN STATISTIK HIDUP */}
      <h2 className="font-mono font-extrabold text-xs uppercase tracking-widest text-muted-foreground mb-4">📊 Ringkasan Statistik</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Akademik", value: undoneAssignments, sub: "Tugas/Ujian Aktif", href: "/dashboard/academic" },
          { label: "Organisasi", value: upcomingEvents, sub: "Agenda Mendatang", href: "/dashboard/organizations" },
          { label: "Habit Tracker", value: `${habitCompletionPct}%`, sub: "Selesai Hari Ini", href: "/dashboard/habits" },
          { label: "Goal", value: `${avgGoalProgress}%`, sub: "Progress Rata-rata", href: "/dashboard/goals" },
        ].map((stat, idx) => (
          <Link href={stat.href} key={idx} className="block">
            <div className="border-2 border-border bg-card p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between h-full cursor-pointer">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
              <h3 className="text-3xl font-extrabold font-mono mt-2 text-primary">{stat.value}</h3>
              <div className="mt-3 pt-1 border-t border-border/10 text-[9px] font-mono text-muted-foreground uppercase">
                {stat.sub}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
