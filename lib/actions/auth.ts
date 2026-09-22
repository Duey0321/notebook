"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import prisma from "../prisma";
import { signOut } from "@/auth";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password || !name) {
    throw new Error("すべての項目を入力してください。");
  }

  // 1. 既存ユーザーのチェック
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("このメールアドレスは既に登録されています。");
  }

  // 2. パスワードのハッシュ化
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. ユーザーの作成
  // ※ Prisma Schema に password フィールドがない場合は、必要に応じて追加するか
  //    テスト用に今回は基本情報のみ作成します
  await prisma.user.create({
    data: {
      name,
      email,
      // もし Schema に password フィールドを追加している場合は以下も記述
      // password: hashedPassword,
    },
  });

  // 4. 登録成功後にログインページへ移動
  redirect("/login");
}

/**
 * ログアウト処理
 * 実行後、自動的にログイン画面（/login）へリダイレクトします
 */
export async function handleSignOut() {
  await signOut({ redirectTo: "/login" });
}