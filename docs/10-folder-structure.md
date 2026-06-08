# Struktur Folder - Kelola Diri

Dokumen ini merancang struktur folder aplikasi **Kelola Diri** menggunakan pendekatan **Feature-Based Architecture** untuk Next.js App Router. Pendekatan ini memisahkan file konfigurasi global dengan logika bisnis berdasarkan modul fitur (domain).

---

## 1. Pohon Struktur Folder (Folder Tree Structure)

```txt
kelola-diri/
├── app/                        # NEXT.JS APP ROUTER (Routing & Page Entry Points)
│   ├── layout.tsx              # Root Layout (SessionProvider, ThemeProvider)
│   ├── page.tsx                # Root Page (Redirect ke /dashboard atau /login)
│   ├── globals.css             # CSS Global (Tailwind CSS v4)
│   ├── login/
│   │   └── page.tsx            # Halaman Login (Google OAuth)
│   ├── dashboard/
│   │   └── page.tsx            # Halaman Dashboard Utama
│   ├── academic/
│   │   ├── page.tsx            # Halaman Utama Akademik (Jadwal Kuliah)
│   │   ├── assignments/
│   │   │   └── page.tsx        # Halaman Pelacak Tugas
│   │   └── exams/
│   │       └── page.tsx        # Halaman Jadwal Ujian
│   ├── organizations/
│   │   ├── page.tsx            # Halaman Daftar Organisasi
│   │   └── [id]/
│   │       ├── page.tsx        # Detail Organisasi
│   │       ├── programs/
│   │       │   └── page.tsx    # Halaman Program Kerja
│   │       └── events/
│   │           └── page.tsx    # Halaman Rapat/Event
│   ├── career/
│   │   ├── page.tsx            # Halaman Dashboard Freelance/Karier
│   │   ├── clients/
│   │   │   └── page.tsx        # Halaman Manajemen Klien
│   │   └── projects/
│   │       └── page.tsx        # Halaman Pelacakan Proyek
│   ├── finance/
│   │   ├── page.tsx            # Halaman Dashboard Keuangan
│   │   └── transactions/
│   │       └── page.tsx        # Halaman Riwayat Transaksi
│   ├── habits/
│   │   └── page.tsx            # Halaman Habit Tracker
│   ├── goals/
│   │   └── page.tsx            # Halaman Goal Tracker
│   ├── notes/
│   │   └── page.tsx            # Halaman Editor Catatan Markdown
│   └── settings/
│       └── page.tsx            # Halaman Pengaturan Profil & Sistem
│
├── features/                   # LOGIKA BISNIS MODULAR & SPESIFIK FITUR (Feature-Based)
│   ├── auth/                   # Fitur Autentikasi
│   │   ├── components/         # Google Sign-In Button, login-form.tsx
│   │   ├── services/           # Google OAuth config & callback helpers
│   │   └── types/              # auth.types.ts
│   ├── dashboard/              # Fitur Ringkasan/Dashboard
│   │   ├── components/         # agenda-summary.tsx, metric-cards.tsx
│   │   └── services/           # Query data dashboard: dashboard-queries.ts
│   ├── academic/               # Fitur Akademik
│   │   ├── components/         # course-list.tsx, assignment-form.tsx, exam-card.tsx
│   │   └── services/           # Server Actions: academic-actions.ts
│   ├── organization/           # Fitur Organisasi
│   │   ├── components/         # org-card.tsx, task-delegation.tsx, event-form.tsx
│   │   └── services/           # Server Actions: org-actions.ts
│   ├── career/                 # Fitur Karier & Freelance
│   │   ├── components/         # client-list.tsx, project-board.tsx, invoice-form.tsx
│   │   └── services/           # Server Actions: career-actions.ts
│   ├── finance/                # Fitur Keuangan
│   │   ├── components/         # transaction-table.tsx, transaction-form.tsx, budget-limit.tsx
│   │   └── services/           # Server Actions: finance-actions.ts
│   ├── habit/                  # Fitur Habit
│   │   ├── components/         # habit-checklist.tsx, streak-heatmap.tsx
│   │   └── services/           # Server Actions: habit-actions.ts
│   ├── goal/                   # Fitur Goal
│   │   ├── components/         # goal-list.tsx, goal-progress-bar.tsx
│   │   └── services/           # Server Actions: goal-actions.ts
│   └── notes/                  # Fitur Notes
│       ├── components/         # markdown-editor.tsx, note-sidebar.tsx
│       └── services/           # Server Actions: note-actions.ts
│
├── components/                 # KOMPONEN GLOBAL & BERBAGI (Global Shared UI)
│   ├── ui/                     # Komponen Dasar Shadcn (button.tsx, card.tsx, dialog.tsx, dll.)
│   ├── sidebar.tsx             # Navigasi Menu Samping Aplikasi
│   └── navbar.tsx              # Navigasi Header Atas
│
├── lib/                        # INSTANSIASI KLAIM & KONFIGURASI GLOBAL
│   ├── prisma.ts               # Inisialisasi Prisma Client (Prisma adapter)
│   ├── auth.ts                 # Konfigurasi NextAuth (NextAuthOptions, Providers)
│   └── utils.ts                # Utilitas global (cn helper untuk Tailwind merge)
│
├── hooks/                      # REACT HOOKS GLOBAL (Shared Hooks)
│   ├── use-toast.ts            # Hook untuk trigger notifikasi toast
│   └── use-media-query.ts      # Hook untuk deteksi lebar layar responsif
│
├── services/                   # LAYANAN GLOBAL SHARED (Non-modul spesifik)
│   └── upload-service.ts       # Layanan penanganan upload file (jika ada)
│
├── prisma/                     # DATABASE SCHEMA & MIGRATIONS
│   ├── schema.prisma           # Definisi model Prisma Database
│   └── migrations/             # Kumpulan file migrasi SQL PostgreSQL
│
├── public/                     # ASSET STATIS
│   └── logo.png                # Logo aplikasi
│
├── package.json
└── tsconfig.json
```

---

## 2. Penjelasan Pemisahan Arsitektur

- **`app/` (Routing Only)**: Direktori ini secara ketat hanya menangani struktur rute URL Next.js App Router dan fungsi pemuatan awal data (data fetching di `page.tsx`). Tidak boleh ada logika bisnis yang ditulis langsung di sini. Seluruh halaman mengimpor layout dan view dari folder `features/`.
- **`features/` (Modular Domain)**: Tempat utama menulis logika bisnis. Setiap modul bersifat independen dan merangkum komponen visual (`components/`), Server Actions (`services/`), dan tipe TypeScript (`types/`) tersendiri. Ini memudahkan perawatan kode (maintainability) seiring bertumbuhnya kompleksitas aplikasi.
- **`components/ui/` (Design System)**: Berisi pustaka UI primitif dari **Shadcn UI** yang tidak terikat dengan domain bisnis apapun. Contoh: tombol, dialog modal, dropdown, dan input text.
- **`lib/` (Shared Configurations)**: Menyimpan setup runtime library global seperti database client (`prisma.ts`) dan otentikasi (`auth.ts`).