import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/firebase/admin';
import { validateLoadoutAttachments } from '@/lib/firebase/attachments';
import { validateLoadoutWeapons } from '@/lib/firebase/weapons';
import { logger } from '@/lib/logger';
import { detectXSSInObject, sanitizeLoadout } from '@/lib/security/sanitize';
import { validateIdParam } from '@/lib/validation/route-params';

// Force dynamic rendering to prevent static generation during build
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate route parameter
    const loadoutId = validateIdParam(params);
    if (loadoutId instanceof NextResponse) {
      return loadoutId;
    }

    const doc = await db().collection('loadouts').doc(loadoutId).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Loadout not found' },
        { status: 404 }
      );
    }

    const loadout = {
      id: doc.id,
      ...doc.data(),
    };

    return NextResponse.json({ loadout });
  } catch (error) {
    logger.apiError('GET', `/api/loadouts/${params.id}`, error);
    return NextResponse.json(
      { error: 'Failed to fetch loadout' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate route parameter
    const loadoutId = validateIdParam(params);
    if (loadoutId instanceof NextResponse) {
      return loadoutId;
    }

    await db().collection('loadouts').doc(loadoutId).delete();

    return NextResponse.json(
      { message: 'Loadout deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    logger.apiError('DELETE', `/api/loadouts/${params.id}`, error);
    return NextResponse.json(
      { error: 'Failed to delete loadout' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate route parameter
    const loadoutId = validateIdParam(params);
    if (loadoutId instanceof NextResponse) {
      return loadoutId;
    }

    const body = await request.json();

    // Detect XSS attempts for logging
    const xssDetection = detectXSSInObject(body);
    if (xssDetection.detected) {
      logger.apiError('PATCH', `/api/loadouts/${loadoutId}`, {
        message: 'XSS attempt detected',
        fields: xssDetection.fields,
      });
    }

    // Sanitize all user input
    const sanitizedData = sanitizeLoadout(body);

    // Validate weapon references if weapons are being updated
    if (sanitizedData.primary || sanitizedData.secondary) {
      const weaponValidation = await validateLoadoutWeapons(sanitizedData);
      if (!weaponValidation.valid) {
        return NextResponse.json(
          {
            error: 'Invalid weapon references',
            details: `The following weapon IDs do not exist: ${weaponValidation.invalidIds.join(', ')}`,
            invalidWeapons: weaponValidation.invalidIds,
          },
          { status: 400 }
        );
      }

      // Validate attachment references
      const attachmentValidation = await validateLoadoutAttachments(sanitizedData);
      if (!attachmentValidation.valid) {
        return NextResponse.json(
          {
            error: 'Invalid attachment references',
            details: `The following attachment IDs do not exist: ${attachmentValidation.invalidIds.join(', ')}`,
            invalidAttachments: attachmentValidation.invalidIds,
          },
          { status: 400 }
        );
      }
    }

    const updateData = {
      ...sanitizedData,
      updatedAt: new Date().toISOString(),
    };

    await db().collection('loadouts').doc(loadoutId).update(updateData);

    const updatedDoc = await db().collection('loadouts').doc(loadoutId).get();

    return NextResponse.json({
      loadout: { id: updatedDoc.id, ...updatedDoc.data() },
      message: 'Loadout updated successfully'
    });
  } catch (error) {
    logger.apiError('PATCH', `/api/loadouts/${params.id}`, error);
    return NextResponse.json(
      { error: 'Failed to update loadout' },
      { status: 500 }
    );
  }
}
