"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { auth } from "./firebase-client";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase-client";

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isBoardMember: boolean;
  isLoggedIn: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isBoardMember: false,
  isLoggedIn: false,
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid: string): Promise<{ role: string; displayName: string }> => {
    try {
      const docSnap = await getDoc(doc(db, "users", uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          role: data.role || "member",
          displayName: data.displayName || data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : "",
        };
      }
    } catch (err) {
      console.warn("Auth: Firestore unavailable, skipping role fetch:", err);
    }
    return { role: "member", displayName: "" };
  };

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      const finish = () => { if (!cancelled) setLoading(false); };

      try {
        if (firebaseUser) {
          let idTokenResult;
          try {
            idTokenResult = await firebaseUser.getIdTokenResult();
          } catch (tokenErr) {
            console.warn("Auth: token fetch failed:", tokenErr);
          }

          const claimRole = idTokenResult?.claims?.role as string | undefined;
          let firestoreData: { role: string; displayName: string } = { role: "member", displayName: "" };
          try {
            firestoreData = await fetchUserData(firebaseUser.uid);
          } catch {}

          const role = claimRole || firestoreData.role || "member";
          const displayName = firebaseUser.displayName || firestoreData.displayName || null;

          if (!cancelled) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName,
              role,
            });
          }
        } else {
          if (!cancelled) setUser(null);
        }
      } catch (err) {
        console.error("Auth: unexpected error:", err);
        if (!cancelled) setUser(null);
      } finally {
        finish();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      let idTokenResult;
      try {
        idTokenResult = await auth.currentUser.getIdTokenResult(true);
      } catch {}
      const claimRole = idTokenResult?.claims?.role as string | undefined;
      let firestoreData = { role: "member", displayName: "" };
      try {
        firestoreData = await fetchUserData(auth.currentUser.uid);
      } catch {}
      const role = claimRole || firestoreData.role || "member";
      const displayName = auth.currentUser.displayName || firestoreData.displayName || null;
      setUser({
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName,
        role,
      });
    }
  };

  const isBoardMember = user?.role === "board_member" || user?.role === "administrator";

  return (
    <AuthContext.Provider value={{ user, loading, isBoardMember, isLoggedIn: !!user, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
