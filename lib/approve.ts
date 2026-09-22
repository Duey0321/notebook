'use server';

import { getUserIdFromSession } from '@/lib/auth';
import prisma from './prisma';
import { sendProposalNotification } from '@/lib/mail'; // 既存の通知関数

export async function approveProposal(proposalId: string) {
  const userId = await getUserIdFromSession();
  if (!userId) throw new Error('認証されていません。');

  // 1. 対象の起案データと承認ステップ、起案者情報を取得
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      author: true,       // 起案者（最終的に通知を送る相手）
      approvalSteps: true, // 現在の決裁ルート
    },
  });

  if (!proposal) throw new Error('起案が見つかりません。');

  // 2. ログインユーザーが現在の承認権限を持っているかチェック
  // （例：自分の順番のステップを APPROVED に更新する処理）
  
  // --- 簡易的な承認更新のトランザクション ---
  await prisma.approvalStep.updateMany({
    where: { proposalId, userId, status: 'PENDING' },
    data: { status: 'APPROVED' },
  });

  // 3. すべての承認ステップが完了したか（＝最終決裁者が承認したか）をチェック
  const remainingSteps = await prisma.approvalStep.count({
    where: { proposalId, status: 'PENDING' },
  });

  // すべてのステップが消化された場合、起案ステータスを APPROVED に更新
  if (remainingSteps === 0) {
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'APPROVED' },
    });

    // 🚀 【最終決裁完了】起案者にメール通知を送信！
    if (proposal.author.email) {
      await sendProposalNotification({
        to: [proposal.author.email],
        proposalTitle: `【承認完了】${proposal.title}`,
        authorName: '決裁システム',
        proposalId: proposal.id,
      });
    }
  }

  return { success: true };
}