# Spesifikasi Database - Kelola Diri

Dokumen ini mendefinisikan skema fisik database PostgreSQL untuk aplikasi **Kelola Diri** berdasarkan ERD yang telah dirancang.

---

### 1. Tabel: `users`
**Deskripsi**: Menyimpan data akun utama pengguna.

| Kolom | Tipe Data | Nullable | Primary Key | Foreign Key | Default Value | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | VARCHAR(36) | No | Yes | No | gen_random_uuid() | ID unik UUID v4 |
| `name` | VARCHAR(100) | No | No | No | - | Nama lengkap pengguna |
| `email` | VARCHAR(150) | No | No | No | - | Email unik (untuk login) |
| `password` | VARCHAR(255) | No | No | No | - | Hash password (bcrypt) |
| `createdAt` | TIMESTAMP | No | No | No | CURRENT_TIMESTAMP | Tanggal pendaftaran |

---

### 2. Tabel: `courses`
**Deskripsi**: Menyimpan jadwal dan informasi mata kuliah mahasiswa.

| Kolom | Tipe Data | Nullable | Primary Key | Foreign Key | Default Value | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | VARCHAR(36) | No | Yes | No | gen_random_uuid() | ID unik mata kuliah |
| `userId` | VARCHAR(36) | No | No | Yes (`users.id` ON DELETE CASCADE) | - | Relasi ke pemilik data |
| `name` | VARCHAR(100) | No | No | No | - | Nama mata kuliah |
| `code` | VARCHAR(20) | Yes | No | No | NULL | Kode mata kuliah (misal: IF-201) |
| `lecturer` | VARCHAR(100) | Yes | No | No | NULL | Nama dosen pengampu |
| `day` | VARCHAR(15) | No | No | No | - | Hari kuliah (Senin-Sabtu) |
| `startTime` | TIME | No | No | No | - | Jam mulai perkuliahan |
| `endTime` | TIME | No | No | No | - | Jam selesai perkuliahan |
| `room` | VARCHAR(50) | Yes | No | No | NULL | Ruang kelas kuliah |
| `credits` | INTEGER | No | No | No | 2 | Jumlah SKS |

---

### 3. Tabel: `assignments`
**Deskripsi**: Menyimpan daftar penugasan/tugas kuliah.

| Kolom | Tipe Data | Nullable | Primary Key | Foreign Key | Default Value | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | VARCHAR(36) | No | Yes | No | gen_random_uuid() | ID unik tugas |
| `courseId` | VARCHAR(36) | No | No | Yes (`courses.id` ON DELETE CASCADE) | - | Relasi ke mata kuliah terkait |
| `title` | VARCHAR(150) | No | No | No | - | Judul penugasan |
| `description` | TEXT | Yes | No | No | NULL | Deskripsi detail tugas |
| `dueDate` | TIMESTAMP | No | No | No | - | Batas waktu pengumpulan (deadline) |
| `status` | VARCHAR(30) | No | No | No | 'TODO' | Status ('TODO', 'IN_PROGRESS', 'DONE') |
| `priority` | VARCHAR(20) | No | No | No | 'MEDIUM' | Tingkat prioritas ('LOW', 'MEDIUM', 'HIGH') |

---

### 4. Tabel: `exams`
**Deskripsi**: Menyimpan jadwal ujian tengah/akhir semester.

| Kolom | Tipe Data | Nullable | Primary Key | Foreign Key | Default Value | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | VARCHAR(36) | No | Yes | No | gen_random_uuid() | ID unik ujian |
| `courseId` | VARCHAR(36) | No | No | Yes (`courses.id` ON DELETE CASCADE) | - | Relasi ke mata kuliah terkait |
| `title` | VARCHAR(100) | No | No | No | - | Judul ujian (UTS/UAS/Kuis) |
| `date` | TIMESTAMP | No | No | No | - | Tanggal dan waktu ujian |
| `room` | VARCHAR(50) | Yes | No | No | NULL | Ruang pelaksanaan ujian |
| `type` | VARCHAR(30) | No | No | No | 'CLOSED_BOOK' | Sifat ujian ('OPEN_BOOK', 'CLOSED_BOOK', 'TAKE_HOME') |

---

### 5. Tabel: `organizations`
**Deskripsi**: Menyimpan data entitas organisasi yang ada.

