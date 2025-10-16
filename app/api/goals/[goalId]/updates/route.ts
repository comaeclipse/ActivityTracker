import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET - Fetch all updates for a goal
export async function GET(
  request: NextRequest,
  { params }: { params: { goalId: string } }
) {
  try {
    const { goalId } = params;

    if (!goalId || typeof goalId !== 'string') {
      return NextResponse.json(
        { error: 'goalId is required' },
        { status: 400 }
      );
    }

    const updates = await prisma.goalUpdate.findMany({
      where: { goalId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: updates });
  } catch (err: any) {
    console.error('GET /api/goals/[goalId]/updates error', err);
    return NextResponse.json(
      { error: 'Failed to fetch updates' },
      { status: 500 }
    );
  }
}

// POST - Add progress update
export async function POST(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const { goalId } = params;
    const body = await request.json();
    const { value, notes } = body ?? {};

    if (!goalId || typeof goalId !== 'string') {
      return NextResponse.json(
        { error: 'goalId is required' },
        { status: 400 }
      );
    }

    if (
      value === undefined ||
      value === null ||
      !Number.isFinite(Number(value))
    ) {
      return NextResponse.json(
        { error: 'value must be a number' },
        { status: 400 }
      );
    }

    // First, verify the goal exists and get current value
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: { currentValue: true },
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    const numValue = Number(value);

    // Create update and update goal's current value in a transaction
    const [update, updatedGoal] = await prisma.$transaction([
      prisma.goalUpdate.create({
        data: {
          goalId,
          value: numValue,
          notes: notes?.trim() || null,
        },
      }),
      prisma.goal.update({
        where: { id: goalId },
        data: {
          currentValue: {
            increment: numValue, // Add the update value to current value
          },
        },
        include: {
          _count: {
            select: { updates: true },
          },
        },
      }),
    ]);

    return NextResponse.json(
      { data: { update, goal: updatedGoal } },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('POST /api/goals/[goalId]/updates error', err);
    if (err.code === 'P2025') {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create update' },
      { status: 500 }
    );
  }
}
