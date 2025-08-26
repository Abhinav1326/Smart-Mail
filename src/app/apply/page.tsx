"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export default function ApplyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobDesc, setJobDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    recruiterEmail: string | null;
    recruiterName?: string | null;
    companyName?: string | null;
    jobRole?: string | null;
    jobLocation?: string | null;
    subject: string;
    body: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [toField, setToField] = useState("");
  const [subjectField, setSubjectField] = useState("");
  const [bodyField, setBodyField] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  // PDF upload removed; only text resume is supported
  // Text resume collection/edit state
  const [resumeInput, setResumeInput] = useState<string>("");
  const [savingResume, setSavingResume] = useState<boolean>(false);
  const [resumeSaveMsg, setResumeSaveMsg] = useState<string | null>(null);
  const [editingTextResume, setEditingTextResume] = useState<boolean>(false);
  // Attachment (PDF) state, cached per-user so they don't re-upload while logged in
  const [resume, setResume] = useState<{
    filename: string;
    contentBase64: string;
    contentType: string;
    size: number;
  } | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [loading, user, router]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setProfile(data);
          if (data?.resumeText && typeof data.resumeText === "string") {
            // Prefill editor in case user wants to edit
            setResumeInput(data.resumeText);
          }
        }
      } catch {
        // ignore profile fetch failure
      }
    };
    loadProfile();
  }, [user]);

  // Load cached attachment when user logs in
  useEffect(() => {
    try {
      if (!user) return;
      const key = `resumeAttachment:${user.uid}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.filename && parsed.contentBase64) setResume(parsed);
      }
    } catch {}
  }, [user]);

  // Persist attachment to cache per-user
  useEffect(() => {
    try {
      if (!user) return;
      const key = `resumeAttachment:${user.uid}`;
      if (resume) localStorage.setItem(key, JSON.stringify(resume));
      else localStorage.removeItem(key);
    } catch {}
  }, [resume, user]);

  // Simple PDF selection for attachment only (no parsing)
  const onResumeSelected = async (file: File) => {
    setResumeError(null);
    if (!file) return;
    if (file.type !== "application/pdf") {
      setResumeError("Only PDF files are allowed.");
      return;
    }
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxBytes) {
      setResumeError("File too large. Please upload a PDF under 5MB.");
      return;
    }
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          try {
            const result = r.result as string;
            resolve(result.includes(",") ? result.split(",")[1] : result);
          } catch (e) {
            reject(e);
          }
        };
        r.onerror = () => reject(new Error("Failed to read file"));
        r.readAsDataURL(file);
      });
      setResume({
        filename: file.name,
        contentBase64: base64,
        contentType: file.type || "application/pdf",
        size: file.size,
      });
    } catch {
      setResumeError("Failed to read file.");
    }
  };


  const hasStoredResume: boolean = !!(profile?.resumeText && typeof profile.resumeText === "string" && profile.resumeText.trim().length > 0);

  const saveTextResume = async () => {
    if (!user) return;
    const value = resumeInput.trim();
    if (!value) {
      setResumeSaveMsg("Please paste your resume text first");
      return;
    }
    setSavingResume(true);
    setResumeSaveMsg(null);
    try {
      const ref = doc(db, "users", user.uid);
      await setDoc(ref, { resumeText: value }, { merge: true });
      setProfile((prev: any) => ({ ...(prev || {}), resumeText: value }));
      setEditingTextResume(false);
      setResumeSaveMsg("Saved");
    } catch (e: any) {
      setResumeSaveMsg(e?.message || "Failed to save");
    } finally {
      setSavingResume(false);
      setTimeout(() => setResumeSaveMsg(null), 2500);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (jobDesc.trim().length === 0) return;
      const resumeTextForAnalysis =
        (typeof profile?.resumeText === "string" && profile?.resumeText?.trim()?.length
          ? profile?.resumeText
          : "") || undefined;
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: jobDesc,
          applicant: profile
            ? {
                name: profile.fullName || profile.username || user?.displayName || null,
                email: profile.contactEmail || user?.email || null,
                phone: profile.phone || null,
                github: profile.github || null,
                linkedin: profile.linkedin || null,
                portfolio: profile.portfolio || null,
              }
            : null,
          resumeText: resumeTextForAnalysis,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Request failed");
      const data = await res.json();
      setResult(data);
      setToField(data.recruiterEmail || "");
      setSubjectField(data.subject || "");
      setBodyField(data.body || "");

      try {
        if (user) {
          await addDoc(collection(db, "applications"), {
            userId: user.uid,
            companyName: data.companyName || null,
            jobRole: data.jobRole || null,
            jobLocation: data.jobLocation || null,
            recruiterName: data.recruiterName || null,
            recruiterEmail: data.recruiterEmail || null,
            subject: data.subject || null,
            jobDescription: jobDesc,
            createdAt: serverTimestamp(),
          });
        }
      } catch {}
    } finally {
      setSubmitting(false);
    }
  };

  const sendMail = async () => {
    setSendStatus("Sending...");
    setSending(true);
    try {
      const to = toField.trim();
      const subject = subjectField.trim();
      const body = bodyField;
      const maybeHtml = /<\s*([a-z]+)([^>]*)>/i.test(body) ? body : undefined;
      if (!to || !subject || !body) {
        setSendStatus("❌ Please provide recipient email, subject, and body");
        return;
      }
      const payload: any = { to, subject, body: maybeHtml ? undefined : body, html: maybeHtml };
      // If user saved mailSender details, include them so server can decrypt and use per-user creds
      if (profile?.mailSender?.email && profile?.mailSender?.password?.cipher && profile?.mailSender?.password?.iv && profile?.mailSender?.password?.tag) {
        payload.fromEmail = profile.mailSender.email;
        payload.mailPassword = {
          cipher: profile.mailSender.password.cipher,
          iv: profile.mailSender.password.iv,
          tag: profile.mailSender.password.tag,
        };
      }
      if (resume) {
        payload.attachments = [
          {
            filename: resume.filename,
            content: resume.contentBase64,
            encoding: "base64",
            contentType: resume.contentType,
          },
        ];
      }
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSendStatus("✅ Email Sent!");
      } else {
        const err = await res.json();
        setSendStatus("❌ Failed: " + (err?.error || "Unknown error"));
      }
    } catch (e: any) {
      setSendStatus("❌ Failed: " + (e?.message || "Unexpected error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e6ebf0] text-gray-800">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Apply with AI</h1>
    <p className="mt-2 text-gray-600">Add your resume text, analyze the job description, and send a polished email.</p>
        </div>

  {/* Resume (Text) collection: only ask if not already saved, but allow editing */}
        {!hasStoredResume || editingTextResume ? (
          <section className="mb-8 rounded-2xl p-6 sm:p-8 bg-[#e6ebf0] shadow-[12px_12px_24px_#c9cdd3,-12px_-12px_24px_#ffffff]">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your Resume (Text)</h2>
            <p className="text-sm text-gray-600 mb-4">Paste your resume content. We'll store it securely in your profile for future applications.</p>
            <textarea
              value={resumeInput}
              onChange={(e) => setResumeInput(e.target.value)}
              rows={10}
              placeholder="Paste plain text of your resume here…"
              className="w-full rounded-xl bg-[#e6ebf0] text-gray-900 placeholder-gray-500 p-4 outline-none border-0 shadow-[inset_8px_8px_16px_#c9cdd3,inset_-8px_-8px_16px_#ffffff] focus:shadow-[inset_10px_10px_20px_#c9cdd3,inset_-10px_-10px_20px_#ffffff] font-mono text-sm"
            />
            <div className="mt-4 flex items-center gap-3 justify-end">
              {hasStoredResume && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTextResume(false);
                    setResumeInput(typeof profile?.resumeText === "string" ? profile.resumeText : "");
                  }}
                  className="rounded-xl px-4 py-2 text-gray-700 bg-[#e6ebf0] shadow-[6px_6px_12px_#c9cdd3,-6px_-6px_12px_#ffffff] hover:shadow-[8px_8px_16px_#c9cdd3,-8px_-8px_16px_#ffffff]"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={saveTextResume}
                disabled={savingResume}
                className="rounded-xl px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 shadow-[6px_6px_12px_#c9cdd3,-6px_-6px_12px_#ffffff]"
              >
                {savingResume ? "Saving…" : hasStoredResume ? "Save Changes" : "Save Resume"}
              </button>
            </div>
            {resumeSaveMsg && <p className="mt-2 text-sm text-gray-700">{resumeSaveMsg}</p>}
          </section>
        ) : (
          <section className="mb-8 rounded-2xl p-6 sm:p-8 bg-[#e6ebf0] shadow-[12px_12px_24px_#c9cdd3,-12px_-12px_24px_#ffffff]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">Attach Resume (PDF)</h2>
                <p className="mt-1 text-sm text-gray-600">We'll use your saved resume text for analysis. Upload a PDF once to attach to outgoing emails.</p>
                <div className="mt-4 space-y-3">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onResumeSelected(file);
                    }}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                  {resumeError && <p className="text-sm text-red-600">{resumeError}</p>}
                  {resume ? (
                    <div className="flex items-center justify-between rounded-xl bg-[#e6ebf0] p-3 shadow-[inset_6px_6px_12px_#c9cdd3,inset_-6px_-6px_12px_#ffffff]">
                      <div className="text-sm text-gray-800">
                        <p className="font-medium">{resume.filename}</p>
                        <p className="text-gray-600">{(resume.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResume(null)}
                        className="rounded-lg px-3 py-1 text-sm font-medium text-gray-700 bg-[#e6ebf0] shadow-[6px_6px_12px_#c9cdd3,-6px_-6px_12px_#ffffff] hover:shadow-[8px_8px_16px_#c9cdd3,-8px_-8px_16px_#ffffff] active:shadow-[inset_6px_6px_12px_#c9cdd3,inset_-6px_-6px_12px_#ffffff]"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No resume attached yet.</p>
                  )}
                </div>
                {typeof profile?.resumeText === "string" && profile.resumeText.trim().length > 0 && (
                  <p className="mt-3 text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">{profile.resumeText.slice(0, 300)}{profile.resumeText.length > 300 ? "…" : ""}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditingTextResume(true)}
                className="self-start rounded-xl px-4 py-2 text-gray-700 bg-[#e6ebf0] shadow-[6px_6px_12px_#c9cdd3,-6px_-6px_12px_#ffffff] hover:shadow-[8px_8px_16px_#c9cdd3,-8px_-8px_16px_#ffffff]"
              >
                Edit Text
              </button>
            </div>
          </section>
        )}

  {hasStoredResume && (
          <section className="mt-8 rounded-2xl p-6 sm:p-8 bg-[#e6ebf0] shadow-[12px_12px_24px_#c9cdd3,-12px_-12px_24px_#ffffff]">
            <form onSubmit={onSubmit} className="space-y-6">
              <label htmlFor="jobDesc" className="block text-sm font-semibold text-gray-700">
                Job Description
              </label>
              <textarea
                id="jobDesc"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={12}
                className="w-full resize-y rounded-xl bg-[#e6ebf0] text-gray-900 placeholder-gray-500 p-4 outline-none border-0 shadow-[inset_8px_8px_16px_#c9cdd3,inset_-8px_-8px_16px_#ffffff] focus:shadow-[inset_10px_10px_20px_#c9cdd3,inset_-10px_-10px_20px_#ffffff] transition-shadow"
                required
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setJobDesc("");
                    setResult(null);
                    setError(null);
                  }}
                  className="rounded-xl px-5 py-2 text-gray-700 bg-[#e6ebf0] shadow-[6px_6px_12px_#c9cdd3,-6px_-6px_12px_#ffffff] hover:shadow-[8px_8px_16px_#c9cdd3,-8px_-8px_16px_#ffffff] active:shadow-[inset_6px_6px_12px_#c9cdd3,inset_-6px_-6px_12px_#ffffff] transition-shadow"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={submitting || jobDesc.trim().length === 0}
                  className="rounded-xl px-6 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 shadow-[6px_6px_12px_#c9cdd3,-6px_-6px_12px_#ffffff]"
                >
                  {submitting ? "Processing…" : "Continue"}
                </button>
              </div>
            </form>
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </section>
        )}

        {result && (
          <section className="mt-8 rounded-2xl p-6 sm:p-8 bg-[#e6ebf0] shadow-[12px_12px_24px_#c9cdd3,-12px_-12px_24px_#ffffff]">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Draft Email</h2>
            <div className="grid gap-4">
              <div className="rounded-xl p-4 bg-[#e6ebf0] shadow-[inset_6px_6px_12px_#c9cdd3,inset_-6px_-6px_12px_#ffffff]">
                <p className="text-sm text-gray-600">Recruiter Email</p>
                <p className="font-medium text-gray-900">{result?.recruiterEmail || "Not found"}</p>
              </div>
              <div className="rounded-xl p-4 bg-[#e6ebf0] shadow-[inset_6px_6px_12px_#c9cdd3,inset_-6px_-6px_12px_#ffffff]">
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-medium text-gray-900">{result?.subject}</p>
              </div>
              <div className="rounded-xl p-4 bg-[#e6ebf0] shadow-[inset_6px_6px_12px_#c9cdd3,inset_-6px_-6px_12px_#ffffff]">
                <p className="text-sm text-gray-600 mb-1">Body (preview)</p>
                <div className="prose prose-sm max-w-none text-gray-900" dangerouslySetInnerHTML={{ __html: result?.body || "" }} />
              </div>
            </div>
          </section>
        )}

        {result && (
          <section className="mt-8 rounded-2xl p-6 sm:p-8 bg-[#e6ebf0] shadow-[12px_12px_24px_#c9cdd3,-12px_-12px_24px_#ffffff]">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Review & Send</h2>
            <div className="grid gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To</label>
                <input
                  type="email"
                  value={toField}
                  onChange={(e) => setToField(e.target.value)}
                  placeholder="recruiter@example.com"
                  className="w-full rounded-xl bg-[#e6ebf0] p-3 outline-none border-0 shadow-[inset_6px_6px_12px_#c9cdd3,inset_-6px_-6px_12px_#ffffff] focus:shadow-[inset_8px_8px_16px_#c9cdd3,inset_-8px_-8px_16px_#ffffff]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={subjectField}
                  onChange={(e) => setSubjectField(e.target.value)}
                  className="w-full rounded-xl bg-[#e6ebf0] p-3 outline-none border-0 shadow-[inset_6px_6px_12px_#c9cdd3,inset_-6px_-6px_12px_#ffffff] focus:shadow-[inset_8px_8px_16px_#c9cdd3,inset_-8px_-8px_16px_#ffffff]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Body</label>
                <textarea
                  rows={10}
                  value={bodyField}
                  onChange={(e) => setBodyField(e.target.value)}
                  placeholder="Edit the HTML or plain text body here"
                  className="w-full rounded-xl bg-[#e6ebf0] p-4 outline-none border-0 shadow-[inset_6px_6px_12px_#c9cdd3,inset_-6px_-6px_12px_#ffffff] focus:shadow-[inset_8px_8px_16px_#c9cdd3,inset_-8px_-8px_16px_#ffffff] whitespace-pre-wrap font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Attached Resume</label>
                {resume ? (
                  <div className="flex items-center justify-between rounded-xl bg-[#e6ebf0] p-3 shadow-[inset_6px_6px_12px_#c9cdd3,inset_-6px_-6px_12px_#ffffff]">
                    <div className="text-sm text-gray-800">
                      <p className="font-medium">{resume.filename}</p>
                      <p className="text-gray-600">{(resume.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResume(null)}
                      className="rounded-lg px-3 py-1 text-sm font-medium text-gray-700 bg-[#e6ebf0] shadow-[6px_6px_12px_#c9cdd3,-6px_-6px_12px_#ffffff] hover:shadow-[8px_8px_16px_#c9cdd3,-8px_-8px_16px_#ffffff] active:shadow-[inset_6px_6px_12px_#c9cdd3,inset_-6px_-6px_12px_#ffffff]"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No resume attached. Upload above in the Attach Resume section.</p>
                )}
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={sendMail}
                  disabled={sending}
                  className="rounded-xl px-6 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 shadow-[6px_6px_12px_#c9cdd3,-6px_-6px_12px_#ffffff]"
                >
                  {sending ? "Sending…" : "Send Email"}
                </button>
              </div>
              {sendStatus && <p className="text-sm text-gray-700">{sendStatus}</p>}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
