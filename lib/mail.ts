// lib/mail.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendProposalNotificationParams = {
  to: string[]; // 当スモの宛先メールアドレスの配列
  proposalTitle: string;
  authorName: string;
  proposalId: string;
};

export async function sendProposalNotification({
  to,
  proposalTitle,
  authorName,
  proposalId,
}: SendProposalNotificationParams) {

  console.log("👉 メール通知関数が呼ばれました。宛先:", to);
  if (!to || to.length === 0) return;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const proposalUrl = `${baseUrl}/recept`;

  try {

    const testTo = ["doiken0321@icloud.com"];
    const data = await resend.emails.send({
      from: "起案・収受システム <onboarding@resend.dev>",
      to: testTo, // 👈 ここを引数の to（配列）にする！
      subject: `【新着起案】${proposalTitle} が届いています`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e293b; font-size: 20px;">新しい起案文書が回覧されました</h2>
          <p style="color: #475569; font-size: 14px;">
            <strong>${authorName}</strong> さんから新しい起案が提出されました。
          </p>
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>件名:</strong> ${proposalTitle}</p>
          </div>
          <p style="font-size: 14px; color: #475569;">
            内容を確認し、対応を行ってください。
          </p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${proposalUrl}" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: bold;">
              収受・閲覧一覧を確認する
            </a>
          </div>
        </div>
      `,
    });

    console.log("メール通知を送信しました:", data);
  } catch (error) {
    console.error("メール送信に失敗しました:", error);
  }
}