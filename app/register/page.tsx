import Link from "next/link";
import { registerUser } from "@/lib/actions/auth";

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form action={registerUser} className="flex flex-col gap-4 w-80">
        <h1 className="text-xl font-bold">新規アカウント登録</h1>
        
        <input
          name="name"
          type="text"
          placeholder="お名前"
          required
          className="border p-2 rounded"
        />
        <input
          name="email"
          type="email"
          placeholder="email@example.com"
          required
          className="border p-2 rounded"
        />
        <input
          name="password"
          type="password"
          placeholder="パスワード"
          required
          className="border p-2 rounded"
        />
        
        <button type="submit" className="bg-green-600 text-white p-2 rounded font-medium">
          登録する
        </button>

        <p className="text-xs text-center text-muted-foreground mt-2">
          すでにアカウントをお持ちですか？{" "}
          <Link href="/login" className="text-blue-600 underline">
            ログインはこちら
          </Link>
        </p>
      </form>
    </div>
  );
}