"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { invalidateCache } from "@/lib/cache-manager";
import { useAuth } from "@/lib/auth-context";

export type Theme = "light" | "dark" | "night";

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "light", setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("mhma-theme") as Theme | null;
    if (stored) setThemeState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark" || theme === "night") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("mhma-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "userSettings", user.uid)).then((snap) => {
      if (snap.exists() && snap.data().theme) {
        setThemeState(snap.data().theme as Theme);
      }
    }).catch(() => {});
  }, [user]);

  async function setTheme(t: Theme) {
    setThemeState(t);
    if (user) {
      try {
        await setDoc(doc(db, "userSettings", user.uid), { theme: t, updatedAt: serverTimestamp() }, { merge: true });
        invalidateCache('userSettings');
      } catch {}
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
