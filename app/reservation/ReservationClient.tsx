"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createReservation } from "./actions";
import { Navbar } from "@/components/navbar";

type ResourceCategory = "ROOM" | "CAR" | "EQUIPMENT";

interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  description: string;
  capacity?: number;
}

export interface Reservation {
  id: string;
  resourceId: string;
  title: string;
  startTime: string;
  endTime: string;
}

const MOCK_RESOURCES: Resource[] = [
  { id: "res-1", name: "第1会議室", category: "ROOM", description: "プロジェクター・ホワイトボード完備", capacity: 12 },
  { id: "res-2", name: "第2会議室", category: "ROOM", description: "少人数打ち合わせ用", capacity: 6 },
  { id: "res-3", name: "公用車A (プリウス)", category: "CAR", description: "ハイブリッド・5人乗り・ETCカードあり", capacity: 5 },
  { id: "res-4", name: "公用車B (アクア)", category: "CAR", description: "コンパクトカー・社内移動用", capacity: 5 },
  { id: "res-5", name: "モバイルプロジェクター", category: "EQUIPMENT", description: "HDMI・Type-C対応持ち運び用", capacity: 1 },
];

interface ReservationClientProps {
  initialReservations: Reservation[];
  userId: string;
}

export default function ReservationClient({
  initialReservations,
  userId,
}: ReservationClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory>("ROOM");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());

  // 💡 サーバーから受け取った DB データを初期表示用ステートにセット
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const filteredResources = MOCK_RESOURCES.filter(
    (item) => item.category === selectedCategory
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingDayOfWeek = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleDateClick = (day: number) => {
    const selectedDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    setStartTime(`${selectedDateStr}T09:00`);
    setEndTime(`${selectedDateStr}T10:00`);

    if (!selectedResource && filteredResources.length > 0) {
      setSelectedResource(filteredResources[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;

    const result = await createReservation({
      resourceId: selectedResource.id,
      userId: userId, // ログインユーザーIDを使用
      title,
      startTime,
      endTime,
    });

    if (result.success && result.data) {
      // 登録成功したらDBに作成されたデータを画面ステートへ反映
      const newReservation: Reservation = {
        id: result.data.id,
        resourceId: result.data.resourceId,
        title: result.data.title,
        startTime: new Date(result.data.startTime).toISOString(),
        endTime: new Date(result.data.endTime).toISOString(),
      };
      setReservations((prev) => [...prev, newReservation]);

      alert("予約が完了しました！");
      setSelectedResource(null);
      setTitle("");
    } else {
      alert(`予約失敗: ${result.error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <header className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-800">施設・備品予約</h1>
          <p className="text-sm text-gray-500 mt-1">
            会議室、公用車、貸出備品のスケジュール確認および予約管理が行えます。
          </p>
        </header>

        {/* 📅 カレンダーセクション */}
        <section className="bg-white rounded-lg border shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">
              {year}年 {month + 1}月
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="px-3 py-1.5 text-xs font-medium border rounded hover:bg-gray-50 transition-colors"
              >
                ◀ 前月
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-medium border rounded hover:bg-gray-50 transition-colors"
              >
                今月
              </button>
              <button
                onClick={handleNextMonth}
                className="px-3 py-1.5 text-xs font-medium border rounded hover:bg-gray-50 transition-colors"
              >
                次月 ▶
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center font-semibold text-xs text-gray-500 border-b pb-2">
            <span className="text-red-500">日</span>
            <span>月</span>
            <span>火</span>
            <span>水</span>
            <span>木</span>
            <span>金</span>
            <span className="text-blue-500">土</span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-28 bg-gray-50/50 rounded" />
            ))}

            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const today = new Date();
              const isToday =
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === day;

              const dayOfWeek = new Date(year, month, day).getDay();
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;

              // YYYY-MM-DD 形式で日付比較ができるようにプレフィックスを作成
              const monthStr = String(month + 1).padStart(2, "0");
              const dayStr = String(day).padStart(2, "0");
              const datePrefix = `${year}-${monthStr}-${dayStr}`;

              // DBから取得した ISO日付文字列 (例: "2026-06-10T10:00:00.000Z") 内に含まれるか判定
              const dayReservations = reservations.filter((r) =>
                r.startTime.includes(datePrefix)
              );

              return (
                <div
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`h-28 border rounded p-1.5 text-left flex flex-col justify-between cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 transition-all overflow-hidden ${
                    isToday
                      ? "bg-blue-50/60 border-blue-400 font-bold"
                      : "bg-white"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday
                          ? "bg-blue-600 text-white"
                          : isSunday
                          ? "text-red-500"
                          : isSaturday
                          ? "text-blue-500"
                          : "text-gray-700"
                      }`}
                    >
                      {day}
                    </span>
                    <span className="text-[10px] text-gray-400 hover:text-blue-600">
                      + 予約
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1 mt-1">
                    {dayReservations.map((rev) => {
                      const resource = MOCK_RESOURCES.find(
                        (r) => r.id === rev.resourceId
                      );
                      // 時間表記（例: "10:00"）を抽出
                      const timeMatch = rev.startTime.match(/T(\d{2}:\d{2})/);
                      const timeOnly = timeMatch ? timeMatch[1] : "";

                      return (
                        <Link
                          key={rev.id}
                          href={`/reservation/${rev.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="block text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-800 rounded px-1 py-0.5 truncate shadow-2xs transition-colors"
                          title={`${timeOnly} - ${rev.title} (${resource?.name ?? ""})`}
                        >
                          <span className="font-semibold">{timeOnly}</span>{" "}
                          {rev.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* カテゴリ切り替えタブ */}
        <div className="flex gap-2 border-b pt-4">
          <button
            onClick={() => setSelectedCategory("ROOM")}
            className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
              selectedCategory === "ROOM"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            🏢 会議室 (`ROOM`)
          </button>
          <button
            onClick={() => setSelectedCategory("CAR")}
            className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
              selectedCategory === "CAR"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            🚗 公用車 (`CAR`)
          </button>
          <button
            onClick={() => setSelectedCategory("EQUIPMENT")}
            className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
              selectedCategory === "EQUIPMENT"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📦 備品・機器 (`EQUIPMENT`)
          </button>
        </div>

        {/* リソース一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="border rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-800">
                    {resource.name}
                  </h3>
                  {resource.capacity && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      定員: {resource.capacity}名
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {resource.description}
                </p>
              </div>

              <button
                onClick={() => setSelectedResource(resource)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
              >
                予約する
              </button>
            </div>
          ))}
        </div>

        {/* モーダル */}
        {selectedResource && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 shadow-xl">
              <h2 className="text-xl font-bold text-gray-800">
                新規予約: {selectedResource.name}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    利用目的 (`title`)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例: ○○課打ち合わせ、本庁巡回など"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始日時 (`startTime`)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    終了日時 (`endTime`)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedResource(null)}
                    className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    確定する
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}