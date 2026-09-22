'use client';

import { useState } from 'react';
import { approveProposal } from '@/lib/actions/proposal';

type Props = {
  proposalId: string;
};

export default function ApproveButton({ proposalId }: Props) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await approveProposal(proposalId);
      // 成功時はサーバーアクション内で revalidatePath が走るため画面が更新されます
    } catch (error: unknown) {
      // 💡 順番待ちエラーなどのメッセージをキャッチして画面に表示！
      setErrorMessage(error instanceof Error ? error.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end w-full">
      <button
        onClick={handleApprove}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-2 rounded-md shadow transition"
      >
        {isLoading ? '処理中...' : 'この内容で承認する'}
      </button>

      {/* 💡 エラーメッセージの赤字表示 */}
      {errorMessage && (
        <p className="text-red-600 text-sm font-medium mt-2">
          ⚠️ {errorMessage}
        </p>
      )}
    </div>
  );
}