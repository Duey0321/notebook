"use server"

import prisma from "@/lib/prisma";
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function createEvent(formData: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
}) {
    const session = await auth()
    if(!session?.user?.id) {
        throw new Error('認証されていません。');
    }

    const { title, description, startDate, endDate } = formData;

    if(!title || !startDate || !endDate) {
        throw new Error('必須項目が入力されていません。');
    }

    await prisma.event.create({
        data: {
            title, description: description || null,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            userId: session.user.id,
        }
    })

    revalidatePath('/calender/group')

    return { success: true}

}

export async function deleteEvent(id: string) {
    const session = await auth()
    if(!session?.user?.id) {
        throw new Error('認証されていません。');
    }

    try {
        await prisma.event.delete({
            where: {id}
        })
    } catch (error) {
        throw new Error('イベントの削除に失敗しました。');
    }

    revalidatePath('/calender/group')

    return { success: true}
}

export async function editEvent(id: string, formData: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('認証されていません。');
    }

    const { title, description, startDate, endDate } = formData;

    if (!title || !startDate || !endDate) {
        throw new Error('必須項目が入力されていません。');
    }

    try {
        await prisma.event.update({
            where: { id },
            data: {
                title,
                description: description || null,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
            }
        });
    } catch (error) {
        throw new Error('イベントの編集に失敗しました。');
    }

    revalidatePath('/calender/group');

    return { success: true };
}