import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ReservationClient from "./ReservationClient";

export default async function ReservationPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // 1. DBから予約データを全件取得（または必要な範囲で取得）
  const dbReservations = await prisma.reservation.findMany({
    orderBy: {
      startTime: "asc",
    },
  });

  // 2. Client Component に渡すために Date オブジェクトを文字列形式に変換（シリアライズ）
  const initialReservations = dbReservations.map((r) => ({
    id: r.id,
    resourceId: r.resourceId,
    title: r.title,
    // 日付判定ロジックに合わせて "YYYY-MM-THH:mm" や ISO文字列に変換
    startTime: new Date(r.startTime).toISOString(),
    endTime: new Date(r.endTime).toISOString(),
  }));

  return (
    <ReservationClient
      initialReservations={initialReservations}
      userId={session.user.id}
    />
  );
}