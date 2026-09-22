import { DefaultSession, DefaultUser } from "next-auth";
import { Role } from "@/lib/generated/prisma"; // Prisma の Role Enum をインポート

declare module "next-auth" {
  // Session 内の user の型定義を拡張
  interface Session {
    user: {
      id: string;
      role: Role; // 💡 role を追加
    } & DefaultSession["user"];
  }

  // User オブジェクト（auth.ts 内などで扱われるユーザー型）を拡張
  interface User extends DefaultUser {
    role?: Role; // 💡 role を追加
  }
}

declare module "next-auth/jwt" {
  // JWT トークン内の型定義を拡張
  interface JWT {
    id?: string;
    role?: Role; // 💡 role を追加
  }
}
