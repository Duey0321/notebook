'use client';

import { useState } from 'react';
import { rejectProposal } from '@/lib/actions/proposal';

type RejectButtonProps = {
  proposalId: string;
};

export default function RejectButton({ proposalId }: RejectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [comment, setComment] = useState(''); // 💡 コメント用のState

  const handleReject = async () => {
    if (!comment.trim()) {
      alert('差し戻しの理由を入力してください。');
      return;
    }

    if (!window.confirm('本当にこの起案を差し戻しますか？')) {
      return;
    }

    setIsLoading(true);
    try {
      await rejectProposal(proposalId, comment); // 💡 コメントを送信
    } catch (error) {
      console.error('差し戻し処理に失敗しました:', error);
      alert('差し戻し処理に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* 💡 テキストエリアの設置 */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="差し戻しの理由（コメント）を入力..."
        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        rows={3}
      />
      <button
        type="button"
        onClick={handleReject}
        disabled={isLoading}
        className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold px-6 py-2 rounded-md shadow transition w-full"
      >
        {isLoading ? '処理中...' : 'この内容で差し戻す'}
      </button>
    </div>
  );
}