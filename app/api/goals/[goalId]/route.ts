import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { GoalStatus } from '@prisma/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET - Fetch specific goal
export async function GET(
  request: Request,
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

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        updates: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { updates: true },
        },
      },
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: goal });
  } catch (err: any) {
    console.error('GET /api/goals/[goalId] error', err);
    return NextResponse.json(
      { error: 'Failed to fetch goal' },
      { status: 500 }
    );
  }
}

// PUT - Update goal
export async function PUT(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const { goalId } = params;
    const body = await request.json();
    const {
      title,
      description,
      goalType,
      targetValue,
      currentValue,
      unit,
      deadline,
      status,
    } = body ?? {};

    if (!goalId || typeof goalId !== 'string') {
      return NextResponse.json(
        { error: 'goalId is required' },
        { status: 400 }
      );
    }

    // Build update data object
    const updateData: any = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return NextResponse.json(
          { error: 'title must be a non-empty string' },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (goalType !== undefined) {
      const validTypes = ['INCREASE', 'DECREASE'];
      if (!validTypes.includes(goalType)) {
        return NextResponse.json(
          { error: `goalType must be one of ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.goalType = goalType;
    }

    if (targetValue !== undefined) {
      if (!Number.isFinite(Number(targetValue)) || Number(targetValue) <= 0) {
        return NextResponse.json(
          { error: 'targetValue must be a positive number' },
          { status: 400 }
        );
      }
      updateData.targetValue = Number(targetValue);
    }

    if (currentValue !== undefined) {
      if (!Number.isFinite(Number(currentValue)) || Number(currentValue) < 0) {
        return NextResponse.json(
          { error: 'currentValue must be a non-negative number' },
          { status: 400 }
        );
      }
      updateData.currentValue = Number(currentValue);
    }

    if (unit !== undefined) {
      if (typeof unit !== 'string' || unit.trim() === '') {
        return NextResponse.json(
          { error: 'unit must be a non-empty string' },
          { status: 400 }
        );
      }
      updateData.unit = unit.trim();
    }

    if (deadline !== undefined) {
      updateData.deadline = deadline ? new Date(deadline) : null;
    }

    if (status !== undefined) {
      const validStatuses: GoalStatus[] = ['ACTIVE', 'COMPLETED', 'ARCHIVED'];
      if (!validStatuses.includes(status as GoalStatus)) {
        return NextResponse.json(
          { error: `status must be one of ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    const goal = await prisma.goal.update({
      where: { id: goalId },
      data: updateData,
      include: {
        _count: {
          select: { updates: true },
        },
      },
    });

    return NextResponse.json({ data: goal });
  } catch (err: any) {
    console.error('PUT /api/goals/[goalId] error', err);
    if (err.code === 'P2025') {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

// DELETE - Delete goal
export async function DELETE(
  request: Request,
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

    await prisma.goal.delete({
      where: { id: goalId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/goals/[goalId] error', err);
    if (err.code === 'P2025') {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}
