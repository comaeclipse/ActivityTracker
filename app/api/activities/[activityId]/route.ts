import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { activityId: string } }
) {
  try {
    const { activityId } = params;

    // Requesting user — accept from query string or JSON body.
    let userId = request.nextUrl.searchParams.get('userId') ?? undefined;
    if (!userId) {
      const body = await request.json().catch(() => ({}));
      userId = body?.userId;
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { id: true, userId: true },
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Only the owner may delete their own activity.
    if (activity.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Remove the activity and everything that references it so nothing is left
    // orphaned. Likes cascade via the schema relation, but notifications point
    // at activityId with no FK — delete both explicitly to be safe. Everything
    // else (feed, stats, analytics, auditor calendars) is derived live from the
    // Activity table, so it recomputes correctly once the row is gone.
    await prisma.$transaction([
      prisma.activityLike.deleteMany({ where: { activityId } }),
      prisma.notification.deleteMany({ where: { activityId } }),
      prisma.activity.delete({ where: { id: activityId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/activities/[activityId] error', err);
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 });
  }
}
