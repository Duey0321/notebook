"use client";

import { cancelReservation } from "@/app/reservation/actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface CancelButtonProps {
  reservationId: string;
}

export default function CancelButton({ reservationId }: CancelButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCancel = () => {
    if (!confirm("本当にこの予約をキャンセルしますか？")) {
      return;
    }

    startTransition(async () => {
      const result = await cancelReservation(reservationId);
      if (!result.success) {
        alert(result.message);
      } else {
        alert("予約をキャンセルしました。");
        router.push("/reservation");
      }
    });
  };

  return (
    <button
      onClick={handleCancel}
      disabled={isPending}
      className="px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
    >
      {isPending ? "キャンセル処理中..." : "予約のキャンセル"}
    </button>
  );
}