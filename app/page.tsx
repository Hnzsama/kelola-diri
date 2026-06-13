import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session;

  const features = [
    {
      emoji: "📚",
      title: "Akademik & Nilai",
      desc: "Jadwal kuliah, tugas mendesak, ujian mendatang, dan kalkulator IPK target otomatis.",
      path: isLoggedIn ? "/dashboard/academic" : "/login",
      color: "bg-pink-100 dark:bg-pink-950/30",
    },
    {
      emoji: "🏢",
      title: "Organisasi Aktif",
      desc: "Struktur pengurus, rapat agenda divisi, dan koordinasi tugas kepanitiaan bersama.",
      path: isLoggedIn ? "/dashboard/organizations" : "/login",
      color: "bg-blue-100 dark:bg-blue-950/30",
    },
    {
      emoji: "🔥",
      title: "Habit Tracker",
      desc: "Bentuk kebiasaan positif harian, checklist rutin, dan pantau streak anti-putus.",
      path: isLoggedIn ? "/dashboard/habits" : "/login",
      color: "bg-emerald-100 dark:bg-emerald-950/30",
    },
    {
      emoji: "💸",
      title: "Anggaran Pintar",
      desc: "Diagnosa limit pengeluaran bulanan, alarm 80% / 100%, dan alokasi tabungan.",
      path: isLoggedIn ? "/dashboard/finance/budget" : "/login",
      color: "bg-amber-100 dark:bg-amber-950/30",
    },
    {
      emoji: "🎯",
      title: "Target & Milestone",
      desc: "Rancang impian besar hidupmu, breakdown fase milestone, dan tulis review refleksi.",
      path: isLoggedIn ? "/dashboard/goals" : "/login",
      color: "bg-purple-100 dark:bg-purple-950/30",
    },
    {
      emoji: "⚡",
      title: "Asisten Email",
      desc: "Notifikasi otomatis reminder tugas, habit, budget breach dengan gaya Gen-Z.",
      path: isLoggedIn ? "/dashboard/settings" : "/login",
      color: "bg-cyan-100 dark:bg-cyan-950/30",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f4f5] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-mono transition-colors">
      {/* Navbar */}
      <nav className="border-b-4 border-zinc-900 bg-white dark:bg-zinc-900 p-3 sm:p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-1 sm:px-4 flex justify-between items-center">
          <Link href="/" className="text-lg sm:text-xl font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-1.5">
            ⚡ Kelola Diri
          </Link>
          <div className="flex gap-2 sm:gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <button className="px-3.5 py-1.5 border-2 border-zinc-900 bg-primary text-primary-foreground font-extrabold text-[11px] sm:text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] active:translate-y-[1px] transition-all cursor-pointer">
                  Dashboard ↗
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <button className="px-3 py-1.5 border-2 border-zinc-900 dark:border-white font-extrabold text-[11px] sm:text-xs uppercase bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] active:translate-y-[1px] transition-all cursor-pointer">
                    Masuk
                  </button>
                </Link>
                <Link href="/register">
                  <button className="px-3 py-1.5 border-2 border-zinc-900 bg-primary text-primary-foreground font-extrabold text-[11px] sm:text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] active:translate-y-[1px] transition-all cursor-pointer">
                    Daftar
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-6xl mx-auto px-3 sm:px-6 py-10 sm:py-20 text-center">
        <div className="inline-block bg-[#ff3366] text-white border-2 border-zinc-900 px-2.5 py-0.5 font-bold text-[10px] sm:text-xs uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] mb-4">
          🚀 Personal OS Mahasiswa Aktif
        </div>
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-zinc-900 dark:text-white leading-none mb-4 sm:mb-6">
          Kelola Kuliah, Organisasi, & Dompet Tanpa Mager
        </h1>
        <p className="max-w-xl mx-auto text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-6 sm:mb-8 leading-relaxed">
          Pusat kendali operasional hidupmu. Satukan akademik, kepanitiaan organisasi, habit tracking harian, milestones impian, dan anggaran belanja secara dinamis.
        </p>
        <div className="flex justify-center px-1">
          {isLoggedIn ? (
            <Link href="/dashboard" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-6 py-3.5 bg-primary text-primary-foreground border-4 border-zinc-900 font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] active:translate-y-[1px] transition-all cursor-pointer">
                Kembali ke Dashboard Utama 🚀
              </button>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center gap-3 w-full sm:w-auto">
              <Link href="/register" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-6 py-3.5 bg-primary text-primary-foreground border-4 border-zinc-900 font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] active:translate-y-[1px] transition-all cursor-pointer">
                  Mulai Kelola Sekarang
                </button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border-4 border-zinc-900 dark:border-white font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] active:translate-y-[1px] transition-all cursor-pointer">
                  Dashboard Utama
                </button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Launcher Grid */}
      <section className="max-w-6xl mx-auto px-3 sm:px-6 py-8 border-t-4 border-zinc-900 dark:border-zinc-800">
        <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight mb-6 text-center sm:text-left">
          📱 Dashboard Launcher Aplikasi
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, idx) => (
            <Link key={idx} href={f.path} className="group block">
              <div className={`border-4 border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)] group-hover:-translate-y-[2px] group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] transition-all cursor-pointer h-full flex flex-col justify-between`}>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-3xl">{f.emoji}</span>
                    <span className="text-xs font-bold text-zinc-400 group-hover:text-primary transition-colors">BUKA →</span>
                  </div>
                  <h3 className="font-extrabold text-sm uppercase mb-1">{f.title}</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                    {f.desc}
                  </p>
                </div>
                <div className={`mt-3 p-1.5 text-[9px] font-bold text-center border-2 border-zinc-900 uppercase ${f.color}`}>
                  Masuk Modul
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-zinc-900 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
        <div className="max-w-6xl mx-auto px-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 Kelola Diri. Optimized Mobile App Experience.</p>
          <div className="flex gap-3">
            <Link href="/login" className="hover:underline">Masuk</Link>
            <span>•</span>
            <Link href="/register" className="hover:underline">Daftar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
