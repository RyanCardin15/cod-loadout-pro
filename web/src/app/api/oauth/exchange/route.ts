import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to exchange authorization code with user information
 *
 * This is called by the authorization page after successful Google Sign-In
 * to associate the authorization code with the Firebase user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId, idToken, email, displayName, photoURL } = body;

    if (!code || !userId || !idToken) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Store the association between authorization code and user
    // This would typically be stored in a database or cache
    // For now, we'll use Vercel KV or send it to the backend

    const backendUrl = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3001';

    const response = await fetch(`${backendUrl}/api/oauth/associate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        userId,
        idToken,
        email,
        displayName,
        photoURL,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to associate authorization code');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Exchange error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
