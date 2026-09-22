"use client";

import React, { useState } from "react";
import Link from "next/link";

type Mail = {
  id: string;
  name: string;
  email: string;
  subject: string;
  text: string;
  date: string;
  read: boolean;
  labels: string[];
};

export default function MailClient({ initialMails }: { initialMails: Mail[] }) {
  const [currentFolder, setCurrentFolder] = useState<"inbox" | "draft" | "sent">("inbox");
  const [selectedMailId, setSelectedMailId] = useState(initialMails[0]?.id || "");

  // フォルダごとの振り分け（今回はすべてinbox、またはステータスに応じた振り分け）
  const folderMails = initialMails.filter((mail) => {
    if (currentFolder === "draft") return mail.labels.includes("draft");
    if (currentFolder === "sent") return false; // 必要に応じて送信済みロジックを追加
    return true; // inbox
  });

  const currentMail = folderMails.find((m) => m.id === selectedMailId) || folderMails[0];

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 font-sans antialiased">
      {/* 1. 左サイドバー */}
      <div className="w-64 border-r border-slate-200 bg-white p-4 flex flex-col gap-6 select-none">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-200">
            M
          </div>
          <h2 className="font-bold text-lg tracking-tight text-slate-900">Workspace Mail</h2>
        </div>
        
        <nav className="flex flex-col gap-1">
          {[
            { id: "inbox", label: "受信トレイ（収受）", icon: "📥" },
            { id: "draft", label: "下書き", icon: "📝" },
            { id: "sent", label: "送信済み", icon: "🚀" }
          ].map((folder) => {
            const isActive = currentFolder === folder.id
            return (
              <button
                key={folder.id}
                onClick={() => setCurrentFolder(folder.id as "inbox" | "draft" | "sent")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-blue-50 text-blue-700 shadow-sm" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{folder.icon}</span>
                  <span>{folder.label}</span>
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      {/* 2. 中央：メール一覧 */}
      <div className="w-96 border-r border-slate-200 bg-white flex flex-col shadow-sm z-10">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <h3 className="font-bold text-base text-slate-900 capitalize">{currentFolder}</h3>
          <span className="text-xs text-slate-400 font-medium">{folderMails.length} 件</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/40">
          {folderMails.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">新しい通知・メールはありません</div>
          ) : (
            folderMails.map((mail) => {
              const isSelected = currentMail?.id === mail.id
              return (
                <button
                  key={mail.id}
                  onClick={() => setSelectedMailId(mail.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 shadow-sm flex flex-col gap-1.5 ${
                    isSelected 
                      ? "bg-white border-blue-500 ring-2 ring-blue-100" 
                      : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-semibold text-sm text-slate-900">{mail.name}</span>
                    <span className="text-xs text-slate-400 font-medium">{mail.date}</span>
                  </div>
                  <div className={`text-xs font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                    {mail.subject}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {mail.text}
                  </p>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* 3. 右側：メール本文プレビュー */}
      <div className="flex-1 flex flex-col bg-white">
        {currentMail ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 bg-white">
              <h1 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">
                {currentMail.subject}
              </h1>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-600 border">
                    {currentMail.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{currentMail.name}</div>
                    <div className="text-xs text-slate-400">{currentMail.email}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border">
                  {currentMail.date}
                </div>
              </div>
            </div>
            <div className="flex-1 p-8 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap overflow-y-auto">
              {currentMail.text}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400 text-sm">
            📭 表示するメールがありません
          </div>
        )}
      </div>

      {/* 4. ホームへ戻る */}
      <div className="absolute top-4 right-4">
        <Link href="/" className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium shadow-md hover:bg-blue-700">
          ホームへ戻る
        </Link>
      </div>
    </div>
  );
}