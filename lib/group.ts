'use server';

import prisma from "./prisma";


/**
 * DBからすべてのグループ（部署）一覧を取得する
 */
export async function getGroups() {
  const groups = await prisma.group.findMany({
    orderBy: {
      name: 'asc', // 部署名順に並び替え
    },
  });
  return groups;
}