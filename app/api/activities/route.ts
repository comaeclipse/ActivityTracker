import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ActivityType } from '@prisma/client';

const TYPES: readonly ActivityType[] = ['RUN','WALK','SWIM','WEIGHTS','BIKE','HYDRATION'] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, type, value, unit, durationMinutes, notes, activityDate } = body ?? {};

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    if (!type || !TYPES.includes(type)) {
      return NextResponse.json({ error: `type must be one of ${TYPES.join(', ')}` }, { status: 400 });
    }

    // Validate that at least one of value/unit or durationMinutes is provided
    const hasValue = value !== undefined && value !== null && value !== '';
    const hasDuration = durationMinutes !== undefined && durationMinutes !== null && durationMinutes !== '';

    if (!hasValue && !hasDuration) {
      return NextResponse.json({ error: 'Either value/unit or duration is required' }, { status: 400 });
    }

    // Validate value if provided
    let num = null;
    if (hasValue) {
      num = Number(value);
      if (!Number.isFinite(num)) {
        return NextResponse.json({ error: 'value must be a valid number' }, { status: 400 });
      }
      if (!unit || typeof unit !== 'string') {
        return NextResponse.json({ error: 'unit is required when value is provided' }, { status: 400 });
      }
    }

    // Validate duration if provided
    let duration = null;
    if (hasDuration) {
      duration = Number(durationMinutes);
      if (!Number.isFinite(duration) || duration <= 0) {
        return NextResponse.json({ error: 'duration must be a positive number' }, { status: 400 });
      }
    }

    const created = await prisma.activity.create({
      data: {
        userId,
        type,
        value: num,
        unit: hasValue ? unit : null,
        durationMinutes: duration,
        notes: notes || null,
        activityDate: activityDate ? new Date(activityDate) : new Date()
      },
      include: { user: { select: { id: true, username: true } } },
    });

    return NextResponse.json({
      data: {
        id: created.id,
        user: created.user,
        type: created.type,
        value: created.value,
        unit: created.unit,
        durationMinutes: created.durationMinutes,
        notes: created.notes,
        activityDate: created.activityDate,
        createdAt: created.createdAt,
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/activities error', err);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}

