import { firestore } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ALL_COLLECTIONS = [
  'events', 'programs', 'rsvps', 'enrollments', 'donations',
  'pledges', 'users', 'news', 'masjidConstruction', 'subscribers',
  'contactSubmissions', 'schedulingRequests', 'volunteers',
  'testimonials', 'activityLog', 'journal', 'inviteCodes', 'faq',
  'aboutStats', 'userSettings',
];

export async function GET() {
  const doc = await firestore.collection('metadata').doc('cacheTimestamps').get();
  if (!doc.exists) {
    const now = Date.now();
    const initial: Record<string, number> = {};
    ALL_COLLECTIONS.forEach(c => { initial[c] = now; });
    initial._updatedAt = now;
    await firestore.collection('metadata').doc('cacheTimestamps').set(initial);
    return NextResponse.json(initial);
  }
  return NextResponse.json(doc.data());
}
