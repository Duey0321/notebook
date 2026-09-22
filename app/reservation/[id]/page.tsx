import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth"; // Auth.js のセッション取得
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import CancelButton from "@/components/CancelButton";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// 日時のフォーマット用関数 (例: 2026/06/10 10:00)
function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ReservationDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 1. ログイン認証チェック (Authentication)
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentUserId = session.user.id;
  const currentUserRole = session.user.role; // "ADMIN" | "MEMBER"

  // 2. データベースから予約情報を取得
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      resource: true,
      user: true,
    },
  });

  // 予約データ自体が存在しない場合は 404
  if (!reservation) {
    notFound();
  }

  // 3. 閲覧権限チェック (Authorization)
  // 例: 「管理者」か「予約の作成者本人」しか詳細を見られない仕様の場合
  const isOwner = reservation.userId === currentUserId;
  const isAdmin = currentUserRole === "ADMIN";

  if (!isOwner && !isAdmin) {
    // 💡 ポイント: 権限がない場合、存在すら隠すため 404 にフォールバック
    notFound(); 
  }

  // 4. キャンセル実行権限のフラグ判定
  const canCancel = (isOwner || isAdmin) && reservation.status === "CONFIRMED";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        {/* ヘッダーエリア */}
        <div className="flex justify-between items-center border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-800">予約詳細</h1>
          <Link
            href="/reservation"
            className="text-sm px-3 py-1.5 border rounded bg-white hover:bg-gray-100 transition-colors text-gray-700"
          >
            ← カレンダーに戻る
          </Link>
        </div>

        {/* 詳細カードエリア */}
        <div className="bg-white rounded-lg border shadow-sm p-6 space-y-6">
          {/* 1. タイトル & ステータスヘッダー */}
          <div className="border-b pb-4 flex justify-between items-start gap-4">
            <div>
              <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-semibold inline-block mb-2">
                {reservation.resource.name}
              </span>
              <h2 className="text-xl font-bold text-gray-900">
                {reservation.title}
              </h2>
            </div>

            {/* ステータスバッジ */}
            {reservation.status === "CANCELLED" ? (
              <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full font-bold shrink-0">
                キャンセル済み
              </span>
            ) : (
              <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full font-bold shrink-0">
                予約確定
              </span>
            )}
          </div>

          {/* 2. 予約の基本情報（グリッド表示） */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <dt className="text-gray-500 font-medium mb-1">予約ID</dt>
              <dd className="font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded inline-block text-xs">
                {reservation.id}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium mb-1">予約者名</dt>
              <dd className="font-medium text-gray-800">
                {reservation.user.name ?? "名前未設定"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium mb-1">利用開始日時</dt>
              <dd className="text-gray-800 font-medium">
                {formatDateTime(reservation.startTime)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium mb-1">利用終了日時</dt>
              <dd className="text-gray-800 font-medium">
                {formatDateTime(reservation.endTime)}
              </dd>
            </div>
          </dl>

          {/* 3. リソース詳細情報（会議室の定員や備品の説明など） */}
          {reservation.resource.description && (
            <div className="pt-4 border-t">
              <dt className="text-xs text-gray-500 font-medium mb-1.5">
                対象リソースの案内・注意事項
              </dt>
              <dd className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-100 leading-relaxed">
                {reservation.resource.description}
              </dd>
            </div>
          )}

          {/* 4. キャンセル操作エリア */}
          <div className="pt-4 flex gap-3 justify-end border-t">
            {canCancel && <CancelButton reservationId={reservation.id} />}
          </div>
        </div>
      </main>
    </div>
  );
}