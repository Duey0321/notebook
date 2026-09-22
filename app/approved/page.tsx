// app/approved/page.tsx
import { Navbar } from "@/components/navbar";
import { ProposalApprovalSteps } from "@/components/ProposalApprovalSteps";
import { getMyApprovedProposals } from "@/lib/actions/proposal"; // 💡 関数名を変更
import Link from "next/link";

export default async function ApprovedPage() {
  // 💡 自分が起案した承認済みリストを取得
  const approvedProposals = await getMyApprovedProposals();

  return (
    <div>
      <Navbar />

      <main className="container mx-auto p-6 max-w-4xl space-y-6">
        <div className="flex justify-between items-center border-b pb-2">
          <h1 className="text-2xl font-bold">自分が起案した承認済み一覧</h1>
          <Link href="/recept" className="text-sm text-blue-600 hover:underline">
            ← 受信・閲覧一覧へ戻る
          </Link>
        </div>

        {approvedProposals.length === 0 ? (
          <p className="text-muted-foreground">承認済みの起案はありません。</p>
        ) : (
          <div className="grid gap-4">
            {approvedProposals.map((proposal) => (
              <Link
                key={proposal.id}
                href={`/proposals/${proposal.id}`}
                className="block border rounded-lg p-5 bg-card shadow-sm hover:shadow-md transition-shadow space-y-3"
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-semibold">{proposal.title}</h2>
                  <span className="text-xs px-2.5 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                    {proposal.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">
                  {proposal.content}
                </p>

                <hr />

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <p>
                    期限日: {proposal.dueDate ? new Date(proposal.dueDate).toLocaleDateString() : 'なし'}
                  </p>
                </div>

                <ProposalApprovalSteps steps={proposal.approvalSteps} />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}