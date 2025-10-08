import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slot = searchParams.get('slot');
    const limit = parseInt(searchParams.get('limit') || '100');

    let attachmentQuery: any = db().collection('attachments');

    // Apply filters
    if (slot) {
      attachmentQuery = attachmentQuery.where('slot', '==', slot);
    }

    attachmentQuery = attachmentQuery.limit(limit);

    const snapshot = await attachmentQuery.get();
    const attachments = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ attachments });
  } catch (error) {
    logger.apiError('GET', '/api/attachments', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    );
  }
}
