"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { motion } from "framer-motion";

type Profile = {
  username?: string | null;
  fullName?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  github?: string | null;
  linkedin?: string | null;
  portfolio?: string | null;
};

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile>({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applications, setApplications] = useState<
    Array<{ id: string; companyName?: string | null; jobRole?: string | null; jobLocation?: string | null; recruiterEmail?: string | null }>
  >([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const selectedApp = useMemo(() => applications.find((a) => a.id === confirmId), [applications, confirmId]);

  const initials = useMemo(() => {
    const name = profile.fullName || user?.displayName || user?.email || "";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [profile.fullName, user]);

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [loading, user, router]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data() as any;
          setProfile({
            username: d.username || null,
            fullName: d.fullName || user.displayName || null,
            contactEmail: d.contactEmail || user.email || null,
            phone: d.phone || null,
            github: d.github || null,
            linkedin: d.linkedin || null,
            portfolio: d.portfolio || null,
          });
        } else {
          setProfile({ fullName: user.displayName || null, contactEmail: user.email || null });
        }
      } catch {
        // ignore
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    const loadApps = async () => {
      if (!user) return;
      setAppsLoading(true);
      try {
        // Use simple equality filter to avoid requiring a composite index; sort client-side.
        const q = query(collection(db, "applications"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        // Sort by createdAt desc if present
        rows.sort((a: any, b: any) => {
          const at = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bt = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bt - at;
        });
        setApplications(rows.slice(0, 10));
        setAppsError(null);
      } catch (e: any) {
        setApplications([]);
        setAppsError(e?.message || "Failed to load applications");
      } finally {
        setAppsLoading(false);
      }
    };
    loadApps();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { ...profile, updatedAt: serverTimestamp(), createdAt: serverTimestamp() },
        { merge: true }
      );
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const deleteApplication = async (id: string) => {
    if (!id) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "applications", id));
      setApplications((prev) => prev.filter((a) => a.id !== id));
      setConfirmId(null);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  const linkItems: Array<{ key: keyof Profile; label: string; value: string | null | undefined }> = [
    { key: "portfolio", label: "Portfolio", value: profile.portfolio },
    { key: "github", label: "GitHub", value: profile.github },
    { key: "linkedin", label: "LinkedIn", value: profile.linkedin },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-100 text-gray-900">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-r from-blue-400 to-yellow-300 opacity-25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-gradient-to-r from-purple-400 to-pink-300 opacity-25 blur-3xl" />

      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
        <motion.section
          className="rounded-2xl p-6 sm:p-8 bg-white/30 backdrop-blur-xl border border-white/40 mb-8 shadow-lg shadow-black/[0.03]"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <motion.button
                  onClick={() => setIsEditing(true)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-gray-900 bg-white/60 border border-white/70 hover:bg-white/80 backdrop-blur-xl shadow-sm cursor-pointer"
                >
                  <svg className="h-4 w-4 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                  <span>Edit</span>
                </motion.button>
              ) : (
                <>
                  <motion.button
                    onClick={() => setIsEditing(false)}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-gray-900 bg-white/60 border border-white/70 hover:bg-white/80 backdrop-blur-xl shadow-sm cursor-pointer"
                  >
                    <svg className="h-4 w-4 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                    <span>Cancel</span>
                  </motion.button>
                  <motion.button
                    onClick={saveProfile}
                    disabled={saving}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-105 disabled:opacity-60 shadow cursor-pointer"
                  >
                    <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    <span>{saving ? "Saving…" : "Save"}</span>
                  </motion.button>
                </>
              )}
              <motion.button
                onClick={async () => { await signOut(); router.replace("/signin"); }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-red-600 bg-white/60 border border-white/70 hover:bg-white/80 backdrop-blur-xl shadow-sm cursor-pointer"
              >
                <svg className="h-4 w-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
                <span>Logout</span>
              </motion.button>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center text-center">
            <div className="relative">
              <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-gradient-to-tr from-blue-400/40 via-indigo-400/30 to-pink-400/30 blur-xl" />
              <div className="h-24 w-24 rounded-full bg-white/60 backdrop-blur-xl border border-white/60 flex items-center justify-center text-2xl font-bold text-blue-700 shadow-inner">
                {initials || "👤"}
              </div>
            </div>

            {!isEditing ? (
              <h1 className="mt-4 text-2xl font-extrabold text-gray-900">{profile.fullName || "Unnamed"}</h1>
            ) : (
              <input
                type="text"
                value={profile.fullName || ""}
                onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                className="mt-4 w-full max-w-sm rounded-xl bg-white/50 backdrop-blur-xl border border-white/60 p-3 outline-none text-gray-900 placeholder-gray-700 focus:ring-2 focus:ring-blue-500/40"
                placeholder="Full name"
              />
            )}

            {!isEditing ? (
              <p className="mt-1 text-gray-800">{profile.contactEmail || user.email}</p>
            ) : (
              <input
                type="email"
                value={profile.contactEmail || ""}
                onChange={(e) => setProfile((p) => ({ ...p, contactEmail: e.target.value }))}
                className="mt-2 w-full max-w-sm rounded-xl bg-white/50 backdrop-blur-xl border border-white/60 p-3 outline-none text-gray-900 placeholder-gray-700 focus:ring-2 focus:ring-blue-500/40"
                placeholder="Contact email"
              />
            )}

            {!isEditing ? (
              <p className="text-gray-800">{profile.phone || "Add mobile number"}</p>
            ) : (
              <input
                type="tel"
                value={profile.phone || ""}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                className="mt-2 w-full max-w-sm rounded-xl bg-white/50 backdrop-blur-xl border border-white/60 p-3 outline-none text-gray-900 placeholder-gray-700 focus:ring-2 focus:ring-blue-500/40"
                placeholder="Mobile number"
              />
            )}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl">
              {linkItems.map((item) => (
                <motion.div
                  key={item.key as string}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  viewport={{ once: true, amount: 0.3 }}
                  className="rounded-xl p-4 bg-white/30 backdrop-blur-xl border border-white/40 flex items-center justify-between gap-3 hover:bg-white/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white/60 border border-white/70 grid place-items-center">
                      {item.label === "GitHub" && (
                        <svg className="h-4 w-4 text-gray-900" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.35-1.76-1.35-1.76-1.1-.75.08-.74.08-.74 1.22.09 1.86 1.25 1.86 1.25 1.08 1.85 2.83 1.31 3.52 1 .11-.79.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.16 0 0 1-.32 3.3 1.23a11.4 11.4 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.64.24 2.86.12 3.16.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.93.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z"/></svg>
                      )}
                      {item.label === "LinkedIn" && (
                        <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.6c0-1.34-.03-3.06-1.87-3.06-1.88 0-2.17 1.47-2.17 2.98v5.68H9.31V9h3.41v1.56h.05c.47-.88 1.62-1.81 3.34-1.81 3.57 0 4.23 2.35 4.23 5.4v6.3ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm-1.77 13.02h3.55V9H3.57v11.45Z"/></svg>
                      )}
                      {item.label === "Portfolio" && (
                        <svg className="h-4 w-4 text-purple-600" viewBox="0 0 24 24" fill="currentColor"><path d="M3 7a2 2 0 0 1 2-2h3V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v2H3V7Zm0 4h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7Zm11-6V4h-4v1h4Z"/></svg>
                      )}
                    </div>
                    <span className="font-semibold text-gray-900">{item.label}</span>
                  </div>
                  {!isEditing ? (
                    item.value ? (
                      <a className="text-blue-700 hover:underline" href={item.value} target="_blank" rel="noreferrer">Open</a>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )
                  ) : (
                    <input
                      type="url"
                      value={item.value || ""}
                      onChange={(e) => setProfile((p) => ({ ...p, [item.key]: e.target.value }))}
                      placeholder={`${item.label} URL`}
                      className="w-48 rounded-xl bg-white/50 backdrop-blur-xl border border-white/60 p-2 outline-none text-gray-900 placeholder-gray-700 focus:ring-2 focus:ring-blue-500/40"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="rounded-2xl p-6 sm:p-8 bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg shadow-black/[0.03]"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Applied history</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-gray-800">
                  <th className="py-2 px-3 border-b border-white/40">Company</th>
                  <th className="py-2 px-3 border-b border-white/40">Job role</th>
                  <th className="py-2 px-3 border-b border-white/40">Location</th>
                  <th className="py-2 px-3 border-b border-white/40">Recruiter email</th>
                  <th className="py-2 px-3 border-b border-white/40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appsLoading ? (
                  <tr>
                    <td className="py-3 px-3 text-gray-700" colSpan={5}>Loading…</td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td className="py-3 px-3 text-gray-600" colSpan={5}>
                      No applications yet{appsError ? ` — ${appsError}` : ""}
                    </td>
                  </tr>
                ) : (
                  applications.map((a) => (
                    <tr key={a.id} className="text-gray-900">
                      <td className="py-2 px-3 border-b border-white/40">{a.companyName || "—"}</td>
                      <td className="py-2 px-3 border-b border-white/40">{a.jobRole || "—"}</td>
                      <td className="py-2 px-3 border-b border-white/40">{a.jobLocation || "—"}</td>
                      <td className="py-2 px-3 border-b border-white/40">{a.recruiterEmail || "—"}</td>
                      <td className="py-2 px-3 border-b border-white/40 text-right">
                        <motion.button
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setConfirmId(a.id)}
                          disabled={deletingId === a.id}
                          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-red-600/90 hover:bg-red-600 disabled:opacity-60 cursor-pointer"
                        >
                          {deletingId === a.id ? "Deleting…" : "Delete"}
                        </motion.button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.section>
        {confirmId && (
          <div className="fixed inset-0 z-50">
            <motion.div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full max-w-sm rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg p-6"
              >
                <h3 className="text-lg font-bold text-gray-900">Delete application?</h3>
                <p className="mt-2 text-sm text-gray-700">
                  {selectedApp?.companyName || "This record"} ({selectedApp?.jobRole || "Role"}) will be permanently removed.
                </p>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setConfirmId(null)}
                    className="rounded-lg px-4 py-2 text-gray-900 bg-white/60 border border-white/70 hover:bg-white/80 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => confirmId && deleteApplication(confirmId)}
                    disabled={deletingId === confirmId}
                    className="rounded-lg px-4 py-2 font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 cursor-pointer"
                  >
                    {deletingId === confirmId ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
