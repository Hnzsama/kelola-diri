# Feature Breakdown - Kelola Diri

Dokumen ini berisi spesifikasi fitur lengkap untuk aplikasi **Kelola Diri**, yang dikelompokkan berdasarkan modul domain. Setiap fitur menyertakan deskripsi, cerita pengguna (user story), cakupan rilis (MVP atau Future), dan tingkat prioritas.

---

## 1. Domain Dashboard

### Fitur 1.1: Dashboard Ringkasan Agenda Hari Ini (Today's Agenda Summary)
- **Deskripsi**: Tampilan utama (landing page setelah login) yang menyatukan semua agenda hari ini: jadwal kuliah terdekat, tugas kuliah yang akan jatuh tempo, agenda rapat/event organisasi, checklist habit hari ini, dan catatan penting.
- **User Story**: 
  > *Sebagai mahasiswa aktif, saya ingin melihat semua agenda penting saya hari ini dalam satu tempat agar saya tidak melewatkan tugas kuliah atau rapat organisasi.*
- **Scope**: **MVP** (Phase 1)
- **Prioritas**: **High**

### Fitur 1.2: Grafik Keuangan & Progres Target Ringkas
- **Deskripsi**: Widget dasbor yang menampilkan grafik tren pengeluaran 7 hari terakhir serta persentase pencapaian target hidup (goal).
- **User Story**: 
  > *Sebagai mahasiswa, saya ingin melihat rangkuman pengeluaran dan capaian target jangka panjang langsung di beranda untuk menjaga kesadaran finansial dan arah hidup saya.*
- **Scope**: **Future** (Phase 5)
- **Prioritas**: **Medium**

### Fitur 1.3: Google OAuth Single Sign-On (Gmail Login)
- **Deskripsi**: Sistem masuk terpadu (SSO) menggunakan Google OAuth 2.0. Menghilangkan alur registrasi tradisional dan pengisian password manual demi keamanan dan kemudahan.
- **User Story**: 
  > *Sebagai mahasiswa, saya ingin masuk ke aplikasi dengan sekali klik menggunakan akun Gmail agar proses autentikasi cepat, praktis, dan aman.*
- **Scope**: **MVP** (Phase 1)
- **Prioritas**: **High**

---

## 2. Domain Akademik

### Fitur 2.1: Manajemen Jadwal Kuliah (Course Scheduler)
- **Deskripsi**: Fitur untuk membuat, membaca, mengubah, dan menghapus (CRUD) jadwal kuliah, termasuk nama mata kuliah, dosen pengampu, hari, jam, ruang kelas, dan jumlah SKS.
- **User Story**: 
  > *Sebagai mahasiswa, saya ingin mencatat dan melihat jadwal kuliah saya agar saya tidak lupa ruang kelas dan jam mulai perkuliahan.*
- **Scope**: **MVP** (Phase 1)
- **Prioritas**: **High**

### Fitur 2.2: Pelacak Tugas Kuliah (Assignment Tracker)
- **Deskripsi**: Daftar tugas kuliah dengan detail deadline, tingkat kesulitan, status pengerjaan (Belum Dimulai, Sedang Dikerjakan, Selesai), dan dapat ditautkan ke mata kuliah terkait.
- **User Story**: 
  > *Sebagai mahasiswa, saya ingin mencatat tugas-tugas kuliah beserta deadline-nya agar saya bisa menyelesaikannya tepat waktu dan menghindari penumpukan tugas.*
- **Scope**: **MVP** (Phase 1)
- **Prioritas**: **High**

### Fitur 2.3: Manajemen Jadwal Ujian (Exam Scheduler)
- **Deskripsi**: Pencatatan jadwal ujian (UTS/UAS) dengan tanggal, tipe ujian (open book/closed book), dan lokasi ujian.
- **User Story**: 
  > *Sebagai mahasiswa, saya ingin mencatat jadwal ujian saya agar bisa mempersiapkan materi belajar jauh-jauh hari.*
- **Scope**: **MVP** (Phase 1)
- **Prioritas**: **Medium**

---

## 3. Domain Organisasi

### Fitur 3.1: Direktori Organisasi & Kepanitiaan (Organization Directory)
- **Deskripsi**: Melacak organisasi atau kepanitiaan yang diikuti pengguna beserta masa aktif, peran/jabatan, dan deskripsi singkat.
- **User Story**: 
  > *Sebagai mahasiswa aktif, saya ingin mencatat peran saya di berbagai organisasi untuk mendokumentasikan riwayat keaktifan saya.*
- **Scope**: **MVP** (Phase 2)
- **Prioritas**: **High**

### Fitur 3.2: Jadwal Rapat & Proker Organisasi (Event Planner)
- **Deskripsi**: Agenda kegiatan internal organisasi, program kerja, atau rapat koordinasi lengkap dengan tanggal, link Google Meet (jika online), dan keterangan acara.
- **User Story**: 
  > *Sebagai panitia kegiatan, saya ingin mencatat jadwal program kerja organisasi saya agar seluruh tim tahu timeline kerja bersama.*
- **Scope**: **MVP** (Phase 2)
- **Prioritas**: **Medium**

