# Arsitektur Aplikasi - Kelola Diri

Dokumen ini menjelaskan rancangan arsitektur teknis aplikasi **Kelola Diri** beserta aliran data antarkomponen dari sisi pengguna hingga ke basis data.

---

## 1. Diagram Arsitektur (Mermaid Diagram)

```mermaid
graph TD
    User(["User / Pengguna"]) -->|Interaksi UI| Browser["Browser / Client-side"]
    
    subgraph Client ["Client-side - React Client Components"]
        Browser -->|Session Provider| ClientSession["NextAuth Client Session"]
        Browser -->|Components| UI["Shadcn UI & Tailwind CSS"]
    End
    
    Browser -->|HTTP Requests / Server Actions| NextServer["Next.js Server / Server-side"]

    subgraph Server ["Server-side - Next.js App Router"]
        NextServer -->|Middleware| NextAuth["NextAuth Handler"]
        NextServer -->|Rendering| RSC["React Server Components"]
        NextServer -->|Business Logic| APILayer["API Layer / Server Actions"]
    End
    
    APILayer -->|Type-safe Queries| Prisma["Prisma ORM"]
    Prisma -->|Connection Pool / pg| DB[("PostgreSQL Database")]
    
    style User fill:#f9f,stroke:#333,stroke-width:2px
    style DB fill:#85c1e9,stroke:#333,stroke-width:2px
```

---

## 2. Penjelasan Komponen Arsitektur

### 2.1. User (Pengguna)
- Aktor utama (mahasiswa) yang berinteraksi langsung dengan aplikasi melalui perangkat komputer atau smartphone.

### 2.2. Browser (Client-Side)
- **UI & Styling**: Menggunakan **Shadcn UI** yang dibangun di atas Radix Primitives untuk komponen UI yang aksesibel, dikombinasikan dengan **Tailwind CSS v4** untuk styling responsif, cepat, dan modern.
- **Client Session**: **NextAuth Client Session Provider** digunakan untuk melacak status login pengguna di sisi klien secara aman tanpa perlu melakukan pemanggilan API manual.
- **React Client Components**: Bagian UI yang membutuhkan interaktivitas tinggi seperti form input keuangan, checklist habit harian, dan grafik interaktif.

### 2.3. Next.js Server (Server-Side)
- **App Router Layout**: Menangani perutean aplikasi. Halaman dimuat secara default sebagai **React Server Components (RSC)** untuk mempercepat First Contentful Paint (FCP) dan mengurangi ukuran bundle JavaScript di sisi klien.
- **NextAuth Middleware**: Bertindak sebagai penjaga gerbang (route protection). Middleware mendeteksi token sesi pengguna sebelum memberikan akses ke halaman dashboard internal. Jika tidak valid, pengguna otomatis diarahkan ke halaman login.

### 2.4. API Layer & Server Actions
- **Server Actions**: Digunakan sebagai metode utama mutasi data (create, update, delete) langsung dari komponen React. Server Actions memberikan validasi tipe data bawaan dan meminimalkan kebutuhan penulisan endpoint REST API manual.
- **Zod Schema Validation**: Setiap input dari form (seperti nominal transaksi keuangan atau detail tugas kuliah) divalidasi secara ketat di tingkat server menggunakan pustaka Zod sebelum diproses ke database untuk mencegah serangan injeksi data ilegal.

### 2.5. Prisma ORM
- Sebagai pustaka pemetaan objek relasional (Object-Relational Mapping) yang bertipe aman (*type-safe*).
- Menghasilkan tipe TypeScript secara otomatis dari file `prisma/schema.prisma` sehingga mengurangi kesalahan query saat penulisan kode program.
- Menangani migrasi database secara terstruktur.

### 2.6. PostgreSQL Database
- Media penyimpanan persisten relasional. PostgreSQL dipilih karena keandalannya dalam menangani transaksi (ACID compliance) dan kemampuan relasi data yang kompleks (misalnya relasi user ke banyak organisasi, proyek, tugas kuliah, dan catatan).