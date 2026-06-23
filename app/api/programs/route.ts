import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitCount = parseInt(searchParams.get('limit') || '50', 10);

    const [programsSnap, enrollSnap] = await Promise.all([
      firestore.collection('programs').orderBy('createdAt', 'desc').limit(limitCount).get(),
      firestore.collection('enrollments').get(),
    ]);

    // Build enrollment count map: keyed by program title then slug
    const enrollmentCounts: Record<string, { total: number; approved: number; pending: number }> = {};
    enrollSnap.forEach(doc => {
      const d = doc.data();
      const key = d.program || 'unknown';
      if (!enrollmentCounts[key]) enrollmentCounts[key] = { total: 0, approved: 0, pending: 0 };
      enrollmentCounts[key].total++;
      if (d.status === 'approved' || d.status === 'completed') enrollmentCounts[key].approved++;
      else if (d.status === 'pending') enrollmentCounts[key].pending++;
    });

    const programs = programsSnap.docs.map(doc => {
      const data = doc.data();
      const counts = enrollmentCounts[data.title] || enrollmentCounts[data.slug] || { total: 0, approved: 0, pending: 0 };
      return { id: doc.id, ...data, enrollmentCount: counts.total, enrollmentApproved: counts.approved, enrollmentPending: counts.pending };
    });

    return NextResponse.json(programs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
  }
}
