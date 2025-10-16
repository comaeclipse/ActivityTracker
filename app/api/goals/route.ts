import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { GoalStatus } from '@prisma/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET - Fetch all goals for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const status = request.nextUrl.searchParams.get('status') as GoalStatus | null;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const goals = await prisma.goal.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      include: {
        _count: {
          select: { updates: true },
        },
      },
      orderBy: [
        { status: 'asc' }, // ACTIVE first
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ data: goals });
  } catch (err: any) {
    console.error('GET /api/goals error', err);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST - Create new goal
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      title,
      description,
      goalType,
      targetValue,
      currentValue,
      unit,
      deadline,
    } = body ?? {};

    // Validation
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    if (
      targetValue === undefined ||
      targetValue === null ||
      !Number.isFinite(Number(targetValue)) ||
      Number(targetValue) <= 0
    ) {
      return NextResponse.json(
        { error: 'targetValue must be a positive number' },
        { status: 400 }
      );
    }

    if (!unit || typeof unit !== 'string' || unit.trim() === '') {
      return NextResponse.json(
        { error: 'unit is required' },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        title: title.trim(),
        description: description?.trim() || null,
        goalType: goalType || 'INCREASE',
        targetValue: Number(targetValue),
        currentValue: currentValue !== undefined && currentValue !== null
          ? Number(currentValue)
          : 0,
        unit: unit.trim(),
        deadline: deadline ? new Date(deadline) : null,
        status: 'ACTIVE',
      },
      include: {
        _count: {
          select: { updates: true },
        },
      },
    });

    return NextResponse.json({ data: goal }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/goals error', err);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}
