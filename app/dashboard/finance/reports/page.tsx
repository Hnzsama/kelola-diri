"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

const convertSvgToPng = async (svgElement: SVGElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);
      
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = svgElement.clientWidth || 400;
        canvas.height = svgElement.clientHeight || 300;
        const context = canvas.getContext("2d");
        if (context) {
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0);
          const png = canvas.toDataURL("image/png");
          resolve(png);
        } else {
          reject(new Error("Could not get 2d context"));
        }
        URL.revokeObjectURL(blobURL);
      };
      image.onerror = (err) => {
        reject(err);
        URL.revokeObjectURL(blobURL);
      };
      image.src = blobURL;
    } catch (e) {
      reject(e);
    }
  });
};

interface BudgetVsSpent {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budget: number;
  spent: number;
}

interface Stats {
  balance: number;
  absoluteBalance: number;
  balanceTunai: number;
  balanceNonTunai: number;
  income: number;
  expense: number;
  savings: number;
  prevMonthExpense: number;
  budgetVsSpent: BudgetVsSpent[];
  totalPiutang: number;
  totalHutang: number;
  projectedBalance: number;
  pendingReceivablesThisMonth: number;
  pendingDebtsThisMonth: number;
  upcomingRecurringBillsThisMonth: number;
}

const INDONESIAN_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [transactionsList, setTransactionsList] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
    fetchData(selectedMonth, selectedYear);
  }, []);

  const fetchData = async (m: number, y: number) => {
    try {
      setIsLoading(true);
      const [statsRes, txRes] = await Promise.all([
        fetch(`/api/finance/stats?month=${m}&year=${y}`),
        fetch(`/api/finance/transactions?month=${m}&year=${y}`),
      ]);
      if (!statsRes.ok || !txRes.ok) throw new Error();
      const statsData = await statsRes.json();
      const txData = await txRes.json();
      setStats(statsData);
      setTransactionsList(txData);
    } catch {
      toast.error("Gagal memuat laporan keuangan");
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

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    if (!stats) return;
    const toastId = toast.loading("Memproses export Excel & Grafik...");
    try {
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();

      const currentMonthName = INDONESIAN_MONTHS[selectedMonth - 1];
      const currentYear = selectedYear;

      // Fetch transaction list for this month
      const txRes = await fetch(`/api/finance/transactions?month=${new Date().getMonth() + 1}&year=${currentYear}`);
      const transactionsList = txRes.ok ? await txRes.json() : [];
      
      // Sheet 1: Ringkasan
      const sheet1 = workbook.addWorksheet("Ringkasan Cashflow");
      sheet1.views = [{ showGridLines: true }];
      
      sheet1.columns = [
        { header: "Deskripsi / Item", key: "desc", width: 40 },
        { header: "Nominal / Keterangan", key: "val", width: 25 },
        { header: "", key: "c3", width: 15 },
        { header: "", key: "c4", width: 15 },
        { header: "", key: "c5", width: 15 },
      ];
      
      // Title row
      const titleCell = sheet1.getCell("A1");
      titleCell.value = `LAPORAN FINANSIAL PERSONAL - BULAN ${currentMonthName.toUpperCase()} ${currentYear}`;
      titleCell.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFF" } };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4F46E5" },
      };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };
      sheet1.mergeCells("A1:E1");
      sheet1.getRow(1).height = 35;
      
      sheet1.addRow([`Dicetak pada: ${new Date().toLocaleDateString("id-ID")}`, "", "", "", ""]);
      sheet1.addRow([]);
      
      // Cashflow Table
      const cfHeader = sheet1.addRow(["ARUS KAS BULAN INI", ""]);
      cfHeader.getCell(1).font = { name: "Segoe UI", bold: true, size: 11, color: { argb: "1E3A8A" } };
      
      const rIncome = sheet1.addRow(["Pemasukan (Income)", stats.income]);
      rIncome.getCell(2).numFmt = '"Rp"#,##0';
      rIncome.getCell(2).font = { name: "Segoe UI", color: { argb: "16A34A" }, bold: true };
      
      const rExpense = sheet1.addRow(["Pengeluaran (Expense)", stats.expense]);
      rExpense.getCell(2).numFmt = '"Rp"#,##0';
      rExpense.getCell(2).font = { name: "Segoe UI", color: { argb: "DC2626" }, bold: true };
      
      const rNet = sheet1.addRow(["Arus Kas Bersih (Net Cash)", stats.balance]);
      rNet.getCell(2).numFmt = '"Rp"#,##0';
      rNet.font = { name: "Segoe UI", bold: true };
      rNet.getCell(2).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: stats.balance >= 0 ? "DCFCE7" : "FEE2E2" },
      };
      
      sheet1.addRow([]);
      
      // Commitments & Projection Table
      const projHeader = sheet1.addRow(["KOMITMEN & PROYEKSI", ""]);
      projHeader.getCell(1).font = { name: "Segoe UI", bold: true, size: 11, color: { argb: "1E3A8A" } };
      
      const rAbs = sheet1.addRow(["Saldo Sebenarnya", stats.absoluteBalance]);
      rAbs.getCell(2).numFmt = '"Rp"#,##0';
      
      const rRec = sheet1.addRow(["Komitmen Tagihan Berulang", stats.upcomingRecurringBillsThisMonth]);
      rRec.getCell(2).numFmt = '"Rp"#,##0';
      rRec.getCell(2).font = { color: { argb: "B91C1C" } };
      
      const rRecv = sheet1.addRow(["Komitmen Piutang", stats.pendingReceivablesThisMonth]);
      rRecv.getCell(2).numFmt = '"Rp"#,##0';
      rRecv.getCell(2).font = { color: { argb: "15803D" } };
      
      const rDebt = sheet1.addRow(["Komitmen Hutang", stats.pendingDebtsThisMonth]);
      rDebt.getCell(2).numFmt = '"Rp"#,##0';
      rDebt.getCell(2).font = { color: { argb: "B91C1C" } };
      
      const projBalRow = sheet1.addRow(["Proyeksi Saldo Akhir Bulan", stats.projectedBalance]);
      projBalRow.getCell(2).numFmt = '"Rp"#,##0';
      projBalRow.font = { name: "Segoe UI", bold: true };
      projBalRow.getCell(2).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FEF9C3" }, // light yellow
      };
      
      sheet1.addRow([]);
      
      // Budget realization
      const budgetHeader = sheet1.addRow(["REALISASI ANGGARAN PER KATEGORI", "", "", "", ""]);
      budgetHeader.getCell(1).font = { name: "Segoe UI", bold: true, size: 11, color: { argb: "1E3A8A" } };
      
      const tableHeader = sheet1.addRow(["Kategori", "Batas Budget", "Realisasi", "Sisa / Lebih", "Status"]);
      tableHeader.eachCell((cell) => {
        cell.font = { name: "Segoe UI", bold: true, color: { argb: "FFFFFF" }, size: 10 };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "4F46E5" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });
      
      stats.budgetVsSpent.forEach((c, idx) => {
        const diff = c.budget - c.spent;
        const status = c.budget === 0 ? "No Limit" : diff < 0 ? "OVER" : "AMAN";
        const row = sheet1.addRow([
          `${c.categoryIcon} ${c.categoryName}`,
          c.budget > 0 ? c.budget : "-",
          c.spent,
          c.budget > 0 ? diff : "-",
          status
        ]);
        
        const isEven = idx % 2 === 0;
        row.eachCell((cell, colNum) => {
          cell.font = { name: "Segoe UI", size: 9 };
          cell.border = {
            top: { style: "thin", color: { argb: "E2E8F0" } },
            left: { style: "thin", color: { argb: "E2E8F0" } },
            bottom: { style: "thin", color: { argb: "E2E8F0" } },
            right: { style: "thin", color: { argb: "E2E8F0" } },
          };
          if (isEven) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "F8FAFC" },
            };
          }
          if (colNum >= 2 && colNum <= 4 && typeof cell.value === "number") {
            cell.numFmt = '"Rp"#,##0';
          }
          if (colNum === 5) {
            cell.font = { name: "Segoe UI", bold: true, size: 9, color: { argb: status === "AMAN" ? "16A34A" : status === "OVER" ? "DC2626" : "64748B" } };
            cell.alignment = { horizontal: "center" };
          }
        });
      });

      // Sheet 2: Daftar Transaksi Detail
      const sheet2 = workbook.addWorksheet("Daftar Transaksi");
      sheet2.views = [{ showGridLines: true }];
      
      const tTitle = sheet2.getCell("A1");
      tTitle.value = `DAFTAR TRANSAKSI LENGKAP - BULAN ${currentMonthName.toUpperCase()} ${currentYear}`;
      tTitle.font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FFFFFF" } };
      tTitle.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0F172A" },
      };
      tTitle.alignment = { vertical: "middle", horizontal: "center" };
      sheet2.mergeCells("A1:F1");
      sheet2.getRow(1).height = 30;
      sheet2.addRow([]);
      
      const txHeader = sheet2.addRow(["Tanggal", "Tipe", "Nominal", "Kategori", "Metode Uang", "Keterangan"]);
      txHeader.height = 24;
      txHeader.eachCell((cell) => {
        cell.font = { name: "Segoe UI", bold: true, color: { argb: "FFFFFF" }, size: 10 };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "334155" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });
      
      transactionsList.forEach((tx: any, idx: number) => {
        const txDate = new Date(tx.date).toLocaleDateString("id-ID");
        const row = sheet2.addRow([
          txDate,
          tx.type === "INCOME" ? "Pemasukan 🟢" : "Pengeluaran 🔴",
          tx.amount,
          tx.category ? `${tx.category.icon} ${tx.category.name}` : "Lainnya",
          tx.paymentMethod === "NON_TUNAI" ? "Non-Tunai 💳" : "Tunai 💵",
          tx.description || "-"
        ]);
        
        row.height = 20;
        const isEven = idx % 2 === 0;
        row.eachCell((cell, colNum) => {
          cell.font = { name: "Segoe UI", size: 9 };
          cell.border = {
            top: { style: "thin", color: { argb: "E2E8F0" } },
            left: { style: "thin", color: { argb: "E2E8F0" } },
            bottom: { style: "thin", color: { argb: "E2E8F0" } },
            right: { style: "thin", color: { argb: "E2E8F0" } },
          };
          if (isEven) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "F8FAFC" },
            };
          }
          if (colNum === 3) {
            cell.numFmt = '"Rp"#,##0';
            cell.alignment = { horizontal: "right" };
          }
          if (colNum === 2) {
            cell.font = { name: "Segoe UI", bold: true, size: 9, color: { argb: tx.type === "INCOME" ? "16A34A" : "DC2626" } };
          }
        });
      });
      
      sheet2.getColumn(1).width = 15;
      sheet2.getColumn(2).width = 18;
      sheet2.getColumn(3).width = 20;
      sheet2.getColumn(4).width = 20;
      sheet2.getColumn(5).width = 18;
      sheet2.getColumn(6).width = 40;

      // Sheet 3: Grafik
      const sheet3 = workbook.addWorksheet("Visualisasi Grafik");
      const titleRow3 = sheet3.addRow(["GRAFIK DISTRIBUSI & REALISASI ANGGARAN", ""]);
      titleRow3.font = { name: "Segoe UI", size: 14, bold: true };
      sheet3.addRow([]);

      // Try capturing Recharts SVG elements
      const wrappers = document.querySelectorAll(".recharts-wrapper");
      
      for (let i = 0; i < wrappers.length; i++) {
        const svg = wrappers[i].querySelector("svg");
        if (svg) {
          try {
            const pngDataUrl = await convertSvgToPng(svg as any);
            const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, "");
            const imageId = workbook.addImage({
              base64: base64Data,
              extension: 'png',
            });
            sheet3.addImage(imageId, {
              tl: { col: 1, row: 3 + (i * 18) },
              ext: { width: 500, height: 350 }
            });
          } catch (e) {
            console.error("Gagal menukar grafik ke gambar:", e);
          }
        }
      }

      // Generate blob and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Laporan_Keuangan_${currentMonthName}_${currentYear}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      
      toast.dismiss(toastId);
      toast.success("Excel berhasil diexport!");
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error("Gagal mengexport Excel");
    }
  };

  if (isLoading || !stats) return <DashboardSkeleton />;

  // Chart Data preparation
  const pieData = stats.budgetVsSpent
    .filter((c) => c.spent > 0)
    .map((c) => ({
      name: `${c.categoryIcon} ${c.categoryName}`,
      value: c.spent,
      color: c.categoryColor.includes("blue") ? "#3b82f6" :
             c.categoryColor.includes("emerald") ? "#10b981" :
             c.categoryColor.includes("purple") ? "#8b5cf6" :
             c.categoryColor.includes("amber") ? "#f59e0b" :
             c.categoryColor.includes("rose") ? "#f43f5e" :
             c.categoryColor.includes("teal") ? "#14b8a6" :
             c.categoryColor.includes("indigo") ? "#6366f1" :
             c.categoryColor.includes("pink") ? "#ec4899" : "#71717a",
    }));

  const barData = stats.budgetVsSpent
    .filter((c) => c.budget > 0)
    .map((c) => ({
      name: c.categoryName,
      "Anggaran": c.budget,
      "Pengeluaran": c.spent,
    }));

  // Calculations for health metrics
  const savingsRate = stats.income > 0 ? Math.round(((stats.income - stats.expense) / stats.income) * 100) : 0;
  const dti = stats.income > 0 ? Math.round((stats.totalHutang / stats.income) * 100) : 0;

  const budgetedCategories = stats.budgetVsSpent.filter(c => c.budget > 0);
  const compliantCategories = budgetedCategories.filter(c => c.spent <= c.budget);
  const budgetComplianceRate = budgetedCategories.length > 0
    ? Math.round((compliantCategories.length / budgetedCategories.length) * 100)
    : 100;

  // Determine status levels
  const getSavingsStatus = (rate: number) => {
    if (rate >= 30) return { label: "Sangat Sehat 🌟", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    if (rate >= 10) return { label: "Cukup Sehat 👍", color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30" };
    if (rate >= 0) return { label: "Kurang Sehat ⚠️", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30" };
    return { label: "Defisit/Bocor 🚨", color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30" };
  };

  const getDtiStatus = (rate: number) => {
    if (rate === 0) return { label: "Bebas Hutang 🕊️", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    if (rate <= 30) return { label: "Aman", color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30" };
    return { label: "Waspada ⚠️", color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30" };
  };

  const getComplianceStatus = (rate: number) => {
    if (rate >= 80) return { label: "Disiplin Tinggi 🎯", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    if (rate >= 50) return { label: "Cukup Disiplin", color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30" };
    return { label: "Boros/Overlimit 💸", color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30" };
  };

  const savingsStatus = getSavingsStatus(savingsRate);
  const dtiStatus = getDtiStatus(dti);
  const complianceStatus = getComplianceStatus(budgetComplianceRate);

  // Recommendations generator
  const getRecommendations = () => {
    const recs = [];
    if (savingsRate < 10) {
      recs.push("Tabungan bulanan Anda di bawah standar ideal 10%. Coba periksa pengeluaran kategori tersier Anda.");
    }
    if (dti > 30) {
      recs.push("Rasio hutang Anda melebihi 30% dari pemasukan. Hindari mengajukan pinjaman baru sampai hutang lunas.");
    }
    if (budgetComplianceRate < 80) {
      recs.push("Beberapa anggaran kategori Anda jebol. Cobalah memasang limit anggaran lebih rendah dan lebih selektif dalam membelanjakan uang.");
    }
    if (recs.length === 0) {
      recs.push("Luar biasa! Seluruh indikator keuangan Anda dalam keadaan prima. Pertahankan disiplin keuangan ini.");
    }
    return recs;
  };

  const recommendations = getRecommendations();

  return (
    <div className="w-full px-4 lg:px-6 print:px-0">
      {/* CSS print override */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print, header, nav, aside, button, .sidebar, [role="navigation"] {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center no-print">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Laporan Keuangan</h1>
          <p className="text-muted-foreground font-mono text-xs">
            Analisis visual alokasi pengeluaran, kesehatan finansial, dan audit cashflow bulanan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Month & Year Filter selectors */}
          <div className="flex items-center gap-2 border-2 border-border bg-card px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] font-mono text-xs">
            <span className="font-bold uppercase text-[9px] text-muted-foreground">Periode:</span>
            <select
              value={selectedMonth}
              onChange={(e) => {
                const m = parseInt(e.target.value);
                setSelectedMonth(m);
                fetchData(m, selectedYear);
              }}
              className="border border-border px-1.5 py-0.5 bg-background font-bold focus:outline-none cursor-pointer"
            >
              {INDONESIAN_MONTHS.map((name, idx) => (
                <option key={idx} value={idx + 1}>{name}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => {
                const y = parseInt(e.target.value);
                setSelectedYear(y);
                fetchData(selectedMonth, y);
              }}
              className="border border-border px-1.5 py-0.5 bg-background font-bold focus:outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-emerald-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] transition-all cursor-pointer"
          >
            Export Excel 📊
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-yellow-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] transition-all cursor-pointer"
          >
            Cetak Laporan 🖨️
          </button>
          <Link href="/dashboard/finance">
            <button className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] transition-all cursor-pointer">
              ← Kembali
            </button>
          </Link>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block border-b-4 border-black pb-4 mb-8 font-mono">
        <h1 className="text-2xl font-black uppercase">LAPORAN AUDIT FINANSIAL PERSONAL</h1>
        <p className="text-sm">Kelola Diri — Financial Management Platform</p>
        <p className="text-xs text-muted-foreground mt-1">Dicetak pada: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
      </div>

      <div className="print-full-width grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-8">
        
        {/* Main Health Indicators (Left & Center columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* FINANCIAL HEALTH SCORE */}
          <div className="border-2 border-black bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] print:shadow-none">
            <h3 className="font-mono font-black text-sm uppercase tracking-tight border-b-2 border-black pb-3 mb-5">
              🏥 Indikator Kesehatan Finansial
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs mb-6">
              
              {/* Savings Rate Card */}
              <div className="border border-border p-4 bg-background">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Rasio Tabungan (Savings Rate)</span>
                <h4 className="text-2xl font-black mt-2 text-foreground">{savingsRate}%</h4>
                <div className={`mt-2 px-2 py-0.5 border text-[9px] font-bold uppercase inline-block ${savingsStatus.color}`}>
                  {savingsStatus.label}
                </div>
                <p className="text-[9px] text-muted-foreground mt-3">Persentase sisa dana dari total pendapatan bulanan.</p>
              </div>

              {/* Debt to Income Card */}
              <div className="border border-border p-4 bg-background">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Rasio Hutang (DTI Ratio)</span>
                <h4 className="text-2xl font-black mt-2 text-foreground">{dti}%</h4>
                <div className={`mt-2 px-2 py-0.5 border text-[9px] font-bold uppercase inline-block ${dtiStatus.color}`}>
                  {dtiStatus.label}
                </div>
                <p className="text-[9px] text-muted-foreground mt-3">Rasio perbandingan jumlah hutang aktif terhadap pemasukan.</p>
              </div>

              {/* Budget Compliance Card */}
              <div className="border border-border p-4 bg-background">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Disiplin Anggaran (Compliance)</span>
                <h4 className="text-2xl font-black mt-2 text-foreground">{budgetComplianceRate}%</h4>
                <div className={`mt-2 px-2 py-0.5 border text-[9px] font-bold uppercase inline-block ${complianceStatus.color}`}>
                  {complianceStatus.label}
                </div>
                <p className="text-[9px] text-muted-foreground mt-3">Persentase anggaran kategori belanja yang tidak overlimit.</p>
              </div>

            </div>

            {/* AI Advisor Card */}
            <div className="border-2 border-black bg-yellow-50 p-4 font-mono text-xs text-black">
              <h4 className="font-bold uppercase mb-2">💡 Rekomendasi Finansial Mandiri</h4>
              <ul className="list-disc pl-4 space-y-1">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="leading-relaxed">{rec}</li>
                ))}
              </ul>
            </div>

          </div>

          {/* CASHFLOW STATEMENT (PRO-FORMAT) */}
          <div className="border-2 border-black bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] print:shadow-none font-mono">
            <h3 className="font-black text-sm uppercase tracking-tight border-b-2 border-black pb-3 mb-5">
              📊 Laporan Arus Kas (Cashflow Statement)
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-black bg-muted/40 font-bold">
                    <th className="py-2 px-3">Item / Deskripsi</th>
                    <th className="py-2 px-3 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-2 px-3 font-bold">Arus Kas Masuk (Income)</td>
                    <td className="py-2 px-3 text-right text-emerald-600 font-bold">+{formatRupiah(stats.income)}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 px-3 font-bold">Arus Kas Keluar Operasional (Expense)</td>
                    <td className="py-2 px-3 text-right text-rose-600 font-bold">-{formatRupiah(stats.expense)}</td>
                  </tr>
                  <tr className="border-b-2 border-black bg-muted/20 font-bold">
                    <td className="py-2 px-3">Arus Kas Bersih Operasional (Net Cash)</td>
                    <td className={`py-2 px-3 text-right font-black ${stats.balance >= 0 ? "text-blue-600" : "text-rose-600"}`}>
                      {formatRupiah(stats.balance)}
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 px-3 font-semibold pl-4">Saldo Tunai Aktif (Cash Balance)</td>
                    <td className="py-2 px-3 text-right text-amber-600 font-semibold">{formatRupiah(stats.balanceTunai)}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 px-3 font-semibold pl-4">Saldo Non-Tunai Aktif (Non-Cash Balance)</td>
                    <td className="py-2 px-3 text-right text-teal-600 font-semibold">{formatRupiah(stats.balanceNonTunai)}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 px-3 font-bold pl-4">Komitmen Tagihan Berulang Tersisa (Recurring Bills)</td>
                    <td className="py-2 px-3 text-right text-rose-600">-{formatRupiah(stats.upcomingRecurringBillsThisMonth)}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 px-3 font-bold pl-4">Komitmen Piutang Bulan Ini (Receivables)</td>
                    <td className="py-2 px-3 text-right text-emerald-600">+{formatRupiah(stats.pendingReceivablesThisMonth)}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 px-3 font-bold pl-4">Komitmen Hutang Bulan Ini (Debts)</td>
                    <td className="py-2 px-3 text-right text-rose-600">-{formatRupiah(stats.pendingDebtsThisMonth)}</td>
                  </tr>
                  <tr className="bg-black text-white font-bold">
                    <td className="py-2.5 px-3">Proyeksi Saldo Akhir Bulan (Projected Balance)</td>
                    <td className="py-2.5 px-3 text-right text-yellow-300 font-black">{formatRupiah(stats.projectedBalance)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* BUDGET COMPLIANCE DETAILS */}
          <div className="border-2 border-black bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] print:shadow-none font-mono">
            <h3 className="font-black text-sm uppercase tracking-tight border-b-2 border-black pb-3 mb-5">
              📋 Detail Realisasi Anggaran per Kategori
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-black bg-muted/40 font-bold">
                    <th className="py-2 px-3">Kategori</th>
                    <th className="py-2 px-3 text-right">Batas Budget</th>
                    <th className="py-2 px-3 text-right">Realisasi</th>
                    <th className="py-2 px-3 text-right">Sisa / Lebih</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.budgetVsSpent.map((c) => {
                    const diff = c.budget - c.spent;
                    const isOver = diff < 0;
                    
                    return (
                      <tr key={c.categoryId} className="border-b border-border hover:bg-muted/10">
                        <td className="py-2.5 px-3 font-bold">
                          {c.categoryIcon} {c.categoryName}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {c.budget > 0 ? formatRupiah(c.budget) : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          {formatRupiah(c.spent)}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold ${isOver ? "text-rose-600" : "text-emerald-600"}`}>
                          {c.budget > 0 ? formatRupiah(diff) : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {c.budget === 0 ? (
                            <span className="px-1.5 py-0.5 border border-border text-[9px] bg-muted/40">No Limit</span>
                          ) : isOver ? (
                            <span className="px-1.5 py-0.5 border border-rose-500 bg-rose-500/10 text-rose-600 text-[9px] font-bold">OVER</span>
                          ) : (
                            <span className="px-1.5 py-0.5 border border-emerald-500 bg-emerald-500/10 text-emerald-600 text-[9px] font-bold">AMAN</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Charts and Visuals Column (Right) */}
        <div className="space-y-6">
          
          {/* PIE CHART */}
          <div className="border-2 border-black bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] print:shadow-none">
            <h3 className="font-mono font-black text-sm uppercase tracking-tight border-b-2 border-black pb-3 mb-5">
              🍕 Distribusi Pengeluaran
            </h3>
            <div className="h-64 w-full flex items-center justify-center">
              {pieData.length === 0 ? (
                <p className="text-sm font-mono text-muted-foreground">Belum ada pengeluaran dicatat bulan ini.</p>
              ) : (
                isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#09090b" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => formatRupiah(Number(value))}
                        contentStyle={{ backgroundColor: "#09090b", color: "#f4f4f5", border: "2px solid #09090b", fontFamily: "monospace" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )
              )}
            </div>
            {pieData.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
                {pieData.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-3 h-3 border border-border inline-block" style={{ backgroundColor: entry.color }} />
                    <span className="truncate">{entry.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BAR CHART */}
          <div className="border-2 border-black bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] print:shadow-none">
            <h3 className="font-mono font-black text-sm uppercase tracking-tight border-b-2 border-black pb-3 mb-5">
              📊 Pengeluaran vs Budget
            </h3>
            <div className="h-64 w-full">
              {barData.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm font-mono text-muted-foreground">Belum ada batas anggaran yang diatur.</p>
                </div>
              ) : (
                isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }} stroke="#71717a" />
                      <Tooltip 
                        formatter={(value: any) => formatRupiah(Number(value))}
                        contentStyle={{ backgroundColor: "#09090b", color: "#f4f4f5", border: "2px solid #09090b", fontFamily: "monospace" }}
                      />
                      <Bar dataKey="Anggaran" fill="#a78bfa" stroke="#09090b" strokeWidth={2} radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Pengeluaran" fill="#f43f5e" stroke="#09090b" strokeWidth={2} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )
              )}
            </div>
            {barData.length > 0 && (
              <div className="mt-4 flex gap-4 text-xs font-mono justify-center">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 border border-border bg-[#a78bfa] inline-block" />
                  <span>Budget</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 border border-border bg-[#f43f5e] inline-block" />
                  <span>Real</span>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* TRANSACTION HISTORY TABLE */}
      <div className="border-2 border-black bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] mt-8 font-mono print:shadow-none">
        <h3 className="font-extrabold text-sm uppercase tracking-tight border-b-2 border-black pb-3 mb-5">
          📝 Riwayat Transaksi Lunas Bulan Ini
        </h3>
        {transactionsList.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-4">Belum ada transaksi di bulan ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-black bg-muted/40 font-bold">
                  <th className="py-2 px-3">Tanggal</th>
                  <th className="py-2 px-3">Kategori</th>
                  <th className="py-2 px-3">Keterangan</th>
                  <th className="py-2 px-3">Metode Uang</th>
                  <th className="py-2 px-3">Tipe</th>
                  <th className="py-2 px-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {transactionsList.map((tx: any) => {
                  const dDate = new Date(tx.date);
                  const isIncome = tx.type === "INCOME";
                  return (
                    <tr key={tx.id} className="border-b border-border hover:bg-muted/10">
                      <td className="py-2.5 px-3">
                        {dDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">
                        {tx.category ? `${tx.category.icon} ${tx.category.name}` : "Lainnya"}
                      </td>
                      <td className="py-2.5 px-3 truncate max-w-xs" title={tx.description}>
                        {tx.description || "-"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 border text-[9px] font-bold uppercase tracking-wider ${tx.paymentMethod === "NON_TUNAI" ? "bg-teal-500/10 border-teal-400/30 text-teal-700 dark:text-teal-400" : "bg-amber-500/10 border-amber-400/30 text-amber-700 dark:text-amber-400"}`}>
                          {tx.paymentMethod === "NON_TUNAI" ? "Non-Tunai 💳" : "Tunai 💵"}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 font-bold ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {isIncome ? "INCOME" : "EXPENSE"}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-extrabold ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {isIncome ? "+" : "-"} {formatRupiah(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