| Kolom | Tipe Data | Nullable | Primary Key | Foreign Key | Default Value | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | VARCHAR(36) | No | Yes | No | gen_random_uuid() | ID unik organisasi |
| `name` | VARCHAR(100) | No | No | No | - | Nama organisasi |
| `description` | TEXT | Yes | No | No | NULL | Profil singkat organisasi |

---

### 6. Tabel: `organization_members`
**Deskripsi**: Tabel perantara keanggotaan user di dalam organisasi (Many-to-Many).

| Kolom | Tipe Data | Nullable | Primary Key | Foreign Key | Default Value | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | VARCHAR(36) | No | Yes | No | gen_random_uuid() | ID unik relasi anggota |
| `userId` | VARCHAR(36) | No | No | Yes (`users.id` ON DELETE CASCADE) | - | Relasi ke user |
| `organizationId` | VARCHAR(36) | No | No | Yes (`organizations.id` ON DELETE CASCADE) | - | Relasi ke organisasi |
| `role` | VARCHAR(50) | No | No | No | 'MEMBER' | Jabatan/Peran (misal: 'CHAIR', 'SECRETARY', 'STAFF') |
| `joinedAt` | TIMESTAMP | No | No | No | CURRENT_TIMESTAMP | Tanggal masuk organisasi |

---

### 7. Tabel: `organization_events`
**Deskripsi**: Program kerja atau agenda rapat dari organisasi.

| Kolom | Tipe Data | Nullable | Primary Key | Foreign Key | Default Value | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | VARCHAR(36) | No | Yes | No | gen_random_uuid() | ID unik event |
| `organizationId` | VARCHAR(36) | No | No | Yes (`organizations.id` ON DELETE CASCADE) | - | Relasi ke organisasi penyelenggara |
| `title` | VARCHAR(150) | No | No | No | - | Judul program kerja/rapat |
| `description` | TEXT | Yes | No | No | NULL | Deskripsi detail event |
| `date` | TIMESTAMP | No | No | No | - | Waktu pelaksanaan event |
| `location` | VARCHAR(100) | Yes | No | No | NULL | Lokasi acara (offline/online link) |

---

### 8. Tabel: `organization_tasks`
**Deskripsi**: Tugas-tugas individu mahasiswa dalam kepanitiaan organisasi.

| Kolom | Tipe Data | Nullable | Primary Key | Foreign Key | Default Value | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | VARCHAR(36) | No | Yes | No | gen_random_uuid() | ID unik tugas organisasi |
| `eventId` | VARCHAR(36) | No | No | Yes (`organization_events.id` ON DELETE CASCADE) | - | Relasi ke event/proker terkait |
| `assignedToUserId` | VARCHAR(36) | No | No | Yes (`users.id` ON DELETE RESTRICT) | - | Penerima delegasi tugas |
| `title` | VARCHAR(150) | No | No | No | - | Judul tugas kepanitiaan |
| `description` | TEXT | Yes | No | No | NULL | Instruksi detail tugas |
| `dueDate` | TIMESTAMP | Yes | No | No | NULL | Tenggat pengerjaan |
| `status` | VARCHAR(30) | No | No | No | 'TODO' | Status ('TODO', 'IN_PROGRESS', 'DONE') |

---

### 9. Tabel: `clients`
**Deskripsi**: Menyimpan data klien proyek freelance.

| Kolom | Tipe Data | Nullable | Primary Key | Foreign Key | Default Value | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | VARCHAR(36) | No | Yes | No | gen_random_uuid() | ID unik klien |
| `userId` | VARCHAR(36) | No | No | Yes (`users.id` ON DELETE CASCADE) | - | Pemilik hubungan klien |
| `name` | VARCHAR(100) | No | No | No | - | Nama klien / kontak utama |
| `company` | VARCHAR(100) | Yes | No | No | NULL | Nama perusahaan klien |
| `email` | VARCHAR(150) | Yes | No | No | NULL | Email kontak klien |
| `phone` | VARCHAR(20) | Yes | No | No | NULL | Nomor telepon klien |

---

### 10. Tabel: `projects`
**Deskripsi**: Menyimpan data proyek freelance aktif/selesai.

