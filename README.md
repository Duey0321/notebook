This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


# 📅 施設・備品 予約管理システム (Resource Reservation System)

Next.js 15 (App Router)、Prisma 7、Auth.js を用いて構築した、堅牢な認証・認可基盤とデータ整合性を備えたプロダクションレベルの予約管理システムです。

---

## 🚀 主な機能

- **ユーザー認証・認可 (Authentication & Authorization)**
  - Auth.js によるセッション管理
  - RBAC (Role-Based Access Control) による管理者 (`ADMIN`) と一般ユーザー (`MEMBER`) の権限分離
  - サーバーコンポーネントおよび Server Actions における二重の認可（IDOR 対策）
- **予約管理 (CRUD & Logic)**
  - 会議室・公用車・備品のリソース別予約機能
  - リレーションを活用したデータ取得 (Prisma Include / Select)
  - 論理削除・ステータス管理 (`CONFIRMED` / `CANCELLED`)
  - 重複予約の高速判定 (データベースインデックス設計)
- **リアルタイム UX / 画面更新**
  - Next.js Server Actions と `revalidatePath` によるキャッシュ最適化と最新状態の自動反映

---

## 🛠 使用技術 (Tech Stack)

| カテゴリ | 技術スタック |
| --- | --- |
| **Framework** | Next.js 15 (App Router, Server Components, Server Actions) |
| **Language** | TypeScript |
| **Database & ORM** | PostgreSQL, Prisma 7 (Driver Adapters) |
| **Authentication** | Auth.js (NextAuth.js v5) |
| **Styling** | Tailwind CSS |

---

## 🛡 セキュリティ・設計のこだわり (Architecture & Security)

### 1. 厳格なサーバーサイド認可 (IDOR 脆弱性対策)
画面側で「キャンセルボタンを隠す」といった見た目の制御にとどまらず、**Server Components (`page.tsx`)** および **Server Actions (`cancelReservation`)** の両レイヤーで `session.user.id` と予約の保有者IDを照合しています。
他人の予約IDを直接指定した悪意あるリクエストに対しても、`notFound()` を返却することで「リソースの存在自体を非開示」にする安全な設計を採用しています。

### 2. Prisma 7 & 最新 App Router への対応
- Next.js 15 の非同期パラメータ (`await params`) に完全対応。
- Prisma 7 のドライバアダプター構成に対応した接続インスタンスの一元管理 (`lib/prisma.ts`)。
- 高速な開発体験を維持するためのシードスクリプト (`prisma/seed.ts`) の自動化。

---

## 💻 ローカル環境での起動方法 (Getting Started)

### 前提条件
- Node.js 18.x 以上
- PostgreSQL データベース

### 1. リポジトリのクローンと依存パッケージのインストール
```bash
git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd your-repo-name
npm install

2. 環境変数の設定
プロジェクト直下に .env ファイルを作成し、以下を設定します。

コード スニペット
DATABASE_URL="postgresql://user:password@localhost:5432/reservation_db?schema=public"
AUTH_SECRET="your-nextauth-secret"
3. データベースのセットアップ & マイグレーション
Bash
npx prisma migrate dev
npx prisma generate
4. 初期データ（Seed）の投入
Bash
npx prisma db seed
5. 開発サーバーの起動
Bash
npm run dev
ブラウザで http://localhost:3000 にアクセスします。

🗄 データベースモデル概要 (ER Diagram)
User: ユーザー情報・ロール権限 (ADMIN, MEMBER)

Resource: 予約対象 (会議室, 公用車, 備品)

Reservation: 予約データ (開始/終了日時, ステータス, ユーザー・リソースとの外部キー結合)

1. デモ環境（Web公開リンク）の掲載（★一番効果的）
もし Vercel や Supabase/Render などで実際に動く環境（デモURL）を作成した、または作成予定であれば、README の一番上に書いておくと評価が跳ね上がります。面接官はローカルで起動しなくても手元で10秒で動作確認できるためです。

Markdown
## 🔗 デモ (Live Demo)
- **URL**: [https://your-app-name.vercel.app](https://your-app-name.vercel.app)
- **テスト用アカウント**:
  - 管理者 (ADMIN): `admin@example.com` / `password123`
  - 一般ユーザー (MEMBER): `user@example.com` / `password123`
2. ディレクトリ構造の可視化
プロジェクト全体の構成（どこに何のファイルがあるか）をツリー形式で書いておくと、コードの整理整頓ができるエンジニアだという印象を与えられます。

Markdown
## 📁 ディレクトリ構成 (Project Structure)

```text
├── app/
│   ├── (auth)/             # ログイン・認証関連ページ
│   ├── admin/              # 管理者専用ダッシュボード
│   ├── reservations/       # 予約一覧・詳細・キャンセル処理
│   │   ├── [id]/
│   │   │   └── page.tsx   # IDOR対策済みの予約詳細（await params対応）
│   │   └── actions.ts      # Server Actions (二重認可チェック・キャンセル処理)
│   └── api/                # Auth.js 用 API ルート
├── components/             # 共通UIコンポーネント
├── lib/
│   ├── auth.ts             # Auth.js 設定
│   └── prisma.ts           # Prisma Client インスタンス (Prisma 7 対応)
├── prisma/
│   ├── schema.prisma       # データベーススキーマ
│   └── seed.ts             # 初期データ投入スクリプト
└── README.md


## 🔮 今後の改善・拡張予定 (Roadmap)

- [ ] Zod による Form 入力バリデーションの強化
- [ ] 予約重複を防ぐデータベースレベルでのトランザクション処理 (`$transaction`)
- [ ] 予約完了時のメール通知機能 (Resend / SendGrid)
- [ ] E2E テストの導入 (Playwright)