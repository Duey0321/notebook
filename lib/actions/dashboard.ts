import { getUserIdFromSession } from "../auth";
import prisma from "../prisma";

// イメージ
export async function getDashboardData() {
  const userId = await getUserIdFromSession();
  if (!userId) throw new Error("認証されていません");

  // 例：今日の日付の初めと終わりを取得
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // ① 今日が期限の起案
  const dueTodayProposals = await prisma.proposal.findMany({
    where: {
      dueDate: {
        gte: todayStart,
        lte: todayEnd,
      },
      // 必要に応じて自分が関わるものや、提出済みステータスなどに絞る
    },
  });

  // ② 自分に承認待ちがある起案（ApprovalStepで自分がPENDINGのもの）
  const pendingSteps = await prisma.approvalStep.findMany({
    where: {
      userId: userId,
      status: 'PENDING',
    },
    include: {
      proposal: {
        include: { author: true },
      },
    },
  });

  return {
    dueTodayCount: dueTodayProposals.length,
    dueTodayProposals,
    pendingSteps,
  };
}