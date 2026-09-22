import { auth } from "@/auth";

/**
 * Server Actions や RSC から呼び出し、認証済みユーザーの ID を取得する
 */
export async function getUserIdFromSession(): Promise<string> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("認証されていません。ログインしてください。");
  }

  return session.user.id;
}