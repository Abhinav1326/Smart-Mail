"use client";
import React, { useEffect, useMemo, useState } from "react";
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
  const [mailAppPassword, setMailAppPassword] = useState("");
  const [showMailPwd, setShowMailPwd] = useState(false);
  const [verifyingPwd, setVerifyingPwd] = useState(false);
  const [pwdStatus, setPwdStatus] = useState<string | null>(null);
  const [showAppPwdHelp, setShowAppPwdHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const cleanedAppPass = useMemo(() => mailAppPassword.replace(/\s+/g, ""), [mailAppPassword]);
  const isFormValid = useMemo(() => {
    return (
      fullName.trim().length > 0 &&
      username.trim().length > 0 &&
      email.trim().length > 0 &&
      contactEmail.trim().length > 0 &&
      cleanedAppPass.length === 16 &&
      phone.trim().length > 0 &&
      github.trim().length > 0 &&
      linkedin.trim().length > 0 &&
      password.length >= 6 &&
      confirm.length >= 6 &&
      password === confirm
    );
  }, [fullName, username, email, contactEmail, cleanedAppPass, phone, github, linkedin, password, confirm]);

  const saveProfile = async (uid: string) => {
    const ref = doc(db, "users", uid);
    let encryptedMailPass: { encrypted: string; iv: string; tag: string } | null = null;
    if (mailAppPassword.trim()) {
      // Encrypt server-side via API to avoid exposing key in client
      const res = await fetch("/api/encrypt-mailpass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: mailAppPassword.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to encrypt mail password");
      }
      const enc = await res.json();
      encryptedMailPass = { encrypted: enc.encrypted, iv: enc.iv, tag: enc.tag };
    }

    const data: any = {
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
    if (encryptedMailPass) {
      data.mailSender = {
        email: (contactEmail.trim() || email.trim()),
        password: {
          cipher: encryptedMailPass.encrypted,
          iv: encryptedMailPass.iv,
          tag: encryptedMailPass.tag,
          alg: "AES-256-GCM",
          keyVersion: 1,
        },
        updatedAt: serverTimestamp(),
      };
    }
    await setDoc(ref, data, { merge: true });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
  if (!fullName.trim()) throw new Error("Full name is required");
  if (!username.trim()) throw new Error("Username is required");
  if (!email.trim()) throw new Error("Email is required");
  if (!contactEmail.trim()) throw new Error("Contact email is required");
  if (cleanedAppPass.length !== 16) throw new Error("Google App Password must be 16 characters");
  if (!phone.trim()) throw new Error("Mobile number is required");
  if (!github.trim()) throw new Error("GitHub URL is required");
  if (!linkedin.trim()) throw new Error("LinkedIn URL is required");
  if (password.length < 6) throw new Error("Password must be at least 6 characters");
  if (password !== confirm) throw new Error("Passwords do not match");

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
    <>
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
            <div>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Contact email (if different)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the email address you want to send mails from (this will be used as the sender address).
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type={showMailPwd ? "text" : "password"}
                  value={mailAppPassword}
                  onChange={(e) => {
                    setMailAppPassword(e.target.value);
                    setPwdStatus(null);
                  }}
                  placeholder="Google App Password for the above email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowMailPwd((s) => !s)}
                  className="shrink-0 rounded-md border border-gray-300 bg-white p-2 text-xs text-gray-700 hover:bg-gray-50"
                  aria-label={showMailPwd ? "Hide password" : "Show password"}
                >
                  {showMailPwd ? (
                    // Eye-off icon
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M3 3l18 18" />
                      <path d="M10.58 10.58a2 2 0 102.83 2.83" />
                      <path d="M9.88 4.24A10.94 10.94 0 0112 4c7 0 10 8 10 8a13.39 13.39 0 01-4.62 5.68" />
                      <path d="M6.35 6.35A13.39 13.39 0 002 12s3 8 10 8a10.94 10.94 0 004.12-.78" />
                    </svg>
                  ) : (
                    // Eye icon
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                This is the 16-character Google App Password for the sender email. It will be encrypted before storing.
              </p>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowAppPwdHelp(true)}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  aria-haspopup="dialog"
                  aria-expanded={showAppPwdHelp}
                >
                  How to get this?
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    verifyingPwd ||
                    !((contactEmail.trim() || email.trim())) ||
                    cleanedAppPass.length !== 16
                  }
                  onClick={async () => {
                    setVerifyingPwd(true);
                    setPwdStatus(null);
                    try {
                      const res = await fetch("/api/verify-mailpass", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: (contactEmail.trim() || email.trim()), password: cleanedAppPass }),
                      });
                      const json = await res.json();
                      if (json?.ok) setPwdStatus("✅ Password verified");
                      else setPwdStatus("❌ " + (json?.error || "Could not verify"));
                    } catch (e: any) {
                      setPwdStatus("❌ " + (e?.message || "Verification failed"));
                    } finally {
                      setVerifyingPwd(false);
                    }
                  }}
                  className="rounded-md bg-gray-100 px-3 py-1.5 text-xs text-gray-800 hover:bg-gray-200 disabled:opacity-60"
                >
                  {verifyingPwd ? "Verifying…" : "Verify password"}
                </button>
                {pwdStatus && <span className="text-xs text-gray-700">{pwdStatus}</span>}
              </div>
            </div>
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
              required
            />
            <input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="LinkedIn URL"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              required
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
              disabled={loading || !isFormValid}
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
      {showAppPwdHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="appPwdHelpTitle"
          onClick={() => setShowAppPwdHelp(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="appPwdHelpTitle" className="text-lg font-semibold text-gray-900">
                  How to generate a Google App Password
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Use this 16‑character password with Gmail SMTP in Nodemailer. It&apos;s different from your normal password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAppPwdHelp(false)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
                aria-label="Close"
              >
                Close
              </button>
            </div>
            <ol className="mt-4 list-decimal pl-5 space-y-2 text-sm text-gray-800">
              <li>
                Go to
                {" "}
                <a
                  href="https://myaccount.google.com/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google Account › Security
                </a>
              </li>
              <li>
                Under <span className="font-medium">Signing in to Google</span>, ensure
                {" "}
                <span className="font-medium">2‑Step Verification</span> is turned on.
              </li>
              <li>
                Click <span className="font-medium">App passwords</span> (it appears only after 2‑Step Verification is enabled).
              </li>
              <li>
                For <span className="font-medium">Select app</span>, choose <span className="font-medium">Mail</span>.
                For <span className="font-medium">Select device</span>, choose your device or <span className="font-medium">Other</span> and name it (e.g., "Smartmail").
              </li>
              <li>
                Click <span className="font-medium">Generate</span>, copy the 16‑character password (no spaces), and paste it into the
                {" "}
                <span className="font-medium">Google App Password</span> field on this form.
              </li>
            </ol>
            <div className="mt-4 rounded-md bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-800">
              If you don&apos;t see App passwords, your account may be managed by an organization or 2‑Step Verification isn&apos;t enabled.
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <a
                href="https://support.google.com/accounts/answer/185833"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Google Help: App passwords
              </a>
              <button
                type="button"
                onClick={() => setShowAppPwdHelp(false)}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
