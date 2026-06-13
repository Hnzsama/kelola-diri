import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get all goals for stats
    const goals = await prisma.goal.findMany({
      where: { userId },
    });

    const activeGoals = goals.filter((g) => (g.status === "ACTIVE" || g.status === "PAUSED") && g.progress < 100);
    const achievedGoals = goals.filter((g) => g.status === "ACHIEVED" || g.progress === 100);

    // Average progress of active goals (or 0 if none)
    const activeCount = activeGoals.length;
    const totalProgress = activeGoals.reduce((sum, g) => sum + g.progress, 0);
    const averageProgress = activeCount > 0 ? Math.round(totalProgress / activeCount) : 0;

    // Deadline this month count
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const deadlineThisMonthCount = activeGoals.filter((g) => {
      if (!g.targetDate) return false;
      const target = new Date(g.targetDate);
      return target >= startOfMonth && target <= endOfMonth;
    }).length;

    // Distribution by category
    const categories = ["ACADEMIC", "ORGANIZATION", "HABIT", "PERSONAL", "CAREER"];
    const distribution = categories.map((cat) => {
      const count = goals.filter((g) => g.category === cat).length;
      return { category: cat, count };
    });

    // Top 3 priority active goals (soonest deadline, or highest progress if no deadline)
    const sortedUpcoming = [...activeGoals]
      .sort((a, b) => {
        if (a.targetDate && b.targetDate) {
          return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
        }
        if (a.targetDate) return -1;
        if (b.targetDate) return 1;
        return b.progress - a.progress; // fallback to higher progress
      })
      .slice(0, 3);

    return NextResponse.json({
      activeCount,
      achievedCount: achievedGoals.length,
      averageProgress,
      deadlineThisMonthCount,
      distribution,
      upcoming: sortedUpcoming,
    });
  } catch (error: any) {
    console.error("[GOALS_STATS_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data statistik goal" },
      { status: 500 }
    );
  }
}
