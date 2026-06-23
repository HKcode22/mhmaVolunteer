import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitCount = parseInt(searchParams.get('limit') || '50', 10);

    const [eventsSnap, rsvpsSnap] = await Promise.all([
      firestore.collection('events').orderBy('createdAt', 'desc').limit(limitCount).get(),
      firestore.collection('rsvps').get(),
    ]);

    // Build RSVP count map: keyed by event title then event id
    const rsvpCounts: Record<string, { total: number; confirmed: number; pending: number }> = {};
    rsvpsSnap.forEach(doc => {
      const d = doc.data();
      const key = d.eventTitle || d.eventId || 'unknown';
      if (!rsvpCounts[key]) rsvpCounts[key] = { total: 0, confirmed: 0, pending: 0 };
      rsvpCounts[key].total++;
      if (d.status === 'confirmed') rsvpCounts[key].confirmed++;
      else if (d.status === 'pending') rsvpCounts[key].pending++;
    });

    const events = eventsSnap.docs.map(doc => {
      const data = doc.data();
      const counts = rsvpCounts[data.title] || rsvpCounts[doc.id] || { total: 0, confirmed: 0, pending: 0 };
      return { id: doc.id, ...data, rsvpCount: counts.total, rsvpConfirmed: counts.confirmed, rsvpPending: counts.pending };
    });

    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
