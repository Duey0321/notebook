// app/mail/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MailClient from "@/components/mail-client"; // クライアント側の描画部分を分離
import prisma from "@/lib/prisma";

export default async function MailPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // 1. ログインユーザー宛ての収受データ（Proposal）をデータベースから取得
  const receipts = await prisma.receipt.findMany({
    where: { userId: session.user.id },
    include: {
      proposal: {
        include: {
          author: true, // 起案者の情報（名前・メール）を取得
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 2. MailPage用の形式にデータ構造を変換
  const mails = receipts.map((receipt) => ({
    id: receipt.proposal.id,
    name: receipt.proposal.author.name || "起案者",
    email: receipt.proposal.author.email || "no-email@example.com",
    subject: receipt.proposal.title,
    text: receipt.proposal.content,
    date: new Date(receipt.proposal.createdAt).toLocaleString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    read: receipt.readAt !== null,
    labels: ["work", receipt.proposal.status.toLowerCase()],
  }));

  return <MailClient initialMails={mails} />;
}