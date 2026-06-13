export interface HabitLog {
  date: string | Date;
  completed: boolean;
}

export interface HabitWithLogs {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  logs: HabitLog[];
}

export function calculateStreaks(logs: HabitLog[], refDate: Date = new Date("2026-06-14")) {
  // Ambil tanggal log yang selesai, ubah ke epoch time (tanpa jam)
  const completedDates = logs
    .filter((l) => l.completed)
    .map((l) => {
      const d = new Date(l.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
    .sort((a, b) => b - a); // Urutan menurun (terbaru dahulu)

  if (completedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const ONE_DAY = 24 * 60 * 60 * 1000;
  const midnightRef = new Date(refDate);
  midnightRef.setHours(0, 0, 0, 0);
  const refTime = midnightRef.getTime();

  // 1. Hitung Streak Saat Ini (Current Streak)
  let currentStreak = 0;
  let expectedTime = refTime;
  
  const hasToday = completedDates.includes(refTime);
  const hasYesterday = completedDates.includes(refTime - ONE_DAY);

  if (hasToday) {
    currentStreak = 1;
    expectedTime = refTime - ONE_DAY;
  } else if (hasYesterday) {
    currentStreak = 1;
    expectedTime = refTime - 2 * ONE_DAY;
  } else {
    currentStreak = 0;
  }

  if (currentStreak > 0) {
    // Pindai ke belakang untuk menghitung hari-hari berurutan
    let checkTime = expectedTime;
    while (completedDates.includes(checkTime)) {
      currentStreak++;
      checkTime -= ONE_DAY;
    }
  }

  // 2. Hitung Streak Terbaik (Best Streak)
  const ascDates = [...completedDates].sort((a, b) => a - b);
  let bestStreak = 0;
  let currentRun = 0;
  let lastTime: number | null = null;

  for (const time of ascDates) {
    if (lastTime === null) {
      currentRun = 1;
    } else if (time - lastTime === ONE_DAY) {
      currentRun++;
    } else if (time === lastTime) {
      // Abaikan jika ada tanggal duplikat
    } else {
      if (currentRun > bestStreak) {
        bestStreak = currentRun;
      }
      currentRun = 1;
    }
    lastTime = time;
  }

  if (currentRun > bestStreak) {
    bestStreak = currentRun;
  }

  return { currentStreak, bestStreak };
}

export function calculateCompletionRate(logs: HabitLog[]) {
  if (logs.length === 0) return 0;
  const completedCount = logs.filter((l) => l.completed).length;
  return Math.round((completedCount / logs.length) * 100);
}
