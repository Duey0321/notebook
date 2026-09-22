// app/mail/data.ts

export type Mail = {
  id: string
  name: string
  email: string
  subject: string
  text: string
  date: string
  read: boolean
  labels: string[]
}

export const mails: Mail[] = [
  {
    id: "m1",
    name: "山田 太郎",
    email: "yamada@example.com",
    subject: "プロジェクトの進捗確認について",
    text: "お疲れ様です。来週月曜日のミーティングまでに、進捗報告書のアップデートをお願いできますでしょうか。特にフロントエンドの実装状況について共有いただけますと幸いです。",
    date: "2026-07-20T10:30:00",
    read: false,
    labels: ["work", "important"],
  },
  {
    id: "m2",
    name: "GitHub",
    email: "noreply@github.com",
    subject: "[GitHub] Security alert: dependency vulnerability fixed",
    text: "We found a known vulnerability in one of your dependencies. The issue has been automatically resolved in pull request #42. Please review and merge.",
    date: "2026-07-19T18:22:00",
    read: true,
    labels: ["oss"],
  },
  {
    id: "m3",
    name: "[下書き]",
    email: "draft",
    subject: "【未送信】お見積書送付のご案内",
    text: "〇〇株式会社 佐藤様 いつもお世話になっております。先日ご依頼いただきました、新システム構築に関するお見積書を添付いたします。ご査収のほどよろしくお願いいたします。",
    date: "2026-07-20T09:00:00",
    read: true,
    labels: ["draft"],
  },
]