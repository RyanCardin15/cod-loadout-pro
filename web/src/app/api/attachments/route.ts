import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/firebase/admin';
import { logger } from '@/lib/logger';
import { handleApiError, validateQuery } from '@/lib/utils/validation';
import { attachmentQuerySchema } from '@/lib/validation/schemas';

// Force dynamic rendering to prevent static generation during build
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const { slot, weaponId, limit } = validateQuery(request, attachmentQuerySchema);

    let attachmentQuery: any = db().collection('attachments');

    // Apply filters
    if (slot) {
      attachmentQuery = attachmentQuery.where('slot', '==', slot);
    }
    if (weaponId) {
      attachmentQuery = attachmentQuery.where('weaponId', '==', weaponId);
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
    return handleApiError(error);
  }
}
