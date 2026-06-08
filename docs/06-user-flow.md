# User Flow - Kelola Diri

Dokumen ini mendeskripsikan alur pengguna (User Flow) untuk 9 fitur utama aplikasi **Kelola Diri** menggunakan diagram alir Mermaid.

---

## 1. Alur Masuk & Pendaftaran Otomatis (Google OAuth Flow)
```mermaid
graph TD
    A["Pengguna di Halaman Login"] --> B["Klik Tombol 'Sign in with Google'"]
    B --> C["Browser mengarahkan ke Google OAuth Consent Page"]
    C --> D["Pengguna memilih/login akun Gmail"]
    D --> E["Google memvalidasi kredensial"]
    E -->|Berhasil| F["Callback ke NextAuth API Handler"]
    E -->|Gagal / Batal| G["Arahkan kembali ke /login dengan Pesan Error"]
    F --> H{"Cek apakah email sudah terdaftar di DB?"}
    H -->|Belum Terdaftar| I["Buat Record User Baru menggunakan Data Google"]
    H -->|Sudah Terdaftar| J["Gunakan Record User yang Ada"]
    I --> K["NextAuth Membuat JWT Session"]
    J --> K
    K --> L["Arahkan ke Halaman /dashboard"]
    G --> A
```


## 3. Alur Menambah Tugas Kuliah
```mermaid
graph TD
    A[Dashboard / Halaman Akademik] --> B[Klik 'Tambah Tugas']
    B --> C[Isi Form: Nama Tugas, Mata Kuliah, Tenggat, Deskripsi]
    C --> D{Klik Simpan}
    D --> E[Validasi Server-Side Zod]
    E -->|Error| F[Tampilkan Pesan Error di Form]
    E -->|Valid| G[Prisma Menyimpan Data Assignment]
    G --> H[Perbarui Tampilan Jadwal & Tugas]
    F --> C
```

---

## 4. Alur Menambah Kegiatan Organisasi
```mermaid
graph TD
    A[Halaman Organisasi] --> B[Pilih Organisasi Aktif]
    B --> C[Klik 'Tambah Event/Proker']
    C --> D[Isi Form: Nama Event, Tanggal, Peran, Deskripsi]
    D --> E{Klik Simpan}
    E --> F[Simpan Data OrganizationEvent ke Database]
    F --> G[Tampilkan Event di Kalender Organisasi & Dashboard]
```

---

## 5. Alur Menambah Proyek Freelance
```mermaid
graph TD
    A[Halaman Karier & Freelance] --> B[Pilih/Tambah Klien]
    B --> C[Klik 'Tambah Proyek']
    C --> D[Isi Form: Nama Proyek, Deadline, Nilai Kontrak]
    D --> E{Klik Simpan}
    E --> F[Simpan Data Project ke Database]
    F --> G[Tampilkan Proyek Baru di Daftar Aktif Karier]
```

---

## 6. Alur Menambah Transaksi Keuangan
```mermaid
graph TD
    A[Halaman Keuangan] --> B[Klik 'Tambah Transaksi']
    B --> C[Pilih Tipe: Pemasukan / Pengeluaran]
    C --> D[Isi Form: Nominal, Kategori, Tanggal, Keterangan]
    D --> E[Opsional: Hubungkan ke Proyek Freelance atau Event Organisasi]
    E --> F{Klik Simpan}
    F --> G[Simpan Data Transaction ke Database]
    G --> H[Update Saldo & Tampilkan Riwayat Transaksi Terbaru]
```

---

## 7. Alur Menambah Habit Baru
```mermaid
graph TD
    A[Halaman Habit Tracker] --> B[Klik 'Tambah Habit']
    B --> C[Isi Form: Nama Kebiasaan, Frekuensi, Waktu Pengingat]
    C --> D{Klik Simpan}
    D --> E[Simpan Data Habit Baru ke Database]
    E --> F[Habit Otomatis Muncul di Checklist Harian Halaman Utama]
```

---

## 8. Alur Membuat Goal Baru
```mermaid
graph TD
    A[Halaman Goal Tracker] --> B[Klik 'Tambah Goal Jangka Panjang']
    B --> C[Isi Form: Judul Target, Target Tanggal Pencapaian, Kategori]
    C --> D[Tentukan Kriteria Keberhasilan / Milestone Awal]
    D --> E{Klik Simpan}
    E --> F[Simpan Data Goal & GoalProgress ke Database]
    F --> G[Tampilkan Goal dengan Progress Bar 0% di Dashboard]
```

---

## 9. Alur Melihat Dashboard Utama (Memuat Halaman)
```mermaid
sequenceDiagram
    actor User as Pengguna
    participant Browser as Browser Klien
    participant Server as Next.js Server (RSC)
    participant Database as PostgreSQL (via Prisma)

    User->>Browser: Akses URL /dashboard
    Browser->>Server: Kirim Request GET /dashboard (Session Cookie)
    activate Server
    Server->>Server: Verifikasi Sesi Aktif via NextAuth
    alt Sesi Tidak Valid
        Server-->>Browser: Redirect ke /auth/login
    else Sesi Valid
        Server->>Database: Ambil Kuliah, Tugas, Rapat, & Checklist Habit hari ini
        activate Database
        Database-->>Server: Kembalikan Data Kolektif
        deactivate Database
        Server->>Server: Render React Server Components dengan Data
        Server-->>Browser: Kirim HTML Ter-render & Hydration JS
        deactivate Server
        Browser-->>User: Tampilkan Dashboard Terpadu (Today's Agenda)
    end
```