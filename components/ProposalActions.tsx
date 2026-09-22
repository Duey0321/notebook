'use client';

import { useState, useTransition } from 'react';
import { getMyProposals, rejectProposal } from '@/lib/actions/proposal';
import { useRouter } from 'next/navigation';

export function ProposalActions({ proposalId }: { proposalId: string }) {
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState('');
  const router = useRouter();

  const handleApprove = () => {
    startTransition(async () => {
      try {
        await getMyProposals();
        router.refresh(); // 画面を更新して最新の状態を反映
      } catch (error: unknown) {
        alert((error as Error).message || '承認に失敗しました');
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      try {
        await rejectProposal(proposalId, comment);
        router.refresh();
      } catch (error: unknown) {
        alert((error as Error).message || '差し戻しに失敗しました');
      }
    });
  };

  return (
    <div className="space-y-3 pt-2 border-t">
      <textarea
        placeholder="差し戻し・承認コメント（任意）"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full text-sm p-2 border rounded-md bg-background"
        rows={2}
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={handleReject}
          disabled={isPending}
          className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50"
        >
          {isPending ? '処理中...' : '差し戻し'}
        </button>
        <button
          onClick={handleApprove}
          disabled={isPending}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? '処理中...' : '承認する'}
        </button>
      </div>
    </div>
  );
}