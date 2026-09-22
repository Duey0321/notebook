import Link from "next/link";
import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form
        action={async (formData) => {
          "use server";
          // redirectTo オプションを追加してトップページ ('/') に遷移させる
          await signIn("credentials", {
            email: formData.get("email"),
            password: formData.get("password"),
            redirectTo: "/",
          });
        }}
        className="flex flex-col gap-4 w-80"
      >
        <h1 className="text-xl font-bold">ログイン</h1>
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
          placeholder="Password"
          required
          className="border p-2 rounded"
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          ログイン
        </button>

        <p className="text-xs text-center text-muted-foreground mt-2">
          アカウントをお持ちでないですか？{" "}
          <Link href="/register" className="text-blue-600 underline">
            新規登録はこちら
          </Link>
        </p>
      </form>
    </div>
  );
}