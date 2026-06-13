import { NextResponse } from "next/server";
import {
  runDailyAcademicDeadlines,
  runDailyHabitsReminder,
  runDailyFinanceSummary,
  runWeeklyLifeReview,
  runMonthlyReport,
  runGoalStagnationCheck,
  sendTestDemoEmail,
} from "@/lib/notification-engine";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const secret = searchParams.get("secret");
  const userId = searchParams.get("userId"); // for manual trigger test

  const cronSecret = process.env.CRON_SECRET || "DEV_TOKEN";
  if (secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!type) {
    return NextResponse.json({ error: "Missing 'type' parameter" }, { status: 400 });
  }

  try {
    switch (type) {
      case "academic-deadline":
        await runDailyAcademicDeadlines();
        return NextResponse.json({ success: "Daily academic deadlines processed successfully." });
      case "habit-reminder":
        await runDailyHabitsReminder();
        return NextResponse.json({ success: "Daily habit reminders processed successfully." });
      case "daily-finance":
        await runDailyFinanceSummary();
        return NextResponse.json({ success: "Daily finance summary processed successfully." });
      case "weekly-review":
        await runWeeklyLifeReview();
        return NextResponse.json({ success: "Weekly life review processed successfully." });
      case "monthly-report":
        await runMonthlyReport();
        return NextResponse.json({ success: "Monthly report processed successfully." });
      case "goal-stagnant":
        await runGoalStagnationCheck();
        return NextResponse.json({ success: "Goal stagnation check processed successfully." });
      case "test-email":
        if (!userId) {
          return NextResponse.json({ error: "Missing 'userId' parameter for test email" }, { status: 400 });
        }
        await sendTestDemoEmail(userId);
        return NextResponse.json({ success: "Test demo email sent successfully." });
      default:
        return NextResponse.json({ error: `Unknown type '${type}'` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Cron Notifications Error:", error);
    return NextResponse.json({ error: "Internal server error", details: error?.message }, { status: 500 });
  }
}
