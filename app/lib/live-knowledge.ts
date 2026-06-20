import {
  fetchEvents, fetchPrograms, fetchEnrollments, fetchRSVPs,
  fetchDonations, fetchPledges, fetchContactSubmissions,
  fetchSchedulingRequests, fetchUsers, fetchSubscribers
} from '@/lib/firebase';

export interface LiveData {
  events: string;
  programs: string;
  enrollments: string;
  rsvps: string;
  donations: string;
  pledges: string;
  contacts: string;
  scheduling: string;
  users: string;
  subscribers: string;
}

let cached: LiveData | null = null;
let lastFetch = 0;
const CACHE_TTL = 30000; // 30 seconds

function fmt(val: any, fallback = 'N/A'): string {
  return val != null && val !== '' ? String(val) : fallback;
}

export async function fetchLiveData(): Promise<LiveData> {
  const now = Date.now();
  if (cached && now - lastFetch < CACHE_TTL) return cached;

  const [
    eventsSnap, programsSnap, enrollmentsSnap, rsvpsSnap,
    donationsSnap, pledgesSnap, contactsSnap, schedulingSnap,
    usersSnap, subscribersSnap
  ] = await Promise.all([
    fetchEvents(10).catch(() => []),
    fetchPrograms(10).catch(() => []),
    fetchEnrollments(50).catch(() => []),
    fetchRSVPs(50).catch(() => []),
    fetchDonations(50).catch(() => []),
    fetchPledges(50).catch(() => []),
    fetchContactSubmissions(50).catch(() => []),
    fetchSchedulingRequests(50).catch(() => []),
    fetchUsers(50).catch(() => []),
    fetchSubscribers(50).catch(() => []),
  ]);

  // Calculate aggregates
  const totalDonations = donationsSnap.reduce((sum: number, d: any) => sum + ((d.amount || 0) / 100), 0);
  const pendingEnrollments = enrollmentsSnap.filter((e: any) => e.status === 'pending').length;
  const approvedEnrollments = enrollmentsSnap.filter((e: any) => e.status === 'approved').length;
  const pendingRsvps = rsvpsSnap.filter((r: any) => r.status === 'pending').length;
  const approvedRsvps = rsvpsSnap.filter((r: any) => r.status === 'approved').length;
  const pendingPledges = pledgesSnap.filter((p: any) => p.status === 'pending').length;
  const fulfilledPledges = pledgesSnap.filter((p: any) => p.status === 'fulfilled').length;
  const unreadContacts = contactsSnap.filter((c: any) => !c.read).length;
  const pendingScheduling = schedulingSnap.filter((s: any) => s.status === 'pending').length;
  const activeSubscribers = subscribersSnap.filter((s: any) => s.status === 'active').length;
  const boardMembers = usersSnap.filter((u: any) => u.role === 'board_member' || u.role === 'administrator').length;

  // Format events
  const eventsText = eventsSnap.length > 0
    ? eventsSnap.slice(0, 5).map((e: any) =>
        `"${fmt(e.title)}" | ${fmt(e.date)} ${fmt(e.time)} | ${fmt(e.status)} | RSVPs: ${e.rsvpCount ?? 0}`
      ).join('\n')
    : 'No upcoming events.';

  // Format programs  
  const programsText = programsSnap.length > 0
    ? programsSnap.slice(0, 5).map((p: any) =>
        `"${fmt(p.title)}" | ${fmt(p.schedule)} | Capacity: ${p.capacity ?? 'unlimited'} | Enrolled: ${p.enrolled ?? 0} | ${fmt(p.status)}`
      ).join('\n')
    : 'No active programs.';

  const data: LiveData = {
    events: eventsText,
    programs: programsText,
    enrollments: `Total: ${enrollmentsSnap.length} | Pending: ${pendingEnrollments} | Approved: ${approvedEnrollments}`,
    rsvps: `Total: ${rsvpsSnap.length} | Pending: ${pendingRsvps} | Approved: ${approvedRsvps}`,
    donations: `Total donations: ${donationsSnap.length} | Total amount: $${totalDonations.toLocaleString()}`,
    pledges: `Total: ${pledgesSnap.length} | Pending: ${pendingPledges} | Fulfilled: ${fulfilledPledges}`,
    contacts: `Total: ${contactsSnap.length} | Unread: ${unreadContacts}`,
    scheduling: `Total: ${schedulingSnap.length} | Pending: ${pendingScheduling}`,
    users: `Total: ${usersSnap.length} | Board members: ${boardMembers}`,
    subscribers: `Total: ${subscribersSnap.length} | Active: ${activeSubscribers}`,
  };

  cached = data;
  lastFetch = now;
  return data;
}

export function formatLiveContext(data: LiveData): string {
  return [
    `Events:\n${data.events}`,
    `Programs:\n${data.programs}`,
    `Enrollments: ${data.enrollments}`,
    `RSVPs: ${data.rsvps}`,
    `Donations: ${data.donations}`,
    `Pledges: ${data.pledges}`,
    `Contact submissions: ${data.contacts}`,
    `Scheduling requests: ${data.scheduling}`,
    `Users: ${data.users}`,
    `Subscribers: ${data.subscribers}`,
  ].join('\n\n');
}

export function clearLiveCache(): void {
  cached = null;
  lastFetch = 0;
}
