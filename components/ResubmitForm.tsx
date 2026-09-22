'use client';

import { useState } from 'react';
import { resubmitProposal } from '@/lib/actions/proposal';

type Proposal = {
  id: string;
  title: string;
  content: string;
};

type ResubmitFormProps = {
  proposal: Proposal;
};

export default function ResubmitForm({ proposal }: ResubmitFormProps) {
  const [title, setTitle] = useState(proposal.title);
  const [content, setContent] = useState(proposal.content);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!window.confirm('修正した内容で再申請しますか？')) {
      return;
    }

    setIsLoading(true);
    try {
      await resubmitProposal(proposal.id, title, content);
      alert('再申請しました。');
    } catch (error) {
      console.error('再申請に失敗しました:', error);
      alert('再申請に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">内容・本文</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={6}
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-6 py-2 rounded-md shadow transition"
        >
          {isLoading ? '送信中...' : '修正して再申請する'}
        </button>
      </div>
    </form>
  );
}