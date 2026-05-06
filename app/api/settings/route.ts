import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// PATCH /api/settings — update username and/or visibility settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, username, hideFromCommunity, currentPassword, newPassword } = body ?? {};

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    // Handle username change
    if (username !== undefined) {
      const trimmed = username.trim();
      if (!trimmed || trimmed.length < 3) {
        return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
      }
      if (trimmed.length > 30) {
        return NextResponse.json({ error: 'Username must be 30 characters or less' }, { status: 400 });
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        return NextResponse.json({ error: 'Username may only contain letters, numbers, underscores, and hyphens' }, { status: 400 });
      }
      if (trimmed !== user.username) {
        const existing = await prisma.user.findUnique({ where: { username: trimmed } });
        if (existing) {
          return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
        }
        updateData.username = trimmed;
      }
    }

    // Handle community visibility toggle
    if (hideFromCommunity !== undefined) {
      updateData.hideFromCommunity = Boolean(hideFromCommunity);
    }

    // Handle password change
    if (newPassword !== undefined) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No changes made', user: { id: user.id, username: user.username, hideFromCommunity: user.hideFromCommunity } });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, username: true, createdAt: true, role: true, hideFromCommunity: true },
    });

    return NextResponse.json({ message: 'Settings updated', user: updated });
  } catch (err: any) {
    console.error('PATCH /api/settings error', err);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

// DELETE /api/settings — wipe history or delete account
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, password } = body ?? {};

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    if (!action || !['wipe_history', 'delete_account'].includes(action)) {
      return NextResponse.json({ error: 'action must be "wipe_history" or "delete_account"' }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: 'Password is required for this action' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    if (action === 'wipe_history') {
      // Delete all activities (cascades to likes), weight logs, and goals (cascades to updates)
      await prisma.$transaction([
        prisma.activityLike.deleteMany({ where: { userId } }),
        prisma.activity.deleteMany({ where: { userId } }),
        prisma.weightLog.deleteMany({ where: { userId } }),
        prisma.goal.deleteMany({ where: { userId } }),
      ]);
      return NextResponse.json({ message: 'History wiped successfully' });
    }

    if (action === 'delete_account') {
      // Delete user — cascades handle goals/activities via onDelete: Cascade
      // Handle activityLikes separately since they don't cascade from user
      await prisma.$transaction([
        prisma.activityLike.deleteMany({ where: { userId } }),
        prisma.activity.deleteMany({ where: { userId } }),
        prisma.weightLog.deleteMany({ where: { userId } }),
        prisma.goal.deleteMany({ where: { userId } }),
        prisma.user.delete({ where: { id: userId } }),
      ]);
      return NextResponse.json({ message: 'Account deleted successfully' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('DELETE /api/settings error', err);
    return NextResponse.json({ error: 'Failed to complete action' }, { status: 500 });
  }
}
