import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { activityId: string } }
) {
  try {
    const { activityId } = params;
    const body = await request.json();
    const { userId } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Check if the activity exists
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Check if the user has already liked this activity
    const existingLike = await prisma.activityLike.findUnique({
      where: {
        userId_activityId: {
          userId,
          activityId,
        },
      },
    });

    if (existingLike) {
      // Unlike: delete the like
      await prisma.activityLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      // Get updated like count
      const likeCount = await prisma.activityLike.count({
        where: { activityId },
      });

      return NextResponse.json({
        data: {
          isLiked: false,
          likeCount,
        },
      });
    } else {
      // Like: create a new like
      await prisma.activityLike.create({
        data: {
          userId,
          activityId,
        },
      });

      // Get updated like count
      const likeCount = await prisma.activityLike.count({
        where: { activityId },
      });

      return NextResponse.json({
        data: {
          isLiked: true,
          likeCount,
        },
      });
    }
  } catch (err: any) {
    console.error('POST /api/activities/[activityId]/like error', err);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
