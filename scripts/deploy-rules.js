const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!serviceAccountBase64) {
  console.error("FIREBASE_SERVICE_ACCOUNT_BASE64 not set");
  console.error("Run: export FIREBASE_SERVICE_ACCOUNT_BASE64=$(base64 -i ~/.keys/mhma-firebase.json | tr -d '\\n')");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  Buffer.from(serviceAccountBase64, "base64").toString("utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const rulesPath = path.join(__dirname, "..", "firestore.rules");
const rulesSource = fs.readFileSync(rulesPath, "utf8");

admin.securityRules().releaseFirestoreRulesetFromSource(rulesSource)
  .then(() => {
    console.log("Firestore rules deployed successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Failed to deploy rules:", err);
    process.exit(1);
  });
