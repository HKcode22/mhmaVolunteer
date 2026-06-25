import { NextRequest, NextResponse } from "next/server";
import { firestore, auth as adminAuth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const ALLOWED_KEYS = [
  "events",
  "programs",
  "rsvps",
  "enrollments",
  "donations",
  "pledges",
  "users",
  "news",
  "masjidConstruction",
  "subscribers",
  "contactSubmissions",
  "schedulingRequests",
  "volunteers",
  "testimonials",
  "activityLog",
  "journal",
  "inviteCodes",
  "faq",
  "aboutStats",
  "userSettings",
] as const;

type AllowedKey = (typeof ALLOWED_KEYS)[number];

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!m?.[1]) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(m[1]);
    const uid = decoded.uid;

    const body = await req.json().catch(() => ({} as any));
    const keysRaw = Array.isArray(body?.keys) ? body.keys : body?.keys ? [body.keys] : [];
    const keys: AllowedKey[] = (keysRaw as string[]).filter(k => ALLOWED_KEYS.includes(k as any)) as AllowedKey[];

    if (keys.length === 0) {
      return NextResponse.json({ error: "Missing/invalid keys" }, { status: 400 });
    }

    // Role guard: only board members should be able to trigger metadata invalidation.
    const userSnap = await firestore.collection("users").doc(uid).get();
    const role = userSnap.data()?.role;
    if (!["board_member", "administrator"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = Date.now();
    const update: Record<string, number> = { _updatedAt: now };
    for (const k of keys) update[k] = now;

    await firestore.collection("metadata").doc("cacheTimestamps").set(update, { merge: true });

    // Return the exact timestamp we wrote so the writer can sync `localStorage.{d,t,s}` and avoid extra refetches.
    return NextResponse.json({ success: true, updatedAt: now, keys });
  } catch (err: any) {
    console.error("metadata-timestamps-touch error:", err);
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}

