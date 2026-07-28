import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo');
    const userId = formData.get('userId');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'A workout screenshot is required.' }, { status: 400 });
    }
    if (typeof userId !== 'string' || !userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
    }
    if (!ACCEPTED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Please upload a JPG, PNG, or WebP image.' }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'The compressed image must be smaller than 4 MB.' }, { status: 400 });
    }

    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeUserId) {
      return NextResponse.json({ error: 'userId is invalid.' }, { status: 400 });
    }

    const blob = await put(`workout-screenshots/${safeUserId}/${crypto.randomUUID()}.${extension}`, file, {
      access: 'public',
      contentType: file.type,
      addRandomSuffix: false,
    });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (error) {
    console.error('POST /api/workout-photo error', error);
    return NextResponse.json(
      { error: 'Unable to upload the workout screenshot. Please try again.' },
      { status: 500 },
    );
  }
}
