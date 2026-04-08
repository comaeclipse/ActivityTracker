import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ActivityType, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const requestingUserId = request.nextUrl.searchParams.get('requestingUserId');
    const startDate = request.nextUrl.searchParams.get('startDate');
    const endDate = request.nextUrl.searchParams.get('endDate');
    const type = request.nextUrl.searchParams.get('type') as ActivityType | null;

    const requester = await prisma.user.findUnique({
      where: { id: requestingUserId ?? '' },
      select: { role: true },
    });

    if (!requester || requester.role !== 'AUDITOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, username: true, role: true, createdAt: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const where: Prisma.ActivityWhereInput = {
      userId: params.userId,
      ...(type ? { type } : {}),
      ...((startDate || endDate) ? {
        activityDate: {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate + 'T23:59:59') } : {}),
        },
      } : {}),
    };

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { activityDate: 'desc' },
      select: {
        id: true,
        type: true,
        value: true,
        unit: true,
        durationMinutes: true,
        notes: true,
        activityDate: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: targetUser, activities });
  } catch (error) {
    console.error('GET /api/auditor/users/[userId] error:', error);
    return NextResponse.json({ error: 'Failed to fetch user snapshot' }, { status: 500 });
  }
}
