import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const logs = await prisma.weightLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: logs });
  } catch (err: any) {
    console.error('GET /api/weight error', err);
    return NextResponse.json({ error: 'Failed to load weight logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, weight, unit = 'lbs', isPublic = false } = body ?? {};
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    const w = Number(weight);
    if (!Number.isFinite(w)) {
      return NextResponse.json({ error: 'weight must be a number' }, { status: 400 });
    }

    const created = await prisma.weightLog.create({
      data: { userId, weight: w, unit, isPublic: Boolean(isPublic) },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/weight error', err);
    return NextResponse.json({ error: 'Failed to create weight log' }, { status: 500 });
  }
}

