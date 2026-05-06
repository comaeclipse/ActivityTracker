import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        actor: {
          select: { username: true }
        }
      }
    });

    return NextResponse.json({ data: notifications });
  } catch (err: any) {
    console.error('GET /api/notifications error', err);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, notificationId } = body ?? {};

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { read: true },
      });
    } else {
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('PATCH /api/notifications error', err);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
