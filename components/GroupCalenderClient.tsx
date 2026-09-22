'use client';

import { useState, useEffect, useTransition } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { createEvent, deleteEvent, editEvent } from '@/lib/actions/event';
import Link from 'next/link';

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  user: { name: string | null };
};

type ProposalItem = {
  id: string;
  title: string;
  dueDate: Date | null;
  author: { name: string | null };
};

type Props = {
  groupName: string;
  events: EventItem[];
  proposals: ProposalItem[];
};

export default function GroupCalendarClient({ groupName, events, proposals }: Props) {
  console.log("受け取ったイベント一覧:", events);
  const [isMounted, setIsMounted] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // モーダルの開閉状態とフォーム入力値
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPending, startTransition] = useTransition();
  
  // 開始日と終了日の状態
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // 💡 編集中のイベントIDを保持するステート（nullなら新規作成、IDが入っていれば編集モード）
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="p-8 text-center text-sm text-muted-foreground">カレンダーを読み込み中...</div>;
  }

  const selectedDateString = date ? date.toDateString() : '';

  // 選択された日付に合致する予定のフィルタリング（期間対応）
  const filteredEvents = events.filter((event) => {
    if (!date) return false;

    const selectedYear = date.getFullYear();
    const selectedMonth = String(date.getMonth() + 1).padStart(2, '0');
    const selectedDay = String(date.getDate()).padStart(2, '0');
    const selectedYMD = `${selectedYear}-${selectedMonth}-${selectedDay}`;

    const startD = new Date(event.startDate);
    const startYMD = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`;

    const endD = new Date(event.endDate);
    const endYMD = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`;

    return selectedYMD >= startYMD && selectedYMD <= endYMD;
  });

  const filteredProposals = proposals.filter((proposal) => {
    if (!proposal.dueDate) return false;
    return new Date(proposal.dueDate).toDateString() === selectedDateString;
  });

  // 💡 CSVエクスポート用の関数