| Kolom | Tipe Data | Nullable | Primary Key | Foreign Key | Default Value | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | VARCHAR(36) | No | Yes | No | gen_random_uuid() | ID unik proyek |
| `clientId` | VARCHAR(36) | No | No | Yes (`clients.id` ON DELETE CASCADE) | - | Relasi ke klien pemberi proyek |
| `name` | VARCHAR(150) | No | No | No | - | Nama proyek freelance |
| `description` | TEXT | Yes | No | No | NULL | Deskripsi cakupan kerja proyek |
| `startDate` | TIMESTAMP | Yes | No | No | NULL | Tanggal mulai proyek |
| `endDate` | TIMESTAMP | Yes | No | No | NULL | Deadline proyek |
| `status` | VARCHAR(30) | No | No | No | 'PLANNING' | Status ('PLANNING', 'IN_PROGRESS', 'TESTING', 'DONE', 'CANCELLED') |
| `value` | DECIMAL(12,2) | No | No | No | 0.00 | Nilai nominal kontrak proyek |

---

### 11. Tabel: `project_tasks`
**Deskripsi**: Menyimpan backlog/task dari pengerjaan proyek freelance.

| Kolom | Tipe Data | Nullable | Primary Key | Foreign Key | Default Value | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | VARCHAR(36) | No | Yes | No | gen_random_uuid() | ID unik task proyek |
| `projectId` | VARCHAR(36) | No | No | Yes (`projects.id` ON DELETE CASCADE) | - | Relasi ke proyek induk |
| `title` | VARCHAR(150) | No | No | No | - | Judul tugas pengerjaan |
| `description` | TEXT | Yes | No | No | NULL | Deskripsi detail pengerjaan task |
| `dueDate` | TIMESTAMP | Yes | No | No | NULL | Tanggal batas penyelesaian task |
| `status` | VARCHAR(30) | No | No | No | 'TODO' | Status ('TODO', 'IN_PROGRESS', 'DONE') |

---

### 12. Tabel: `categories`
**Deskripsi**: Kategori transaksi keuangan yang diatur secara personal.

| Kolom | Tipe Data | Nullable | Primary Key | Foreign Key | Default Value | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | VARCHAR(36) | No | Yes | No | gen_random_uuid() | ID unik kategori |
| `userId` | VARCHAR(36) | No | No | Yes (`users.id` ON DELETE CASCADE) | - | Relasi ke pemilik kategori |
| `name` | VARCHAR(50) | No | No | No | - | Nama kategori (misal: 'Makanan', 'Gaji') |
| `type` | VARCHAR(20) | No | No | No | - | Tipe kategori ('INCOME' atau 'EXPENSE') |

---

### 13. Tabel: `transactions`
**Deskripsi**: Menyimpan transaksi keuangan mahasiswa (pemasukan/pengeluaran).

| Kolom | Tipe Data | Nullable | Primary Key | Foreign Key | Default Value | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | VARCHAR(36) | No | Yes | No | gen_random_uuid() | ID unik transaksi |
| `userId` | VARCHAR(36) | No | No | Yes (`users.id` ON DELETE CASCADE) | - | Relasi ke user pemilik transaksi |
| `categoryId` | VARCHAR(36) | No | No | Yes (`categories.id` ON DELETE RESTRICT) | - | Relasi ke kategori transaksi |
| `projectId` | VARCHAR(36) | Yes | No | Yes (`projects.id` ON DELETE SET NULL) | NULL | Hubungan opsional ke proyek freelance |
| `eventId` | VARCHAR(36) | Yes | No | Yes (`organization_events.id` ON DELETE SET NULL) | NULL | Hubungan opsional ke event organisasi |
| `amount` | DECIMAL(12,2) | No | No | No | - | Nominal uang transaksi |
| `type` | VARCHAR(20) | No | No | No | - | Tipe transaksi ('INCOME' / 'EXPENSE') |
| `description` | TEXT | Yes | No | No | NULL | Keterangan/catatan transaksi |
| `date` | TIMESTAMP | No | No | No | CURRENT_TIMESTAMP | Tanggal transaksi dilakukan |

---

### 14. Tabel: `habits`
**Deskripsi**: Kebiasaan harian yang ingin dipantau konsistensinya.

