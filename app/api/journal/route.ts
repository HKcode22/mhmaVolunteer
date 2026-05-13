import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitCount = parseInt(searchParams.get('limit') || '50', 10);

    const snapshot = await firestore
      .collection('journal')
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get();

    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 });
  }
}
