"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { DashboardSquare01Icon, ChartHistogramIcon, UserGroupIcon, Settings05Icon, HelpCircleIcon, SearchIcon, Analytics01Icon, CommandIcon, Target02Icon, CreditCardIcon, Briefcase01Icon } from "@hugeicons/core-free-icons"

export const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: (
        <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Akademik",
      url: "/dashboard/academic",
      icon: (
        <HugeiconsIcon icon={ChartHistogramIcon} strokeWidth={2} />
      ),
      items: [
        {
          title: "Dashboard Akademik",
          url: "/dashboard/academic",
        },
        {
          title: "Planner Akademik",
          url: "/dashboard/academic/planner",
        },
        {
          title: "Mata Kuliah",
          url: "/dashboard/academic/courses",
        },
        {
          title: "Pelacak Tugas",
          url: "/dashboard/academic/assignments",
        },
        {
          title: "Jadwal Ujian",
          url: "/dashboard/academic/exams",
        },
        {
          title: "Kelola Semester",
          url: "/dashboard/academic/semesters",
        },
      ],
    },
    {
      title: "Organisasi",
      url: "/dashboard/organizations",
      icon: (
        <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />
      ),
      items: [
        {
          title: "Dashboard Organisasi",
          url: "/dashboard/organizations",
        },
        {
          title: "Daftar Organisasi",
          url: "/dashboard/organizations/list",
        },
        {
          title: "Agenda Kegiatan",
          url: "/dashboard/organizations/events",
        },
        {
          title: "Tugas Kepanitiaan",
          url: "/dashboard/organizations/tasks",
        },
        {
          title: "Arsip Kegiatan",
          url: "/dashboard/organizations/archive",
        },
      ],
    },
    {
      title: "Habit Tracker",
      url: "/dashboard/habits",
      icon: (
        <HugeiconsIcon icon={Analytics01Icon} strokeWidth={2} />
      ),
      items: [
        {
          title: "Dashboard Habit",
          url: "/dashboard/habits",
        },
        {
          title: "Checklist Harian",
          url: "/dashboard/habits/checklist",
        },
        {
          title: "Kelola Kategori",
          url: "/dashboard/habits/categories",
        },
        {
          title: "Statistik",
          url: "/dashboard/habits/stats",
        },
      ],
    },
    {
      title: "Goal & Life Planning",
      url: "/dashboard/goals",
      icon: (
        <HugeiconsIcon icon={Target02Icon} strokeWidth={2} />
      ),
      items: [
        {
          title: "Dashboard Goal",
          url: "/dashboard/goals",
        },
        {
          title: "Goal Aktif",
          url: "/dashboard/goals/active",
        },
        {
          title: "Roadmap",
          url: "/dashboard/goals/roadmap",
        },
        {
          title: "Progress Review",
          url: "/dashboard/goals/review",
        },
      ],
    },
    {
      title: "Keuangan",
      url: "/dashboard/finance",
      icon: (
        <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
      ),
      items: [
        {
          title: "Dashboard Keuangan",
          url: "/dashboard/finance",
        },
        {
          title: "Riwayat Transaksi",
          url: "/dashboard/finance/transactions",
        },
        {
          title: "Batas Anggaran",
          url: "/dashboard/finance/budget",
        },
        {
          title: "Target Tabungan",
          url: "/dashboard/finance/savings",
        },
        {
          title: "Hutang & Piutang",
          url: "/dashboard/finance/debts",
        },
        {
          title: "Tagihan Berulang",
          url: "/dashboard/finance/recurring",
        },
        {
          title: "Laporan Keuangan",
          url: "/dashboard/finance/reports",
        },
        {
          title: "Kelola Kategori",
          url: "/dashboard/finance/categories",
        },
      ],
    },
    {
      title: "Karier & Freelance",
      url: "/dashboard/career",
      icon: (
        <HugeiconsIcon icon={Briefcase01Icon} strokeWidth={2} />
      ),
      items: [
        {
          title: "Dashboard Karier",
          url: "/dashboard/career",
        },
        {
          title: "Project Client",
          url: "/dashboard/career/projects",
        },
        {
          title: "Daftar Klien",
          url: "/dashboard/career/clients",
        },
        {
          title: "Invoice Proyek",
          url: "/dashboard/career/invoices",
        },
        {
          title: "Log Penghasilan",
          url: "/dashboard/career/income",
        },
        {
          title: "Job Tracker",
          url: "/dashboard/career/jobs",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: (
        <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Get Help",
      url: "#",
      icon: (
        <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />
      ),
    },
    {
      title: "Search",
      url: "#",
      icon: (
        <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
      ),
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile, isMobile } = useSidebar()

  const handleLogoClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/dashboard" onClick={handleLogoClick}>
                <HugeiconsIcon icon={CommandIcon} strokeWidth={2} className="size-5!" />
                <span className="text-base font-semibold">Kelola Diri</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
