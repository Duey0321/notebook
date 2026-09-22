"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createThread } from "@/lib/thread";
import { getGroups } from "@/lib/group";
import { Navbar } from "@/components/navbar";

type Group = {
  id: string;
  name: string;
};

export default function DraftPage() {
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isPending, setIsPending] = useState(false);

  // 画面読込時にDBからグループ一覧（課・部署一覧）を取得
  useEffect(() => {
    async function fetchGroups() {
      try {
        const data = await getGroups();
        setGroups(data);
      } catch (error) {
        console.error("グループ一覧の取得に失敗しました", error);
      }
    }
    fetchGroups();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      await createThread({
        groupId,
        title,
        body,
        dueDate: dueDate ? new Date(dueDate) : null,
      });
      alert("起案を送信しました！（グループメンバー全員に共有されました）");

      router.push("/recept");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("送信に失敗しました。");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans antialiased">
      <Navbar />

      <main className="p-8 flex justify-center items-start">
        <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📝</span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                新規起案の作成
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              新しいスレッドを起案し、指定部署のメンバー全員に収受させます。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* 提出先グループの選択 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                提出先（公開部署）
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 shadow-sm"
              >
                <option value="">-- 部署を選択してください --</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 件名入力 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                件名 / タイトル
              </label>
              <input
                type="text"
                placeholder="例: 市民課窓口システム更新に関する稟議"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 shadow-sm"
              />
            </div>

            {/* 本文入力 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                本文
              </label>
              <textarea
                placeholder="起案の詳細内容を入力してください..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={8}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 shadow-sm resize-none leading-relaxed"
              />
            </div>

            {/* ボタン */}
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-md shadow-blue-100 transition-all"
              >
                {isPending ? "送信中..." : "🚀 起案を送信する"}
              </button>
              <div className="flex flex-col gap-1.5">
  <label className="text-xs font-semibold text-slate-700">
    期限日（任意）
  </label>
  <input
    type="date"
    value={dueDate}
    onChange={(e) => setDueDate(e.target.value)}
    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 shadow-sm"
  />
</div>
            </div>

            {/* 起案作成フォーム内 */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    添付ファイル（PDF・画像など）
  </label>
  <input
    type="file"
    name="file"
    accept="image/*,application/pdf" // 画像やPDFのみに制限する場合
    className="w-full text-sm text-slate-500
      file:mr-4 file:py-2 file:px-4
      file:rounded-md file:border-0
      file:text-sm file:font-semibold
      file:bg-blue-50 file:text-blue-700
      hover:file:bg-blue-100"
  />
</div>
          </form>
          
        </div>
      </main>
    </div>
  );
}