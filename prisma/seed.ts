import prisma from "../lib/prisma";

async function main() {
  // 💡 配列の末尾に `as const` を追加して、文字列をリテラル型として認識させます
  const resources = [
    {
      id: "res-1",
      name: "第1会議室",
      category: "ROOM",
      description: "プロジェクター・ホワイトボード完備",
      capacity: 12,
    },
    {
      id: "res-2",
      name: "第2会議室",
      category: "ROOM",
      description: "少人数打ち合わせ用",
      capacity: 6,
    },
    {
      id: "res-3",
      name: "公用車A (プリウス)",
      category: "CAR",
      description: "ハイブリッド・5人乗り・ETCカードあり",
      capacity: 5,
    },
    {
      id: "res-4",
      name: "公用車B (アクア)",
      category: "CAR",
      description: "コンパクトカー・社内移動用",
      capacity: 5,
    },
    {
      id: "res-5",
      name: "モバイルプロジェクター",
      category: "EQUIPMENT",
      description: "HDMI・Type-C対応持ち運び用",
      capacity: 1,
    },
  ] as const; // 👈 ここに `as const` を追加

  for (const res of resources) {
    await prisma.resource.upsert({
      where: { id: res.id },
      update: {},
      create: res,
    });
  }
}

main()
  .then(() => {
    console.log("Seeding finished.");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });