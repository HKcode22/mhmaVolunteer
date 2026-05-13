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

  const fetchUserRole = async (uid: string) => {
    try {
      const docSnap = await getDoc(doc(db, "users", uid));
      if (docSnap.exists()) {
        return docSnap.data().role || "member";
      }
    } catch {}
    return "member";
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const role = await fetchUserRole(firebaseUser.uid);
        const idTokenResult = await firebaseUser.getIdTokenResult();
        const customRole = idTokenResult.claims.role as string || role;
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: customRole,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      const role = await fetchUserRole(auth.currentUser.uid);
      const idTokenResult = await auth.currentUser.getIdTokenResult(true);
      const customRole = idTokenResult.claims.role as string || role;
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
