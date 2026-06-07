"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-client";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Bell, Mail, Globe, Shield } from "lucide-react";
import Navigation from "@/app/components/Navigation";
import PageBanner from "@/app/components/PageBanner";

interface UserSettings {
  notifyOnNewEvents: boolean;
  notifyOnNewPrograms: boolean;
  notifyOnNews: boolean;
  notifyOnRsvpReminders: boolean;
}

const defaultSettings: UserSettings = {
  notifyOnNewEvents: true,
  notifyOnNewPrograms: true,
  notifyOnNews: true,
  notifyOnRsvpReminders: true,
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    loadSettings();
  }, [user, authLoading]);

  async function loadSettings() {
    try {
      const snap = await getDoc(doc(db, "userSettings", user!.uid));
      if (snap.exists()) {
        setSettings({ ...defaultSettings, ...snap.data() });
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await setDoc(doc(db, "userSettings", user!.uid), settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save settings", e);
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <>
        <Navigation />
        <PageBanner title="Settings" />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-mhma-forest" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <PageBanner title="Settings" />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-mhma-gold" />
                Email Notification Preferences
              </h2>
              <p className="text-sm text-gray-500 mt-1">Choose which emails you receive from MHMA.</p>
            </div>
            <div className="px-6 py-4 space-y-4">
              {[
                { key: "notifyOnNewEvents", label: "New Events", desc: "When a new event is posted" },
                { key: "notifyOnNewPrograms", label: "New Programs", desc: "When a new program is announced" },
                { key: "notifyOnNews", label: "News Updates", desc: "When news articles are published" },
                { key: "notifyOnRsvpReminders", label: "RSVP Reminders", desc: "Reminders for events you've RSVP'd to" },
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-start gap-3 py-2 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={(settings as any)[key]}
                      onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-mhma-forest peer-checked:border-mhma-forest transition-colors flex items-center justify-center">
                      {(settings as any)[key] && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-mhma-forest transition-colors">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div>
                {saved && <span className="text-sm text-green-600">Preferences saved!</span>}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-mhma-forest text-white rounded-md hover:bg-mhma-forest-light disabled:opacity-50 transition-colors text-sm font-medium flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-6">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-mhma-gold" />
                Account
              </h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Address</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Display Name</p>
                  <p className="text-xs text-gray-500">{user?.displayName || "Not set"}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Manage your profile info and password on the{" "}
                <a href="/profile" className="text-mhma-forest hover:underline font-medium">Profile page</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
