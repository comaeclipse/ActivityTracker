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

    const rows = await prisma.activity.findMany({
      orderBy: [{ user: { username: 'asc' } }, { activityDate: 'desc' }],
      select: {
        id: true,
        type: true,
        value: true,
        unit: true,
        durationMinutes: true,
        notes: true,
        activityDate: true,
        user: { select: { username: true } },
      },
    });

    const activities = rows.map(({ user, ...a }) => ({
      ...a,
      username: user.username,
    }));

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('GET /api/auditor/export error:', error);
    return NextResponse.json({ error: 'Failed to export activities' }, { status: 500 });
  }
}
