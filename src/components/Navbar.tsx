"use client";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);
  const initials = useMemo(() => {
    const name = user?.displayName || user?.email || "";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user]);

  const onLogout = async () => {
    try {
      await signOut();
      router.replace("/signin");
    } catch {
      // ignore
    }
  };

  return (
  <nav className="flex justify-between items-center px-8 py-4 bg-white/30 backdrop-blur-lg border-b border-white/40 relative z-50">
      <Link href="/" className="text-2xl font-bold text-blue-700">Smart Mails</Link>
      <div className="flex gap-4">
        {!user ? (
          <>
            <Link
              href="/signin"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 font-medium hover:bg-blue-50 transition"
            >
              Signup
            </Link>
          </>
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="h-10 w-10 rounded-full bg-white/70 border border-white/60 shadow-inner flex items-center justify-center cursor-pointer"
              aria-label="Profile menu"
            >
              <span className="text-sm font-bold text-blue-700">{initials || "👤"}</span>
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-lg overflow-hidden z-50">
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                >
                  Profile
                </Link>
                <button
                  onClick={() => { setOpen(false); onLogout(); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
