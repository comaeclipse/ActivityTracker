import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Mark this route as dynamic since it uses query parameters
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const takeParam = request.nextUrl.searchParams.get('take');
    const userId = request.nextUrl.searchParams.get('userId');
    const currentUserId = request.nextUrl.searchParams.get('currentUserId');
    const take = Math.min(Math.max(parseInt(takeParam || '50', 10) || 50, 1), 200);

    const items = await prisma.activity.findMany({
      where: userId ? { userId } : undefined,
      include: {
        user: { select: { id: true, username: true } },
        likes: currentUserId ? {
          where: { userId: currentUserId },
          select: { id: true },
        } : false,
        _count: {
          select: { likes: true },
        },
      },
      orderBy: { activityDate: 'desc' },
      take,
    });

    const payload = items.map((a) => ({
      id: a.id,
      user: { id: a.user.id, username: a.user.username },
      type: a.type,
      value: a.value,
      unit: a.unit,
      durationMinutes: a.durationMinutes,
      notes: a.notes,
      activityDate: a.activityDate,
      createdAt: a.createdAt,
      likeCount: a._count.likes,
      isLikedByCurrentUser: currentUserId ? a.likes.length > 0 : false,
    }));

    return NextResponse.json({ data: payload });
  } catch (err: any) {
    console.error('GET /api/feed error', err);
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 });
  }
}

