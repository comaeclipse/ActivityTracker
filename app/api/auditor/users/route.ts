import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const requestingUserId = request.nextUrl.searchParams.get('requestingUserId');

    const requester = await prisma.user.findUnique({
      where: { id: requestingUserId ?? '' },
      select: { role: true },
    });

    if (!requester || requester.role !== 'AUDITOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        _count: { select: { activities: true } },
        activities: {
          orderBy: { activityDate: 'desc' },
          select: { activityDate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt,
      activityCount: u._count.activities,
      lastActive: u.activities[0]?.activityDate ?? null,
      activityDates: [...new Set(u.activities.map((a) => a.activityDate.toISOString().split('T')[0]))],
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/auditor/users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
