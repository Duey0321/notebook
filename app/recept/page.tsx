import { Navbar } from "@/components/navbar";
import { ProposalActions } from "@/components/ProposalActions";
import { ProposalApprovalSteps } from "@/components/ProposalApprovalSteps";
import { getMyProposals } from "@/lib/actions/proposal";
import Link from "next/link";

export default async function ReceptPage() {
  const proposals = await getMyProposals();

  return (
    <div>
      {/* 画面上部にナビゲーションとログアウトを表示 */}
      <Navbar />

      <main className="container mx-auto p-6 max-w-4xl space-y-6">
        <div className="flex justify-between items-center border-b pb-2">
          <h1 className="text-2xl font-bold">受信・閲覧可能一覧</h1>
        </div>

        {proposals.length === 0 ? (
          <p className="text-muted-foreground">閲覧できる起案はありません。</p>
        ) : (
          <div className="grid gap-4">
            {proposals.map((proposal) => (
              <Link
                key={proposal.id}
                href={`/proposals/${proposal.id}`}
                className="block border rounded-lg p-5 bg-card shadow-sm hover:shadow-md transition-shadow space-y-3"
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-semibold">{proposal.title}</h2>
                  <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                    {proposal.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">
                  {proposal.content}
                </p>

                {/* 💡 添付ファイルが存在する場合の表示 */}
                {proposal.fileUrl && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50/50 p-2 rounded border border-blue-100 w-fit">
                    <span>📎 添付ファイルあり</span>
                  </div>
                )}

                <hr />

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <p>
                    起案者:{" "}
                    <span className="font-medium">
                      {proposal.author.name || proposal.author.email}
                    </span>
                  </p>
                  <p>
                    共有宛先:{" "}
                    {proposal.receipts
                      .map((r) => r.user.name || r.user.email)
                      .join(", ")}
                  </p>
                </div>

                <ProposalApprovalSteps steps={proposal.approvalSteps} />

                {proposal.status === 'SUBMITTED' && (
                  <ProposalActions proposalId={proposal.id} />
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}