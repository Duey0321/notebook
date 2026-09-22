'use server';

import { getUserIdFromSession } from '@/lib/auth';
import prisma from '../prisma';
import { sendProposalNotification } from '../mail';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { uploadFileToSupabase } from '../supabase-storage';


interface ReserveInput {
  resourceId: string;
  title: string;
  startTime: Date;
  endTime: Date;
}
/**
 * ログインユーザーが閲覧権限を持つ起案一覧を取得する
 */
export async function getMyProposals() {
  const userId = await getUserIdFromSession();

  if (!userId) {
    throw new Error('認証が必要です');
  }

  // 自分が「起案者(authorId)」または「収受者(receiptsに存在)」のデータだけを絞り込んで取得
  const proposals = await prisma.proposal.findMany({
    where: {
      OR: [
        { authorId: userId }, // 自分が作成したもの
        {
          receipts: {
            some: {
              userId: userId, // 収受者（宛先）に自分が含まれているもの
            },
          },
        },
      ],
    },
    include: {
      author: {
        select: { name: true, email: true },
      },
      receipts: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      // 💡 ここを追加！承認表で誰が承認したかを表示するために必要です
      approvalSteps: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: {
          order: 'desc' // 必要に応じて並び順を調整
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return proposals;
}

// 💡 差し戻し処理
export async function rejectProposal(proposalId: string, comment?: string) {
  const userId = await getUserIdFromSession();
  if (!userId) throw new Error('認証されていません。');

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { author: true },
  });

  if (!proposal) throw new Error('起案が見つかりません。');

  // 1. 該当ユーザーのステップを REJECTED に更新し、コメントを保存
  await prisma.approvalStep.updateMany({
    where: { proposalId, userId, status: 'PENDING' },
    data: { 
      status: 'REJECTED',
      comment: comment || '差し戻されました',
    },
  });

  // 2. 起案自体のステータスを REJECTED に更新
  await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: 'REJECTED' },
  });

  // 3. 起案者に差し戻しメールを送信
  if (proposal.author.email) {
    await sendProposalNotification({
      to: [proposal.author.email],
      proposalTitle: `【差し戻し】${proposal.title}`,
      authorName: '決裁システム',
      proposalId: proposal.id,
    });
  }

  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath('/recept');

  return { success: true };
}

export async function approveProposal(proposalId: string, comment?: string) {
  const userId = await getUserIdFromSession();
  if (!userId) throw new Error('認証されていません。');

  // 1. 対象の起案と、それに紐づく承認ステップを「順番（並び順）」が分かるように取得
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      approvalSteps: {
        orderBy: { updatedAt: 'asc' }, // 登録順や更新順など、順番の基準
      },
      author: true,
    },
  });

  if (!proposal) throw new Error('起案が見つかりません。');

  // 💡 【追加】順番の制御チェック（前の人がまだ承認していなかったらエラーにする）
  const myStepIndex = proposal.approvalSteps.findIndex(
    (step) => step.userId === userId && step.status === 'PENDING'
  );

  if (myStepIndex === -1) {
    throw new Error('承認可能なステップが見つからないか、既に処理されています。');
  }

  // 自分より前（indexが小さい）のステップの中に、まだ 'PENDING'（未承認）の人がいないかチェック
  for (let i = 0; i < myStepIndex; i++) {
    if (proposal.approvalSteps[i].status === 'PENDING') {
      throw new Error('前の承認者の処理が完了するまで承認できません。');
    }
  }
  // --------------------------------------------------

  // 2. ログインユーザーが担当している「未対応（PENDING）」のステップを承認済みに更新
  const updateResult = await prisma.approvalStep.updateMany({
    where: {
      proposalId: proposalId,
      userId: userId,
      status: 'PENDING',
    },
    data: {
      status: 'APPROVED',
      comment: comment || null,
    },
  });

  if (updateResult.count === 0) {
    throw new Error('承認に失敗しました。');
  }

  // 3. 最新の承認状態を再取得して全員分チェック
  const currentSteps = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { approvalSteps: true },
  });

  const allApproved = currentSteps?.approvalSteps.every(
    (step) => step.status === 'APPROVED'
  );

  // 4. 全員承認されていた場合、起案全体を APPROVED に更新
  if (allApproved) {
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'APPROVED' },
    });

    if (proposal.author.email) {
      await sendProposalNotification({
        to: [proposal.author.email],
        proposalTitle: `【承認完了】${proposal.title}`,
        authorName: '決裁システム',
        proposalId: proposal.id,
      });
    }
  }

  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath('/recept');
  redirect('/calendar/group'); // もしくは '/recept'

  return { success: true, allApproved };
}

