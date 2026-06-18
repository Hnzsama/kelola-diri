"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { HugeiconsIcon } from "@hugeicons/react";
import { Briefcase01Icon, UserGroupIcon, InvoiceIcon, MoneySendIcon, Calendar01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

interface Client {
  id: string;
  name: string;
  company: string;
}

interface ProjectTask {
  id: string;
  title: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  contractValue: number;
  startDate: string;
  endDate: string;
  status: string;
  client: Client;
  tasks: ProjectTask[];
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: string;
  project: {
    name: string;
    client: Client;
  };
}

interface Income {
  id: string;
  source: string;
  amount: number;
  date: string;
}

interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  status: string;
}

export default function CareerDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [projectsRes, clientsRes, invoicesRes, incomesRes, jobsRes] = await Promise.all([
        fetch("/api/career/projects"),
        fetch("/api/career/clients"),
        fetch("/api/career/invoices"),
        fetch("/api/career/income"),
        fetch("/api/career/jobs"),
      ]);

      if (!projectsRes.ok || !clientsRes.ok || !invoicesRes.ok || !incomesRes.ok || !jobsRes.ok) {
        throw new Error("Gagal mengambil data");
      }

      const [projectsData, clientsData, invoicesData, incomesData, jobsData] = await Promise.all([
        projectsRes.json(),
        clientsRes.json(),
        invoicesRes.json(),
        incomesRes.json(),
        jobsRes.json(),
      ]);

      setProjects(projectsData);
      setClients(clientsData);
      setInvoices(invoicesData);
      setIncomes(incomesData);
      setJobs(jobsData);
    } catch {
      toast.error("Gagal memuat data dashboard karier");
    } finally {
      setIsLoading(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (isLoading) return <DashboardSkeleton />;

  // 1. Calculations for Metric Cards
  const activeProjectsCount = projects.filter(p => ["PROGRESS", "REVISION", "WAITING_FEEDBACK"].includes(p.status)).length;
  const activeClientsCount = clients.length;
  const outstandingInvoicesAmount = invoices
    .filter(inv => ["SENT", "OVERDUE"].includes(inv.status))
    .reduce((sum, inv) => sum + inv.amount, 0);

  // Monthly Income (Career income this month)
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyIncomeAmount = incomes
    .filter(inc => new Date(inc.date) >= startOfThisMonth)
    .reduce((sum, inc) => sum + inc.amount, 0);

  // 2. Upcoming Deadlines (Active projects sorted by endDate, showing next 3)
  const upcomingDeadlines = projects
    .filter(p => !["COMPLETED", "CANCELLED"].includes(p.status))
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 3);

  // 3. Outstanding Payments (Unpaid invoices sorted by dueDate, showing next 3)
  const outstandingPayments = invoices
    .filter(inv => ["SENT", "OVERDUE"].includes(inv.status))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  // 4. Job application pipeline statistics
  const jobStats = {
    WISHLIST: jobs.filter(j => j.status === "WISHLIST").length,
    APPLIED: jobs.filter(j => j.status === "APPLIED").length,
    INTERVIEW: jobs.filter(j => ["HR_INTERVIEW", "TECHNICAL_TEST", "USER_INTERVIEW"].includes(j.status)).length,
    OFFERING: jobs.filter(j => j.status === "OFFERING").length,
    ACCEPTED: jobs.filter(j => j.status === "ACCEPTED").length,
  };

  // 5. Monthly Income Trend Graph Data
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      month: d.toLocaleDateString("id-ID", { month: "short" }),
      monthNum: d.getMonth(),
      year: d.getFullYear(),
      total: 0,
    };
  }).reverse();

  last6Months.forEach(m => {
    const sum = incomes
      .filter(inc => {
        const incDate = new Date(inc.date);
        return incDate.getMonth() === m.monthNum && incDate.getFullYear() === m.year;
      })
      .reduce((s, inc) => s + inc.amount, 0);
    m.total = sum;
  });

  return (
    <div className="w-full px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Dashboard Karier & Freelance</h1>
        <p className="text-muted-foreground font-mono text-xs">
          Pantau proyek freelance, tagihan invoice klien, log pendapatan paruh waktu, dan lamaran kerja Anda.
        </p>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Projects */}
        <div className="border-2 border-border bg-cyan-400/10 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-mono">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase text-muted-foreground">Proyek Aktif</span>
            <HugeiconsIcon icon={Briefcase01Icon} className="size-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold">{activeProjectsCount} Proyek</div>
          <div className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">
            Dalam tahap perencanaan & pengerjaan
          </div>
        </div>

        {/* Card 2: Active Clients */}
        <div className="border-2 border-border bg-violet-400/10 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-mono">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase text-muted-foreground">Daftar Klien</span>
            <HugeiconsIcon icon={UserGroupIcon} className="size-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="text-2xl font-extrabold">{activeClientsCount} Kontak</div>
          <div className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">
            Klien freelance terdaftar
          </div>
        </div>

        {/* Card 3: Outstanding Invoices */}
        <div className="border-2 border-border bg-amber-400/10 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-mono">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase text-muted-foreground">Tagihan Tertunggak</span>
            <HugeiconsIcon icon={InvoiceIcon} className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl font-extrabold truncate">{formatRupiah(outstandingInvoicesAmount)}</div>
          <div className="text-[10px] text-muted-foreground mt-1.5 uppercase font-bold">
            Invoice menunggu pembayaran klien
          </div>
        </div>

        {/* Card 4: Monthly Income */}
        <div className="border-2 border-border bg-emerald-400/10 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-mono">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase text-muted-foreground">Omzet Bulan Ini</span>
            <HugeiconsIcon icon={MoneySendIcon} className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold truncate">{formatRupiah(monthlyIncomeAmount)}</div>
          <div className="text-[10px] text-muted-foreground mt-1.5 uppercase font-bold">
            Log pendapatan bulan berjalan
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Span 2): Graph & Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Income Trend Graph */}
          <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <h3 className="font-mono font-extrabold text-sm uppercase tracking-tight mb-4 border-b border-border/20 pb-2">
              📈 Tren Pendapatan Bulanan (6 Bulan Terakhir)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={last6Months} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: "monospace" }} />
                  <YAxis tickFormatter={(v) => `${v / 1000000}M`} tick={{ fontSize: 10, fontFamily: "monospace" }} />
                  <Tooltip
                    formatter={(val: any) => [formatRupiah(val), "Pendapatan"]}
                    contentStyle={{ fontFamily: "monospace", fontSize: "12px", border: "2px solid #09090b" }}
                  />
                  <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Career Selection Pipeline */}
          <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-mono">
            <div className="flex justify-between items-center border-b border-border/20 pb-2 mb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-tight">💼 Pipeline Seleksi Lamaran Kerja / Magang</h3>
              <Link href="/dashboard/career/jobs" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                Buka Job Tracker <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="border border-border p-3 bg-muted/20">
                <div className="text-lg font-black text-slate-500">{jobStats.WISHLIST}</div>
                <div className="text-[8px] font-bold uppercase text-muted-foreground mt-1">Wishlist</div>
              </div>
              <div className="border border-border p-3 bg-blue-500/10 text-blue-700 dark:text-blue-400">
                <div className="text-lg font-black">{jobStats.APPLIED}</div>
                <div className="text-[8px] font-bold uppercase text-muted-foreground mt-1">Applied</div>
              </div>
              <div className="border border-border p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <div className="text-lg font-black">{jobStats.INTERVIEW}</div>
                <div className="text-[8px] font-bold uppercase text-muted-foreground mt-1">Interview</div>
              </div>
              <div className="border border-border p-3 bg-violet-500/10 text-violet-700 dark:text-violet-400">
                <div className="text-lg font-black">{jobStats.OFFERING}</div>
                <div className="text-[8px] font-bold uppercase text-muted-foreground mt-1">Offering</div>
              </div>
              <div className="border border-border p-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <div className="text-lg font-black">{jobStats.ACCEPTED}</div>
                <div className="text-[8px] font-bold uppercase text-muted-foreground mt-1">Accepted</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Deadlines & Payments */}
        <div className="space-y-6">
          
          {/* Upcoming Proyeks Deadlines */}
          <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-mono">
            <div className="flex justify-between items-center border-b border-border/20 pb-2 mb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-tight">📅 Deadline Proyek Freelance</h3>
              <Link href="/dashboard/career/projects" className="text-xs text-primary font-bold hover:underline">
                Lihat Semua
              </Link>
            </div>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-xs text-muted-foreground italic text-center py-6">
                Tidak ada tenggat waktu proyek terdekat.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((p) => {
                  const tasksCount = p.tasks.length;
                  const completedTasksCount = p.tasks.filter(t => t.status === "DONE").length;
                  const pct = tasksCount > 0 ? Math.round((completedTasksCount / tasksCount) * 100) : 0;
                  
                  return (
                    <div key={p.id} className="border border-border p-3 bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="truncate max-w-[120px]">{p.name}</span>
                        <span className="text-rose-500 text-[10px]">
                          {new Date(p.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">Klien: {p.client.name} | Nilai: {formatRupiah(p.contractValue)}</div>
                      <div className="w-full bg-muted h-2 border border-border mt-1 relative">
                        <div className="bg-primary h-full transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-[8px] text-muted-foreground">
                        <span>Task: {completedTasksCount}/{tasksCount}</span>
                        <span>{pct}% Selesai</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Outstanding Invoice Payments */}
          <div className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-mono">
            <div className="flex justify-between items-center border-b border-border/20 pb-2 mb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-tight">🚨 Outstanding Invoices</h3>
              <Link href="/dashboard/career/invoices" className="text-xs text-primary font-bold hover:underline">
                Kelola Invoice
              </Link>
            </div>
            {outstandingPayments.length === 0 ? (
              <div className="text-xs text-muted-foreground italic text-center py-6">
                Semua invoice lunas atau masih draft! 🎉
              </div>
            ) : (
              <div className="space-y-3">
                {outstandingPayments.map((inv) => {
                  const isOverdue = new Date(inv.dueDate) < new Date() || inv.status === "OVERDUE";
                  
                  return (
                    <div key={inv.id} className={`border border-border p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] ${isOverdue ? "bg-rose-500/5" : "bg-background"} space-y-1`}>
                      <div className="flex justify-between text-xs font-bold">
                        <span>{inv.invoiceNumber}</span>
                        <span className={isOverdue ? "text-rose-500" : "text-amber-500"}>
                          {formatRupiah(inv.amount)}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">Klien: {inv.project.client.name} | Proyek: {inv.project.name}</div>
                      <div className="flex justify-between text-[9px] font-bold text-muted-foreground pt-1 border-t border-border/10">
                        <span className="uppercase">{inv.status}</span>
                        <span>Jatuh Tempo: {new Date(inv.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
