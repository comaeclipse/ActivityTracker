import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ActivityType, Prisma, UserRole } from '@prisma/client';

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const requestingUserId: string | undefined = body.requestingUserId;
    const role: UserRole | undefined = body.role;

    if (role !== 'USER' && role !== 'AUDITOR') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const requester = await prisma.user.findUnique({
      where: { id: requestingUserId ?? '' },
      select: { id: true, role: true },
    });

    if (!requester || requester.role !== 'AUDITOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent an auditor from revoking their own auditor role (avoids lockout).
    if (requester.id === params.userId && role !== 'AUDITOR') {
      return NextResponse.json(
        { error: 'You cannot revoke your own auditor role' },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: params.userId },
      data: { role },
      select: { id: true, username: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('PATCH /api/auditor/users/[userId] error:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}
