import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitCount = parseInt(searchParams.get('limit') || '50', 10);

    const snapshot = await firestore
      .collection('programs')
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get();

    const programs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(programs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
  }
}
