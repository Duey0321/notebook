import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import Link from "next/link";

// 今日の開始時刻と終了時刻を計算（JST考慮）
function getTodayRange() {
  const now = new Date();
  // UTC環境でもJST(UTC+9)の今日を取得するための補正
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  const start = new Date(jstNow);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(jstNow);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
}

// ダッシュボード用のデータ取得関数（ホーム画面用）
async function getDashboardData(userId: string) {
  const { start: todayStart, end: todayEnd } = getTodayRange();

  try {
    // Promise.all を使用して2つのクエリを並列実行（パフォーマンス改善）
    const [dueTodayProposals, pendingSteps] = await Promise.all([
      // ① 今日が期限の起案
      prisma.proposal.findMany({
        where: {
          dueDate: {
            gte: todayStart,
            lte: todayEnd,
          },
          status: { not: "APPROVED" },
        },
        include: {
          author: true,
        },
      }),

      // ② 自分に承認待ち（PENDING）が回ってきている起案
      prisma.approvalStep.findMany({
        where: {
          userId: userId,
          status: "PENDING",
        },
        include: {
          proposal: {
            include: {
              author: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      dueTodayProposals: dueTodayProposals ?? [],
      pendingSteps: pendingSteps ?? [],
    };
  } catch (error) {
    // 本番環境ログ出力（Sentry等への送信箇所）
    console.error("Dashboard Data Fetch Error:", error);

    // データベース接続失敗時等にクラッシュさせず空配列で返すフォールバック処理
    return {
      dueTodayProposals: [],
      pendingSteps: [],
    };
  }
}

export default async function Home() {
  // 1. セッションを取得
  const session = await auth();

  // 2. 未ログインおよび ID 不足のバリデーション
  if (!session?.user?.id) {
    redirect("/login");
  }

  // 3. ログイン中のユーザーIDを使ってダッシュボードデータを取得
  const { dueTodayProposals, pendingSteps } = await getDashboardData(
    session.user.id
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <Navbar />

      <main className="container mx-auto p-6 max-w-4xl space-y-6">
        {/* 挨拶・ヘッダー */}
        <div className="border-b pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              ダッシュボード
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              ようこそ、{session.user.name || session.user.email || "ユーザー"} さん。本日の状況を確認しましょう。
            </p>
          </div>
        </div>

        {/* サマリーカード領域 */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* 今日が期限のカード */}
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <span className="text-lg">⏳</span> 今日が期限の起案
              </span>
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                  dueTodayProposals.length > 0
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {dueTodayProposals.length} 件
              </span>
            </div>

            {dueTodayProposals.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                本日が期限の案件はありません。
              </p>
            ) : (
              <ul className="space-y-2 mt-2">
                {dueTodayProposals.map((proposal) => (
                  <li
                    key={proposal.id}
                    className="text-sm border-b pb-2 last:border-none"
                  >
                    <Link
                      href={`/proposals/${proposal.id}`}
                      className="font-medium text-blue-600 hover:underline block truncate"
                    >
                      {proposal.title}
                    </Link>
                    <span className="text-xs text-slate-400">
                      起案者: {proposal.author?.name || proposal.author?.email || "不明"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 自分の承認待ちカード */}
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <span className="text-lg">✍️</span> 承認待ちの起案
              </span>
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                  pendingSteps.length > 0
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {pendingSteps.length} 件
              </span>
            </div>

            {pendingSteps.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                現在、対応待ちの案件はありません。
              </p>
            ) : (
              <ul className="space-y-2 mt-2">
                {pendingSteps.map((step) => (
                  <li
                    key={step.id}
                    className="text-sm border-b pb-2 last:border-none"
                  >
                    <Link
                      href={`/proposals/${step.proposal.id}`}
                      className="font-medium text-blue-600 hover:underline block truncate"
                    >
                      {step.proposal.title}
                    </Link>
                    <span className="text-xs text-slate-400">
                      起案者: {step.proposal.author?.name || step.proposal.author?.email || "不明"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* クイックメニュー */}
        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">
            クイックメニュー
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/draft"
              className="p-3 bg-slate-50 hover:bg-slate-100 border rounded-lg text-center text-xs font-medium text-slate-700 transition"
            >
              📝 新規起案を作成
            </Link>
            <Link
              href="/recept"
              className="p-3 bg-slate-50 hover:bg-slate-100 border rounded-lg text-center text-xs font-medium text-slate-700 transition"
            >
              📥 受信・閲覧一覧
            </Link>
            <Link
              href="/calendar/group"
              className="p-3 bg-slate-50 hover:bg-slate-100 border rounded-lg text-center text-xs font-medium text-slate-700 transition"
            >
              📅 課のスケジュール
            </Link>
            <Link
              href="/approved"
              className="p-3 bg-slate-50 hover:bg-slate-100 border rounded-lg text-center text-xs font-medium text-slate-700 transition"
            >
              ⭐️ 承認済一覧
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}