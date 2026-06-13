import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f4f4f5] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-mono transition-colors">
      {/* Navbar */}
      <nav className="border-b-4 border-zinc-900 bg-white dark:bg-zinc-900 p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
            ⚡ Kelola Diri
          </Link>
          <div className="flex gap-4">
            <Link href="/login">
              <button className="px-4 py-2 border-2 border-zinc-900 dark:border-white font-extrabold text-xs uppercase bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] active:translate-y-[1px] transition-all cursor-pointer">
                Masuk
              </button>
            </Link>
            <Link href="/register">
              <button className="px-4 py-2 border-2 border-zinc-900 bg-primary text-primary-foreground font-extrabold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] active:translate-y-[1px] transition-all cursor-pointer">
                Daftar
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-6xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="inline-block bg-[#ff3366] text-white border-2 border-zinc-900 px-3 py-1 font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-6">
          🚀 Personal OS Mahasiswa Aktif
        </div>
        <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-zinc-900 dark:text-white leading-none mb-6">
          Kelola Kuliah, Organisasi, & Dompet Tanpa Mager
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
          Satu-satunya asisten personal mahasiswa yang menyatukan jadwal akademik, agenda organisasi, kebiasaan harian, target impian, dan diagnosa keuangan dengan Asisten Email berkop kop surat ala Gen-Z! 😎🔥
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/register">
            <button className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground border-4 border-zinc-900 font-extrabold text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
              Mulai Kelola Sekarang
            </button>
          </Link>
          <Link href="/login">
            <button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border-4 border-zinc-900 dark:border-white font-extrabold text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer">
              Dashboard Utama
            </button>
          </Link>
        </div>
      </header>

      {/* Modules Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12 border-t-4 border-zinc-900 dark:border-zinc-800">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-8 text-center sm:text-left">
          🛠️ Fitur Andalan Pusat Kontrol Hidupmu
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Academic */}
          <div className="border-4 border-zinc-900 bg-white dark:bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="font-extrabold text-lg uppercase mb-2">Akademik & Nilai</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Catat jadwal kuliah, pantau tugas deadline mendesak, kelola ujian, dan kalkulasikan IPK target kamu secara otomatis.
            </p>
          </div>

          {/* Organizations */}
          <div className="border-4 border-zinc-900 bg-white dark:bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="font-extrabold text-lg uppercase mb-2">Manajemen Organisasi</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Kelola jabatan pengurus panitia, jadwalkan rapat agenda divisimu, dan lacak pengerjaan tugas proker kepanitiaan bersama.
            </p>
          </div>

          {/* Habit Tracker */}
          <div className="border-4 border-zinc-900 bg-white dark:bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <div className="text-4xl mb-4">🔥</div>
            <h3 className="font-extrabold text-lg uppercase mb-2">Habit Tracker</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bentuk kebiasaan harian positif, selesaikan checklist rutin, dan pertahankan streak harianmu agar tidak terputus.
            </p>
          </div>

          {/* Finance */}
          <div className="border-4 border-zinc-900 bg-white dark:bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <div className="text-4xl mb-4">💸</div>
            <h3 className="font-extrabold text-lg uppercase mb-2">Batas Anggaran Pintar</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Diagnosa pengeluaran kategori, pantau alarm waspada, alokasikan sisa kas bersih ke target tabungan dengan sekali klik.
            </p>
          </div>

          {/* Goals */}
          <div className="border-4 border-zinc-900 bg-white dark:bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="font-extrabold text-lg uppercase mb-2">Target & Milestone</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Rancang impian besar hidupmu, bagi ke dalam tahapan milestone kecil, dan tulis refleksi progress review bulanan.
            </p>
          </div>

          {/* Email Personal Assistant */}
          <div className="border-4 border-zinc-900 bg-white dark:bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="font-extrabold text-lg uppercase mb-2">Asisten Email Gen-Z</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dapatkan email pengingat harian tugas/habit, alarm budget warning otomatis, dan weekly review hidupmu dengan gaya asyik.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-zinc-900 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-xs text-zinc-500 font-bold uppercase tracking-wider">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Kelola Diri. Made with Love for Active Students.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:underline">Masuk</Link>
            <span>•</span>
            <Link href="/register" className="hover:underline">Daftar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
