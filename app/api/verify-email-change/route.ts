import { NextRequest, NextResponse } from "next/server";
import { auth as adminAuth, firestore } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const token = searchParams.get("token");
    const type = searchParams.get("type");

    if (!token || !type || !["old", "new"].includes(type)) {
      return new Response(
        `<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f0e8">
          <div style="text-align:center;padding:40px;background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
            <h2 style="color:#c9a227;">Invalid Link</h2>
            <p style="color:#6b7280;">This verification link is invalid or malformed.</p>
          </div>
        </body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    // Find the pending change doc matching this token
    const snapshot = await firestore
      .collection("pendingEmailChanges")
      .where(type === "old" ? "oldToken" : "newToken", "==", token)
      .where("expiresAt", ">=", new Date().toISOString())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return new Response(
        `<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f0e8">
          <div style="text-align:center;padding:40px;background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
            <h2 style="color:#c9a227;">Link Expired or Invalid</h2>
            <p style="color:#6b7280;">This verification link has expired or is no longer valid. Please request a new email change from your profile.</p>
          </div>
        </body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    const doc = snapshot.docs[0];
    const data = doc.data() as any;
    const docRef = firestore.collection("pendingEmailChanges").doc(doc.id);

    // If already approved, skip
    const alreadyDone = type === "old" ? data.oldApproved : data.newApproved;
    if (!alreadyDone) {
      await docRef.update({ [type === "old" ? "oldApproved" : "newApproved"]: true });
    }

    // Re-read to check if both are now approved
    const updatedSnap = await docRef.get();
    const updated = updatedSnap.data() as any;
    const bothApproved = updated.oldApproved && updated.newApproved;

    if (bothApproved) {
      try {
        await adminAuth.updateUser(data.uid, { email: data.newEmail });
        await firestore.collection("users").doc(data.uid).set({ email: data.newEmail }, { merge: true });
        // Clean up pending doc
        await docRef.delete();
      } catch (err: any) {
        console.error("Failed to update email after both verifications:", err);
        return new Response(
          `<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f0e8">
            <div style="text-align:center;padding:40px;background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
              <h2 style="color:#c9a227;">Error</h2>
              <p style="color:#6b7280;">Both emails were verified but the update failed. Please contact the board.</p>
              <p style="color:#ef4444;font-size:14px;">${err.message}</p>
            </div>
          </body></html>`,
          { status: 500, headers: { "Content-Type": "text/html" } }
        );
      }
    }

    const status = bothApproved ? "complete" : "pending";

    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Email Verification</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f0e8;margin:0">
  <div style="text-align:center;padding:40px;background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);max-width:480px">
    <div style="font-size:48px;margin-bottom:16px">
      ${status === "complete" ? "✅" : type === "old" ? "✅" : "⏳"}
    </div>
    <h2 style="color:#1C2A20;margin-bottom:8px">
      ${status === "complete" ? "Email Change Complete!" :
        type === "old" ? "Old Email Approved" : "New Email Verified"}
    </h2>
    <p style="color:#6b7280;line-height:1.6">
      ${status === "complete"
        ? `Your email has been changed from <strong>${data.oldEmail}</strong> to <strong>${data.newEmail}</strong>. You can now log in with your new email.`
        : type === "old"
        ? `You've approved changing <strong>${data.oldEmail}</strong> to <strong>${data.newEmail}</strong>. The change will complete once you also click the verification link sent to your new email address.`
        : `You've verified <strong>${data.newEmail}</strong>. The change will complete once the approval link in your old email (${data.oldEmail}) is also clicked.`
      }
    </p>
    ${status === "complete"
      ? `<a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/login" style="display:inline-block;background-color:#c9a227;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:16px">Go to Login</a>`
      : ""
    }
  </div>
</body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (err: any) {
    console.error("verify-email-change error:", err);
    return new Response(
      `<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f0e8">
        <div style="text-align:center;padding:40px;background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
          <h2 style="color:#c9a227;">Error</h2>
          <p style="color:#6b7280;">Something went wrong. Please try again or contact the board.</p>
        </div>
      </body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}
