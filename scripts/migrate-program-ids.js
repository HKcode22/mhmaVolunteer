const admin = require("firebase-admin");
const path = require("path");

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(process.env.HOME, ".keys", "mhma-firebase.json");
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const firestore = admin.firestore();

async function migrateProgramIds() {
  const snap = await firestore.collection("programs").get();
  let migrated = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const slug = data.slug || data.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!slug || doc.id === slug) continue;

    console.log(`Migrating: ${doc.id} -> ${slug} (${data.title || "untitled"})`);

    // Copy data to new slug-based doc
    await firestore.collection("programs").doc(slug).set({
      ...data,
      slug,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update version references
    const versionsSnap = await firestore
      .collection("versions")
      .where("targetType", "==", "program")
      .where("targetId", "==", doc.id)
      .get();

    const versionUpdates = [];
    versionsSnap.forEach(v => versionUpdates.push(v.ref.update({ targetId: slug })));

    if (versionUpdates.length > 0) {
      await Promise.all(versionUpdates);
      console.log(`  Updated ${versionUpdates.length} version references`);
    }

    // Delete old doc
    await firestore.collection("programs").doc(doc.id).delete();
    migrated++;
  }

  console.log(`\nMigration complete: ${migrated} programs migrated to slug-based IDs`);
}

migrateProgramIds().catch(console.error);
