// app/reservation/actions.ts
'use server'

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { prisma } from '@/lib/prisma'

export interface CreateReservationInput {
  resourceId: string
  userId: string
  title: string
  startTime: string
  endTime: string
}

export type CancelReservationState = {
  success: boolean;
  message: string;
};

export async function createReservation(input: CreateReservationInput) {
  try {
    const start = new Date(input.startTime);
    const end = new Date(input.endTime);

    if (start >= end) {
      return { success: false, error: "終了日時は開始日時より後に設定してください。" };
    }

    // $transaction で重複チェックと作成を一元管理
    const newReservation = await prisma.$transaction(async (tx) => {
      // 既存の重複予約がないか確認
      const existing = await tx.reservation.findFirst({
        where: {
          resourceId: input.resourceId,
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } },
          ],
        },
      });

      if (existing) {
        throw new Error("指定された時間帯は既に予約されています。");
      }

      // 重複がなければ作成
      return await tx.reservation.create({
        data: {
          resourceId: input.resourceId,
          userId: input.userId,
          title: input.title,
          startTime: start,
          endTime: end,
        },
      });
    });

    return { success: true, data: newReservation };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "予約処理に失敗しました。";
    return { success: false, error: errorMessage };
  }
}


export async function cancelReservation(
  reservationId: string
): Promise<CancelReservationState> {
  try {
    // 1. 認証チェック (Authentication)
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: "認証エラー: ログインが必要です。",
      };
    }

    const currentUserId = session.user.id;
    // 型拡張で role を追加している場合は参照、未定義の場合は安全に文字列比較
    const currentUserRole = (session.user as { role?: string }).role;

    // 2. キャンセル対象の予約データを DB から取得
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    if (!reservation) {
      return {
        success: false,
        message: "指定された予約が見つかりません。",
      };
    }

    // 既にキャンセル済みの場合は重複処理を防ぐ
    if (reservation.status === "CANCELLED") {
      return {
        success: false,
        message: "この予約は既にキャンセルされています。",
      };
    }

    // 3. 認可チェック (Authorization)
    // 予約作成者本人、または管理者 (ADMIN) のみキャンセルを許可
    const isOwner = reservation.userId === currentUserId;
    const isAdmin = currentUserRole === "ADMIN";

    if (!isOwner && !isAdmin) {
      return {
        success: false,
        message: "権限エラー: この予約をキャンセルする権限がありません。",
      };
    }

    // 4. 予約ステータスを CANCELLED に更新
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: "CANCELLED" },
    });

    // 5. キャッシュの再検証 (画面表示の自動更新)
    revalidatePath(`/reservation/${reservationId}`);
    revalidatePath("/reservation");

    return {
      success: true,
      message: "予約を正常にキャンセルしました。",
    };
  } catch (error) {
    console.error("Failed to cancel reservation:", error);
    return {
      success: false,
      message: "データベースの処理中にエラーが発生しました。",
    };
  }
}