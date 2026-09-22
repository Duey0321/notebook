// __tests__/actions/reservation.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { cancelReservation } from '@/app/reservation/actions';
import { Reservation } from '@/lib/generated/prisma/browser';

// 外部モジュールのモック化
vi.mock('@/lib/prisma', () => ({
  prisma: {
    reservation: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Server Action: cancelReservation (IDOR Protection)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未認証ユーザー（未ログイン）からのリクエストは拒否されること', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const result = await cancelReservation('reservation-123');

    // success が false であることを検証
    expect(result.success).toBe(false);
    expect(prisma.reservation.update).not.toHaveBeenCalled();
  });

  it('他人の予約をキャンセルしようとした場合（IDOR攻撃）、拒否されること', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-A', email: 'usera@example.com' },
      expires: '2026-12-31',
    });

    vi.mocked(prisma.reservation.findUnique).mockResolvedValue({
      id: 'reservation-123',
      userId: 'user-B',
      status: 'CONFIRMED',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Reservation);

    const result = await cancelReservation('reservation-123');

    // 実際の返り値に合わせて修正
    expect(result).toEqual({
      success: false,
      message: '権限エラー: この予約をキャンセルする権限がありません。',
    });
    expect(prisma.reservation.update).not.toHaveBeenCalled();
  });

  it('所有者本人からのリクエストの場合、正常にキャンセル処理が実行されること', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-A', email: 'usera@example.com' },
      expires: '2026-12-31',
    });

    vi.mocked(prisma.reservation.findUnique).mockResolvedValue({
      id: 'reservation-123',
      userId: 'user-A',
      status: 'CONFIRMED',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Reservation);

    vi.mocked(prisma.reservation.update).mockResolvedValue({
      id: 'reservation-123',
      status: 'CANCELLED',
    } as unknown as Reservation);

    const result = await cancelReservation('reservation-123');

    // 実際の返り値に合わせて修正
    expect(result).toEqual({
      success: true,
      message: '予約を正常にキャンセルしました。',
    });
    expect(prisma.reservation.update).toHaveBeenCalledWith({
      where: { id: 'reservation-123' },
      data: { status: 'CANCELLED' },
    });
  });
});