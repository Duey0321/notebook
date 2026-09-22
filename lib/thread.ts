'use server';

import { getUserIdFromSession } from '@/lib/auth';
import prisma from './prisma';
import { sendProposalNotification } from '@/lib/mail';

type CreateThreadParams = {
  groupId: string;
  title: string;
  body: string;
  dueDate?: Date | null; // 💡 これを追加！
};

export async function createThread(formData: CreateThreadParams) {
  const userId = await getUserIdFromSession();
  const { groupId, title, body, dueDate } = formData;

  if (!userId || !groupId || !title || !body) {
    throw new Error('すべての項目を入力してください。');
  }

  // 1. 選択されたグループに所属しているメンバーの userId と email を取得
  const members = await prisma.groupMember.findMany({
    where: { groupId: groupId },
    select: {
      userId: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (members.length === 0) {
    throw new Error('選択されたグループに所属するメンバーがいません。');
  }

  // 2. 起案を作成し、Receipt と ApprovalStep を一括生成！
  const data = await prisma.proposal.create({
    data: {
      groupId: groupId,
      title: title,
      content: body,
      authorId: userId,
      status: 'SUBMITTED',
      dueDate: dueDate,
      
      // 💡 receipts と approvalSteps はすべて `data` の中に入れます
      receipts: {
        create: members.map((m) => ({
          userId: m.userId,
        })),
      },
      approvalSteps: {
        create: members.map((m) => ({
          userId: m.userId,
          role: '承認者',
          status: 'PENDING',
        })),
      },
    },
    // 💡 include は `data` の外（create の直下）に置きます
    include: {
      author: true,
      approvalSteps: {
        include: {
          user: true,
        },
      },
    },
  });

  // 3. グループメンバー全員にメール通知を送信
  const memberEmails = members
    .map((m) => m.user?.email)
    .filter((email): email is string => email !== null && email !== undefined);

  if (memberEmails.length > 0) {
    await sendProposalNotification({
      to: memberEmails,
      proposalTitle: data.title,
      authorName: data.author.name || data.author.email || '起案者',
      proposalId: data.id,
    });
  }

  return data;
}