const admin = require("firebase-admin");
const path = require("path");

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(process.env.HOME, ".keys", "mhma-firebase.json");
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const firestore = admin.firestore();
const auth = admin.auth();

async function syncUsers() {
  const authUsers = {};
  let nextPageToken;

  do {
    const result = await auth.listUsers(1000, nextPageToken);
    result.users.forEach(function(u) {
      authUsers[u.uid] = {
        email: u.email,
        displayName: u.displayName,
        phone: u.phoneNumber,
        createdAt: u.metadata.creationTime
      };
    });
    nextPageToken = result.pageToken;
  } while (nextPageToken);
  console.log("Found " + Object.keys(authUsers).length + " users in Auth");

  const snap = await firestore.collection("users").get();
  const fsUsers = new Set();
  snap.forEach(function(doc) { fsUsers.add(doc.id); });
  console.log("Found " + fsUsers.size + " user docs in Firestore");

  let created = 0;
  for (const uid in authUsers) {
    if (fsUsers.has(uid)) continue;
    const data = authUsers[uid];
    const name = data.displayName || (data.email ? data.email.split("@")[0] : "User");
    const nameParts = name.split(" ");
    await firestore.collection("users").doc(uid).set({
      email: data.email || "",
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      displayName: name,
      phone: data.phone || "",
      role: "member",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    created++;
    console.log("Created Firestore doc for Auth user: " + (data.email || uid));
  }

  let orphaned = 0;
  for (const uid of fsUsers) {
    if (authUsers[uid]) continue;
    console.log("WARNING: Orphaned Firestore user doc (no Auth user): " + uid);
    orphaned++;
  }

  console.log("\nSync complete: " + created + " created, " + orphaned + " orphaned docs found");
}

syncUsers().catch(console.error);
