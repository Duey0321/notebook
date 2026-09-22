import { notFound } from "next/navigation";
import Link from "next/link"; // 💡 リンク用に追加
import prisma from "@/lib/prisma";
import { getUserIdFromSession } from "@/lib/auth";
import { approveProposal } from "@/lib/actions/proposal";
import { Navbar } from "@/components/navbar"; // 💡 ログアウト等があるNavbarをインポート
import ApproveButton from "@/components/AprroveButton";
import RejectButton from "@/components/RejectButton";
import ResubmitForm from "@/components/ResubmitForm";

type PageProps = {
  params: {
    id: string;
  };
};

export default async function ProposalDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const proposalId = resolvedParams.id;
  const currentUserId = await getUserIdFromSession();

  // 1. 対象の起案データと、起案者情報、承認ステップを取得
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      author: true,
      approvalSteps: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!proposal) {
    notFound();
  }

  const isAuthor = proposal.authorId === currentUserId;
  const isRejected = proposal.status === "REJECTED";

  if (isAuthor && isRejected) {
    return (
      <div>
        <Navbar />
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div>
            <Link
              href="/recept"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition"
            >
              ← 一覧に戻る
            </Link>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h1 className="text-xl font-bold text-red-700">
              この起案は差し戻されました
            </h1>
            <p className="text-sm text-red-600 mt-1">
              内容を修正して再度申請してください。
            </p>
          </div>

          {/* 💡 先ほど作った再申請用のフォームコンポーネントを配置 */}
          <ResubmitForm proposal={proposal} />
        </div>
      </div>
    );
  }

  const myPendingStep = proposal.approvalSteps.find(
    (step) => step.userId === currentUserId && step.status === "PENDING",
  );
  // myPendingStep の判定は、ユーザーがその詳細ページを開いた（ページがサーバー側でレンダリングされた）まさにその瞬間のデータベースの状態を見て決定されます。

  const myRejectStep = proposal.approvalSteps.find(
    (step) => step.userId === currentUserId && step.status === "REJECTED",
  );

  const myApprovedStep = proposal.approvalSteps.find(
    (step) => step.userId === currentUserId && step.status === "APPROVED",
  );

  return (
    <div>
      {/* 💡 画面最上部に共通のナビゲーション（ログアウトボタン等）を配置 */}
      <Navbar />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* 💡 戻るボタン */}
        <div>
          <Link
            href="/recept" // 一覧画面のパスに合わせて変更してください
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition"
          >
            ← 一覧に戻る
          </Link>
        </div>

        {/* 画面タイトル */}
        <div className="flex justify-between items-center border-b pb-4">
          <h1 className="text-2xl font-bold">起案詳細</h1>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              proposal.status === "APPROVED"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            ステータス: {proposal.status}
          </span>
        </div>

        {/* 起案の基本情報 */}
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {proposal.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              起案者: {proposal.author.name || proposal.author.email}
            </p>
          </div>
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              内容・本文
            </h3>
            <p className="text-gray-800 whitespace-pre-wrap">
              {proposal.content}
            </p>
          </div>
        </div>
        {proposal.fileUrl && (
          <div className="mt-4 p-4 border rounded-lg bg-slate-50 space-y-2">
            <p className="text-sm font-semibold text-slate-700">
              📎 添付ファイル
            </p>
            <a
              href={proposal.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              📄 添付ファイルを開く / ダウンロード
            </a>
          </div>
        )}

        {/* 承認フロー（人事課メンバーのステータス一覧） */}
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-800 border-b pb-2">
            承認状況
          </h3>
          <div className="space-y-3">
            {proposal.approvalSteps.map((step) => (
              <div
                key={step.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {step.user?.name || step.user?.email || "担当者"}
                  </p>
                  {step.comment && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      コメント: {step.comment}
                    </p>
                  )}
                </div>
                <div>
                  {step.status === "APPROVED" ? (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                      承認済み
                    </span>
                  ) : step.status === "REJECTED" ? (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                      差し戻し
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full">
                      未承認 (待機中)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 自分が承認できる立場の場合のアクションエリア */}
          {/* 💡 自分の状態に応じた表示の切り替え */}
          {/* {myPendingStep && (
            <div className="mt-6 pt-4 border-t flex justify-end">
              <form
                action={async () => {
                  'use server';
                  await approveProposal(proposalId);
                }}
              >
                <button
                
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md shadow transition"
                >
                  この内容で承認する
                </button>
              </form>
            </div>
          )} */}

          {/* 💡 すでに自分が承認済みの場合のメッセージ表示 */}
          {myPendingStep && (
            <div className="mt-6 pt-4 border-t flex justify-end space-x-4">
              {/* 💡 差し戻しボタンをここに置く */}
              <RejectButton proposalId={proposalId} />

              {/* 承認ボタン */}
              <ApproveButton proposalId={proposalId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