| Kolom | Tipe Data | Nullable | Primary Key | Foreign Key | Default Value | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | VARCHAR(36) | No | Yes | No | gen_random_uuid() | ID unik habit |
| `userId` | VARCHAR(36) | No | No | Yes (`users.id` ON DELETE CASCADE) | - | Relasi ke pemilik data habit |
| `name` | VARCHAR(100) | No | No | No | - | Nama kebiasaan (misal: 'Minum 2L Air') |
| `description` | TEXT | Yes | No | No | NULL | Deskripsi tujuan habit |
| `frequency` | VARCHAR(20) | No | No | No | 'DAILY' | Frekuensi pelacakan ('DAILY', 'WEEKLY') |
| `createdAt` | TIMESTAMP | No | No | No | CURRENT_TIMESTAMP | Tanggal habit dibuat |

---

### 15. Tabel: `habit_logs`
**Deskripsi**: Log sejarah penyelesaian checklist habit harian.

| Kolom | Tipe Data | Nullable | Primary Key | Foreign Key | Default Value | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | VARCHAR(36) | No | Yes | No | gen_random_uuid() | ID unik log check-in |
| `habitId` | VARCHAR(36) | No | No | Yes (`habits.id` ON DELETE CASCADE) | - | Relasi ke instansi habit induk |
| `date` | DATE | No | No | No | - | Tanggal pencatatan check-in |
| `completed` | BOOLEAN | No | No | No | FALSE | Status keberhasilan (TRUE/FALSE) |

---

### 16. Tabel: `goals`
**Deskripsi**: Target jangka panjang / goals utama mahasiswa.

| Kolom | Tipe Data | Nullable | Primary Key | Foreign Key | Default Value | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | VARCHAR(36) | No | Yes | No | gen_random_uuid() | ID unik goal |
| `userId` | VARCHAR(36) | No | No | Yes (`users.id` ON DELETE CASCADE) | - | Relasi ke pemilik data |
| `title` | VARCHAR(150) | No | No | No | - | Pernyataan goal (misal: 'IPK Akhir > 3.5') |
| `description` | TEXT | Yes | No | No | NULL | Keterangan/alasan penetapan target |
| `targetDate` | TIMESTAMP | Yes | No | No | NULL | Tanggal estimasi pencapaian target |
| `status` | VARCHAR(30) | No | No | No | 'ACTIVE' | Status goal ('ACTIVE', 'COMPLETED', 'ABANDONED') |

---

### 17. Tabel: `goal_progresses`
**Deskripsi**: Pencatatan riwayat progres atau sub-milestone dari sebuah Goal.

| Kolom | Tipe Data | Nullable | Primary Key | Foreign Key | Default Value | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | VARCHAR(36) | No | Yes | No | gen_random_uuid() | ID unik milestone |
| `goalId` | VARCHAR(36) | No | No | Yes (`goals.id` ON DELETE CASCADE) | - | Relasi ke goal induk |
| `title` | VARCHAR(150) | No | No | No | - | Judul langkah progres (misal: 'Lulus Matkul X') |
| `targetValue` | DECIMAL(10,2) | No | No | No | 100.00 | Nilai target yang ingin dicapai |
| `currentValue` | DECIMAL(10,2) | No | No | No | 0.00 | Nilai progres saat ini |
| `date` | TIMESTAMP | No | No | No | CURRENT_TIMESTAMP | Tanggal update progres dilakukan |

---

### 18. Tabel: `notes`
**Deskripsi**: Dokumen catatan personal mahasiswa (ringkasan kuliah, notulen rapat, ide, dll).

| Kolom | Tipe Data | Nullable | Primary Key | Foreign Key | Default Value | Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | VARCHAR(36) | No | Yes | No | gen_random_uuid() | ID unik catatan |
| `userId` | VARCHAR(36) | No | No | Yes (`users.id` ON DELETE CASCADE) | - | Relasi ke pembuat catatan |
| `title` | VARCHAR(150) | No | No | No | 'Catatan Tanpa Judul' | Judul catatan |
| `content` | TEXT | No | No | No | '' | Isi dokumen catatan (Markdown format) |
| `courseId` | VARCHAR(36) | Yes | No | Yes (`courses.id` ON DELETE SET NULL) | NULL | Relasi opsional ke mata kuliah terkait |
| `projectId` | VARCHAR(36) | Yes | No | Yes (`projects.id` ON DELETE SET NULL) | NULL | Relasi opsional ke proyek freelance terkait |
| `eventId` | VARCHAR(36) | Yes | No | Yes (`organization_events.id` ON DELETE SET NULL) | NULL | Relasi opsional ke event organisasi terkait |
| `updatedAt` | TIMESTAMP | No | No | No | CURRENT_TIMESTAMP | Tanggal pembaruan terakhir |