### Fitur 3.3: Penugasan Kepanitiaan Personal (Org Task Tracker)
- **Deskripsi**: Daftar tugas yang dibebankan kepada pengguna di dalam suatu program kerja organisasi (misal: "Membuat proposal sponsor", "Menghubungi pemateri").
- **User Story**: 
  > *Sebagai anggota divisi acara, saya ingin melihat daftar tugas spesifik saya untuk event agar persiapan berjalan lancar.*
- **Scope**: **MVP** (Phase 2)
- **Prioritas**: **Medium**

---

## 4. Domain Karier & Freelance

### Fitur 4.1: Direktori Klien & Manajemen Proyek (Client & Project Registry)
- **Deskripsi**: Mengelola daftar klien freelance dan memantau status proyek aktif (kontrak, pengerjaan, revisi, selesai).
- **User Story**: 
  > *Sebagai freelancer mahasiswa, saya ingin mengelompokkan tugas-tugas berdasarkan proyek klien agar manajemen kerja tidak bercampur aduk.*
- **Scope**: **Future** (Phase 4)
- **Prioritas**: **Medium**

### Fitur 4.2: Pelacakan Milestone & Pembayaran (Payment & Milestone Tracker)
- **Deskripsi**: Mengatur target pencapaian proyek (milestones) serta melacak invoice pembayaran (Down Payment, Termin 2, Pelunasan).
- **User Story**: 
  > *Sebagai freelancer, saya ingin melacak status pembayaran proyek agar saya tahu klien mana yang belum membayar.*
- **Scope**: **Future** (Phase 4)
- **Prioritas**: **Low**

---

## 5. Domain Keuangan

### Fitur 5.1: Pencatatan Transaksi Masuk & Keluar (Transaction Ledger)
- **Deskripsi**: Input pengeluaran (jajan, print tugas, iuran kepanitiaan) dan pemasukan (uang bulanan dari ortu, pendapatan proyek freelance) lengkap dengan kategori, nominal, tanggal, dan catatan tambahan.
- **User Story**: 
  > *Sebagai mahasiswa yang ingin mengontrol keuangan, saya ingin mencatat setiap pengeluaran harian agar bisa memantau ke mana perginya uang saya.*
- **Scope**: **Future** (Phase 3)
- **Prioritas**: **High**

### Fitur 5.2: Batas Anggaran Kategori (Monthly Category Budgeting)
- **Deskripsi**: Mengatur pagu/limit anggaran bulanan per kategori transaksi (misalnya limit jajan Rp1.000.000/bulan) dan memberikan indikator peringatan jika mendekati limit.
- **User Story**: 
  > *Sebagai mahasiswa kost, saya ingin memberi batas pengeluaran untuk kategori makanan agar uang bulanan saya tidak habis sebelum waktunya.*
- **Scope**: **Future** (Phase 3)
- **Prioritas**: **Medium**

---

## 6. Domain Habit

### Fitur 6.1: Papan Kebiasaan Harian (Daily Habit Tracker)
- **Deskripsi**: Halaman checklist harian untuk memantau kebiasaan positif yang ingin dibangun (seperti belajar algoritma, minum air 2L, tidur 7 jam).
- **User Story**: 
  > *Sebagai mahasiswa yang ingin hidup seimbang, saya ingin mencentang kebiasaan harian saya setiap hari untuk membangun konsistensi diri.*
- **Scope**: **MVP** (Phase 2)
- **Prioritas**: **High**

### Fitur 6.2: Statistik Streak & Heatmap Konsistensi (Habit Heatmap)
- **Deskripsi**: Visualisasi berupa heatmap bulanan/tahunan (seperti Github contribution graph) dan penghitungan streak hari terlama berturut-turut untuk meningkatkan motivasi.
- **User Story**: 
  > *Sebagai pengguna, saya ingin melihat statistik streak kebiasaan saya agar merasa termotivasi untuk mempertahankan rentetan kebiasaan baik.*
- **Scope**: **MVP** (Phase 2)
- **Prioritas**: **Medium**

---

## 7. Domain Goal

### Fitur 7.1: Manajemen Target Hidup (Goal Setter & Milestone)
- **Deskripsi**: Menetapkan target jangka panjang (misal: "Lulus dengan IPK >= 3.6", "Beli laptop baru hasil freelance") dan mendefinisikan langkah progres konkret yang terukur.
- **User Story**: 
  > *Sebagai mahasiswa berorientasi masa depan, saya ingin menulis target jangka panjang saya beserta langkah-langkah konkretnya agar tetap fokus pada impian besar saya.*
- **Scope**: **Future** (Phase 5)
- **Prioritas**: **Medium**

---

## 8. Domain Notes

### Fitur 8.1: Catatan Berbasis Markdown (Markdown Notes Editor)
- **Deskripsi**: Editor catatan berbasis teks markdown (bisa untuk ringkasan materi kuliah, log rapat organisasi, atau coretan ide) yang dapat dikelompokkan ke dalam kategori atau dihubungkan ke mata kuliah.
- **User Story**: 
  > *Sebagai mahasiswa, saya ingin mencatat ringkasan kuliah langsung di dalam aplikasi agar semua data kuliah saya terpusat tanpa kertas.*
- **Scope**: **MVP** (Phase 1)
- **Prioritas**: **High**