// 💡 引数で title と content の両方を受け取るように変更する
export async function resubmitProposal(proposalId: string, title: string, content: string) {
  const userId = await getUserIdFromSession();
  if (!userId) throw new Error('認証されていません。');

  const proposal = await prisma.proposal.findUnique({
  where: { id: proposalId },
  include: {
    author: true,
    approvalSteps: {
      include: {
        user: { select: { name: true, email: true } },
      },
      // 💡 複数の条件で順番を完全に固定する（例: order昇順 → rank昇順）
      orderBy: [
        { order: 'asc' },
        // { createdAt: 'asc' }, // 同率時の保険として作成日を入れるのも有効です
      ],
    },
  },
});

  if (!proposal) throw new Error('起案が見つかりません。');
  if (proposal.authorId !== userId) throw new Error('この起案の作成者ではありません。'); 
  if (proposal.status !== 'REJECTED') throw new Error('この起案は差し戻されていません。再申請できません。');

  await prisma.$transaction([
    prisma.proposal.update({
      where: { id: proposalId },
      data: {
        title,   // 💡 引数の title が使われるようになります
        content, // 💡 引数の content が使われるようになります
        status: 'SUBMITTED',
      },
    }),
    prisma.approvalStep.updateMany({
      where: { proposalId: proposalId }, 
      data: { 
        status: 'PENDING',
        comment: null,
      }
    })
  ]);

  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath('/recept');

  return { success: true };
}

export async function getMyApprovedProposals() {
  const userId = await getUserIdFromSession();
  if (!userId) throw new Error("認証されていません");

  return await prisma.proposal.findMany({
    where: {
      status: 'APPROVED',
      authorId: userId, // 💡 ここを追加！「自分が起案したもの」に絞り込む
    },
    include: {
      author: true,
      receipts: {
        include: { user: true },
      },
      approvalSteps: {
        include: { user: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function WithFile(formData: FormData) {
  const userId = await getUserIdFromSession();
  if (!userId) throw new Error('認証されていません。');

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const dueDataStr = formData.get('dueDate') as string;
  const file = formData.get('file') as File | null;

  let fileUrl: string | null = null;

  // ファイルがあればアップロードしてURLを取得
  if (file && file.size > 0) {
    fileUrl = await uploadFileToSupabase(file);
  }

  // 💡 ファイルの有無に関わらず、必ず起案を作成する
  await prisma.proposal.create({
    data: {
      title,
      content,
      dueDate: dueDataStr ? new Date(dueDataStr) : null,
      fileUrl, // null の場合はそのままデータベースに保存されます
      authorId: userId,
    },
  });

  revalidatePath('/draft');
}

export async function reserveResource(input: ReserveInput) {
  // 1. 認証チェック
  const userId = await getUserIdFromSession();
  if (!userId) {
    return { success: false, error: 'ログインが必要です。' };
  }

  const { resourceId, title, startTime, endTime } = input;

  // 2. 入力値バリデーション（開始時刻が終了時刻より前か）
  if (startTime >= endTime) {
    return { success: false, error: '終了時刻は開始時刻より後に設定してください。' };
  }

  try {
    // 3. データベースのトランザクション実行（分離レベルを高めて二重予約を完全ブロック）
    const reservation = await prisma.$transaction(async (tx) => {

      // 【重要】重複予約のチェックロジック
      // 指定された時間帯（startTime 〜 endTime）と「一部でも重なっている」予約を探す
      // 条件: (既存の開始 < 入力終了) AND (既存の終了 > 入力開始) AND (ステータスが CONFIRMED)
      const existingReservation = await tx.reservation.findFirst({
        where: {
          resourceId: resourceId,
          status: 'CONFIRMED',
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } },
          ],
        },
      });

      // すでに予約が存在する場合はエラーを投げてトランザクションを即座にロールバック（中断）
      if (existingReservation) {
        throw new Error('指定された時間帯はすでに他の予約が入っています。');
      }

      // 重複がなければ予約を作成
      const newReservation = await tx.reservation.create({
        data: {
          title,
          startTime,
          endTime,
          resourceId,
          userId,
          status: 'CONFIRMED',
        },
      });

      return newReservation;
    });

    // 4. キャッシュの更新（画面の再描画）
    revalidatePath('/reservations');

    return { success: true, data: reservation };

  } catch (error: unknown) {
    console.error("ERROR:", error);
    // 意図的な重複エラーメッセージをクライアントに返す
    return {
      success: false,
      error: (error as Error).message || '予約処理中にエラーが発生しました。',
    };
  }
}