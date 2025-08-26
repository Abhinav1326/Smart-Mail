"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Image from "next/image";

export default function SignInPage() {
  const { signIn, user, signInWithGoogle } = useAuth();
  const router = useRouter();
  useEffect(() => {
  if (user) router.replace("/apply");
  }, [user, router]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
  await signIn(email, password);
  router.push("/apply");
    } catch (e: any) {
      setError(e?.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setGLoading(true);
    try {
  await signInWithGoogle();
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
            <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 text-sm">Sign in to your account</p>
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
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <p className="mt-5 text-center text-sm text-gray-600">
            No account? <Link className="text-blue-600 hover:underline" href="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
