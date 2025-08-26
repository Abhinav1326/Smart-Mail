"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export default function SignUpPage() {
  const { signUp, user, signInWithGoogle } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (user) router.replace("/apply");
  }, [user, router]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const saveProfile = async (uid: string) => {
    const ref = doc(db, "users", uid);
    const data = {
      uid,
      username: username.trim() || null,
      fullName: fullName.trim(),
      contactEmail: (contactEmail.trim() || email.trim()),
      phone: phone.trim(),
      github: github.trim() || null,
      linkedin: linkedin.trim() || null,
      portfolio: portfolio.trim() || null,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, data, { merge: true });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (password !== confirm) throw new Error("Passwords do not match");
      if (!username.trim()) throw new Error("Username is required");
      if (!fullName.trim()) throw new Error("Full name is required");
      if (!phone.trim()) throw new Error("Mobile number is required");
      // contactEmail optional; fall back to account email when saving

      const u = await signUp(email, password, fullName.trim());
      await saveProfile(u.uid);
      router.push("/apply");
    } catch (e: any) {
      setError(e?.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };
  const onGoogle = async () => {
    setError(null);
    setGLoading(true);
    try {
      const u = await signInWithGoogle();
      // Save whatever profile fields are provided; fallback to provider data
      if (!fullName.trim() && u.displayName) setFullName(u.displayName);
      if (!contactEmail.trim() && u.email) setContactEmail(u.email);
      await saveProfile(u.uid);
      router.push("/apply");
    } catch (e: any) {
      setError(e?.message || "Google sign-in failed");
    } finally {
      setGLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl shadow p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
              <Image alt="logo" src="/vercel.svg" width={28} height={28} />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Create account</h1>
            <p className="text-gray-500 text-sm">Join Smartmail in seconds</p>
          </div>

          <button
            onClick={onGoogle}
            disabled={gLoading}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-white text-[#4285F4] font-bold">G</span>
            {gLoading ? "Connecting…" : "Continue with Google"}
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-500">or</span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                required
              />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              required
            />
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Contact email (if different)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Mobile number"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              required
            />
            <input
              type="url"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="GitHub URL"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
            <input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="LinkedIn URL"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
            <input
              type="url"
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              placeholder="Portfolio URL (optional)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 chars)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              required
              minLength={6}
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Creating…" : "Create account"}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <p className="mt-5 text-center text-sm text-gray-600">
            Already have an account? <Link className="text-blue-600 hover:underline" href="/signin">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
