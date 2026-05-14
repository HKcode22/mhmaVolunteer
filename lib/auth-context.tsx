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

  const fetchUserRole = async (uid: string): Promise<string> => {
    try {
      const docSnap = await getDoc(doc(db, "users", uid));
      if (docSnap.exists()) {
        return docSnap.data().role || "member";
      }
    } catch (err) {
      console.warn("Auth: Firestore unavailable, skipping role fetch:", err);
    }
    return "member";
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
          let firestoreRole: string | undefined;
          try {
            firestoreRole = await fetchUserRole(firebaseUser.uid);
          } catch {}

          const role = claimRole || firestoreRole || "member";

          if (!cancelled) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
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
      const role = await fetchUserRole(auth.currentUser.uid);
      let idTokenResult;
      try {
        idTokenResult = await auth.currentUser.getIdTokenResult(true);
      } catch {}
      const customRole = idTokenResult?.claims?.role as string || role;
      setUser({
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        role: customRole,
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
