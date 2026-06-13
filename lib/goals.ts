import prisma from "./prisma";

export async function updateGoalProgress(goalId: string) {
  const milestones = await prisma.goalMilestone.findMany({
    where: { goalId },
  });

  let progress = 0;

  if (milestones.length > 0) {
    const completed = milestones.filter((m) => m.isCompleted).length;
    progress = Math.round((completed / milestones.length) * 100);
  } else {
    // Check if there are associated financial goals
    const finGoals = await prisma.financialGoal.findMany({
      where: { goalId },
    });
    if (finGoals.length > 0) {
      const totalTarget = finGoals.reduce((sum, fg) => sum + fg.targetAmount, 0);
      const totalCurrent = finGoals.reduce((sum, fg) => sum + fg.currentAmount, 0);
      progress = totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0;
    }
  }

  const currentGoal = await prisma.goal.findUnique({
    where: { id: goalId },
    select: { status: true },
  });

  let newStatus = currentGoal?.status || "ACTIVE";
  if (progress === 100) {
    newStatus = "ACHIEVED";
  } else if (progress < 100 && currentGoal?.status === "ACHIEVED") {
    newStatus = "ACTIVE";
  }

  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: { 
      progress,
      status: newStatus,
    },
  });

  return goal;
}
