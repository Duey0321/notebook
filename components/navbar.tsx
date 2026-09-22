import Link from "next/link";
import { handleSignOut } from "@/lib/actions/auth";

export function Navbar() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm mb-6">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-bold text-lg text-gray-800">
          ワークフローシステム
        </Link>
        <nav className="flex gap-3 text-sm">
          <Link
            href="/draft"
            className="px-3 py-1.5 rounded hover:bg-gray-100 text-gray-700 font-medium transition-colors"
          >
            ✏️ 起案作成 (/draft)
          </Link>
          <Link
            href="/recept"
            className="px-3 py-1.5 rounded hover:bg-gray-100 text-gray-700 font-medium transition-colors"
          >
            📥 収受・閲覧 (/recept)
          </Link>
          <Link
            href="/reservation"
            className="px-3 py-1.5 rounded hover:bg-gray-100 text-gray-700 font-medium transition-colors"
          >
            📕予約 (/reservation)
          </Link>
        </nav>
      </div>

      {/* ログアウトボタン */}
      <form action={handleSignOut}>
        <button
          type="submit"
          className="text-xs text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded font-medium transition-colors"
        >
          ログアウト
        </button>
      </form>
    </header>
  );
}