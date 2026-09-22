import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import GroupCalendarClient from "@/components/GroupCalenderClient";
import { Navbar } from "@/components/navbar";

export default async function GroupCalendarPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // 1. ログインユーザーが所属しているグループ（課）を取得
  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          proposals: {
            where: { dueDate: { not: null } },
            include: {
              author: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (memberships.length === 0) {
    return (
      <div className="container py-10">
        <p className="text-sm text-muted-foreground">所属しているグループ（課）がありません。</p>
      </div>
    );
  }

  const targetGroup = memberships[0].group;
  const memberIds = targetGroup.members.map((m) => m.userId);

  // 2. 課内メンバー全員の予定（Event）を一括取得
  const groupEvents = await prisma.event.findMany({
    where: {
      userId: { in: memberIds },
    },
    include: {
      user: { select: { name: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return (
    <div className="container max-w-6xl py-10 space-y-8">
      <div>
        <Navbar />
        <h1 className="text-2xl font-bold">{targetGroup.name} のスケジュール調整</h1>
        <p className="text-sm text-muted-foreground">
          カレンダーの日付を選択すると、その日のメンバーの予定や起案期限を確認できます。
        </p>
      </div>

      {/* クライアント側で動作するコンポーネントにデータを渡す */}
      <GroupCalendarClient
        groupName={targetGroup.name}
        events={groupEvents}
        proposals={targetGroup.proposals}
      />
    </div>
  );
}