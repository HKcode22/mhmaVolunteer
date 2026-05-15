import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

// Trim env vars to prevent embedded newlines/spaces from corrupting Firebase URLs
const trim = (s: string | undefined) => (s || "").trim();

const firebaseConfig = {
  apiKey: trim(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: trim(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: trim(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: trim(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: trim(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: trim(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false,
});

export default app;