const handleExportCSV = () => {
  // CSVのヘッダー行
  const headers = ['タイトル', '説明', '開始日', '終了日', '担当者'];
  
  // イベントデータをCSV形式の文字列に変換
  const rows = events.map(event => [
    `"${event.title.replace(/"/g, '""')}"`, // 文字列内のダブルクォートをエスケープ
    `"${(event.description || '').replace(/"/g, '""')}"`,
    new Date(event.startDate).toLocaleDateString(),
    new Date(event.endDate).toLocaleDateString(),
    `"${event.user.name || '不明'}"`
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  // 日本語文字化け対策（BOM付き）
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // ダウンロードリンクを生成してクリックさせる
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'schedule_export.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  // 💡 新規作成用モーダルを開くときの処理
  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setTitle('');
    setDescription('');
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const ymd = `${year}-${month}-${day}`;
      
      setStartDate(ymd);
      setEndDate(ymd);
    }
    setIsModalOpen(true);
  };

  // 💡 編集用モーダルを開くときの処理
  const handleOpenEditModal = (event: EventItem) => {
    setEditingEventId(event.id);
    setTitle(event.title);
    setDescription(event.description || '');
    
    const startD = new Date(event.startDate);
    setStartDate(`${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`);

    const endD = new Date(event.endDate);
    setEndDate(`${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`);

    setIsModalOpen(true);
  };

  // 💡 予定の登録・更新を切り替える送信処理
  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    if (endDate < startDate) {
      alert("終了日は開始日以降の日付を指定してください。");
      return;
    }

    startTransition(async () => {
      try {
        if (editingEventId) {
          // 編集処理
          await editEvent(editingEventId, {
            title,
            description,
            startDate,
            endDate,
          });
          alert('予定を更新しました！');
        } else {
          // 新規作成処理
          await createEvent({
            title,
            description,
            startDate,
            endDate,
          });
          alert('予定を追加しました！');
        }

        setTitle('');
        setDescription('');
        setEditingEventId(null);
        setIsModalOpen(false);
      } catch (error) {
        console.error(error);
        alert('処理に失敗しました。');
      }
    });
  };

  // 💡 削除処理
  const handleDeleteEvent = async (id: string, title: string) => {
    if (confirm(`「${title}」を本当に削除しますか？`)) {
      startTransition(async () => {
        try {
          await deleteEvent(id);
          alert('予定を削除しました。');
        } catch (error) {
          console.error(error);
          alert('削除に失敗しました。');
        }
      });
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-card shadow-sm flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border pointer-events-auto"
            modifiers={{
              hasEvent: (day) => {
                const dayYMD = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                return events.some((event) => {
                  const startD = new Date(event.startDate);
                  const startYMD = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`;
                  const endD = new Date(event.endDate);
                  const endYMD = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`;
                  return dayYMD >= startYMD && dayYMD <= endYMD;
                });
              }
            }}
            modifiersStyles={{
              hasEvent: {
                fontWeight: 'bold',
                textDecoration: 'underline',
                textDecorationColor: '#16a34a',
                textDecorationThickness: '2px',
              }
            }}
          />
        </div>
        
        <div className="p-4 border rounded-lg bg-card shadow-sm text-center space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">選択中の日付</p>
            <p className="text-lg font-bold">
              {date ? date.toLocaleDateString() : '日付が未選択です'}
            </p>
          </div>
          
          <button
            onClick={handleOpenCreateModal}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md text-sm shadow transition"
          >
            この日に予定を追加
          </button>
        </div>
      </div>

      <div className="md:col-span-2 space-y-6">
        <div className="p-4 border rounded-lg bg-card shadow-sm">
          <h2 className="font-semibold mb-4 text-lg">
            {date ? `${date.toLocaleDateString()} の予定` : '予定一覧'}
          </h2>
          {filteredEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">この日の予定はありません。</p>
          ) : (
            <ul className="space-y-3">
              {filteredEvents.map((event) => (
                <li key={event.id} className="text-sm border-b pb-2 flex justify-between items-center">
                  <div>
                    <span className="font-medium block">{event.title}</span>
                    {event.description && (
                      <span className="text-xs text-gray-500 block">{event.description}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      担当: {event.user.name || "不明"}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-xs text-right text-muted-foreground">
                      {new Date(event.startDate).toLocaleDateString()} 〜 {new Date(event.endDate).toLocaleDateString()}
                    </div>
                    
                    {/* 編集ボタン */}
                    <button
                      onClick={() => handleOpenEditModal(event)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-semibold px-2.5 py-1 rounded border border-blue-200 hover:bg-blue-50 transition"
                    >
                      編集
                    </button>

                    {/* 削除ボタン */}
                    <button
                      onClick={() => handleDeleteEvent(event.id, event.title)}
                      className="text-red-600 hover:text-red-800 text-xs font-semibold px-2.5 py-1 rounded border border-red-200 hover:bg-red-50 transition"
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 border rounded-lg bg-card shadow-sm">
          <h2 className="font-semibold mb-4 text-lg">
            {date ? `${date.toLocaleDateString()} が期限の起案` : '起案期限一覧'}
          </h2>
          {filteredProposals.length === 0 ? (
            <p className="text-sm text-muted-foreground">この日が期限の起案はありません。</p>
          ) : (
            <ul className="space-y-3">
              {filteredProposals.map((proposal) => (
  <li key={proposal.id} className="text-sm border-b pb-2 flex justify-between items-center">
    <div>
      {/* 💡 Linkでタイトルを囲んで詳細ページへ飛ばす */}
      <Link 
        href={`/proposals/${proposal.id}`}
        className="font-medium block text-blue-600 hover:underline"
      >
        {proposal.title}
      </Link>
      <span className="text-xs text-muted-foreground">
        起案者: {proposal.author.name || "不明"}
      </span>
    </div>
  </li>
))}
            </ul>
          )}
        </div>
      </div>

      {/* 予定の追加・編集用モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-lg font-bold">
              {editingEventId ? '予定の編集' : (date ? `${date.toLocaleDateString()} の予定追加` : '予定追加')}
            </h3>
            
            <form onSubmit={handleSubmitEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="例: 夏季合宿・出張"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">説明（任意）</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="詳細な内容など"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-md text-sm transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md text-sm shadow transition"
                >
                  {isPending ? '保存中...' : (editingEventId ? '更新する' : '追加する')}
                </button>
              </div>
            </form>
            {/* 予定一覧のタイトルのあたり */}
<div className="flex justify-between items-center mb-4">
  <h2 className="font-semibold text-lg">
    {date ? `${date.toLocaleDateString()} の予定` : '予定一覧'}
  </h2>
  
  {/* 💡 エクスポートボタン */}
  <button
    onClick={handleExportCSV}
    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded shadow transition"
  >
    CSVで出力
  </button>
</div>
          </div>
        </div>
      )}
    </div>
  );
}