"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  IconUpload,
  IconSparkles,
  IconCheck,
  IconArrowRight,
  IconDownload,
  IconFileText,
} from "@tabler/icons-react";
import {
  parseResume,
  tailorResume,
  generateCoverLetter,
  generatePdf,
} from "@/lib/api";
import type { ResumeData, TailorChange } from "@/lib/api";

type Step = "upload" | "tailoring" | "results";

export default function ResumeTailor({
  jobTitle,
  company,
  city,
  jobDescription,
}: {
  jobTitle: string;
  company: string;
  city: string;
  jobDescription: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [tailoredResume, setTailoredResume] = useState<ResumeData | null>(null);
  const [changes, setChanges] = useState<TailorChange[]>([]);
  const [coverLetter, setCoverLetter] = useState("");
  const [coverLoading, setCoverLoading] = useState(false);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsSignedIn(!!data.session);
      if (data.session) setToken(data.session.access_token);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session);
      if (session) setToken(session.access_token);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are accepted.");
      return;
    }
    if (!token) {
      setError("Please sign in to tailor your resume.");
      return;
    }
    setError("");
    setLoading(true);
    setStep("tailoring");
    try {
      const parsed = await parseResume(token, file);
      setResumeData(parsed);
      const result = await tailorResume(token, {
        resume: parsed,
        job_description: jobDescription || `${jobTitle} at ${company}`,
      });
      setTailoredResume(result.tailored_resume);
      setChanges(result.changes);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to tailor resume");
      setStep("upload");
    } finally {
      setLoading(false);
    }
  };

  const handleCoverLetter = async () => {
    if (!token || !resumeData) return;
    setCoverLoading(true);
    try {
      const resumeText = [
        resumeData.summary,
        ...resumeData.experience.map(
          (e) => `${e.title} at ${e.company}: ${e.bullets.join(". ")}`
        ),
        resumeData.skills.join(", "),
      ].join("\n");
      const result = await generateCoverLetter(token, {
        resume_text: resumeText,
        job_title: jobTitle,
        company,
        city,
        job_description: jobDescription,
      });
      setCoverLetter(result.cover_letter);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate cover letter"
      );
    } finally {
      setCoverLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!token || !tailoredResume) return;
    try {
      const blob = await generatePdf(token, tailoredResume);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-${company.toLowerCase().replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to download PDF"
      );
    }
  };

  // Not signed in — prompt
  if (!isSignedIn) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <div
          className="w-14 h-14 rounded-[14px] flex items-center justify-center mb-4"
          style={{
            background: "rgba(99,102,241,0.1)",
            color: "var(--teal)",
          }}
        >
          <IconSparkles size={24} />
        </div>
        <h3
          className="text-[var(--text)] text-base font-semibold mb-2"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Tailor your resume for this role
        </h3>
        <p
          className="text-sm text-[var(--muted2)] mb-5 max-w-xs"
          style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
        >
          Sign in to get AI-powered resume suggestions matched to this job
          description.
        </p>
        <button
          onClick={() => {
            supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: { prompt: "select_account" },
              },
            });
          }}
          className="px-6 py-2.5 rounded-[10px] text-sm font-medium text-white"
          style={{
            background: "var(--teal)",
            fontFamily: "var(--font-dm-sans)",
            boxShadow: "0 0 20px rgba(0,153,153,0.3)",
          }}
        >
          Sign in to get started
        </button>
      </div>
    );
  }

  // Upload step
  if (step === "upload") {
    return (
      <div className="h-full flex flex-col px-5 py-6">
        <div className="mb-4">
          <h3
            className="text-[var(--text)] text-sm font-semibold mb-1"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
          >
            Tailor Resume
          </h3>
          <p
            className="text-xs text-[var(--muted2)]"
            style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
          >
            Upload your resume and we&apos;ll optimize it for this specific role.
          </p>
        </div>

        <div
          className="flex-1 flex flex-col items-center justify-center rounded-[14px] cursor-pointer transition-all duration-200 hover:border-[var(--teal)]"
          style={{
            background: "var(--surface)",
            border: "2px dashed var(--border)",
          }}
          onClick={() => inputRef.current?.click()}
        >
          <IconUpload
            size={28}
            className="mb-3"
            style={{ color: "var(--muted)" }}
          />
          <p
            className="text-sm font-medium text-[var(--text)] mb-1"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Drop resume here
          </p>
          <p
            className="text-xs text-[var(--muted)]"
            style={{ fontFamily: "var(--font-dm-mono)" }}
          >
            PDF only
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />
        </div>

        {error && (
          <p
            className="text-xs mt-3 text-center"
            style={{ color: "#ef4444", fontFamily: "var(--font-dm-sans)" }}
          >
            {error}
          </p>
        )}

        {/* Quick benefits */}
        <div className="mt-4 space-y-2">
          {[
            "Keyword optimization for ATS",
            "Skills alignment with JD",
            "AI cover letter generation",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-xs text-[var(--muted2)]"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              <IconCheck
                size={12}
                style={{ color: "var(--teal)", flexShrink: 0 }}
              />
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Tailoring in progress
  if (step === "tailoring") {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <div
          className="w-10 h-10 rounded-full border-2 mb-4 spinner"
          style={{
            borderColor: "var(--border)",
            borderTopColor: "var(--teal)",
          }}
        />
        <p
          className="text-sm text-[var(--muted2)]"
          style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
        >
          Tailoring your resume for {company}...
        </p>
        <p
          className="text-xs text-[var(--muted)] mt-1"
          style={{ fontFamily: "var(--font-dm-mono)" }}
        >
          Analyzing JD, optimizing keywords
        </p>
      </div>
    );
  }

  // Results
  return (
    <div className="h-full flex flex-col px-5 py-6 overflow-y-auto">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <IconSparkles size={16} style={{ color: "var(--teal)" }} />
          <h3
            className="text-[var(--text)] text-sm font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Resume Tailored
          </h3>
        </div>
        <p
          className="text-xs text-[var(--muted2)]"
          style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
        >
          {changes.length} optimization{changes.length !== 1 ? "s" : ""} applied
          for {company}
        </p>
      </div>

      {/* Changes list */}
      <div className="space-y-3 mb-5 flex-1">
        {changes.map((change, i) => (
          <div
            key={i}
            className="p-3 rounded-[12px]"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="px-1.5 py-0.5 rounded text-[0.55rem] uppercase tracking-wider font-medium"
                style={{
                  background: "rgba(99,102,241,0.1)",
                  color: "var(--teal)",
                  fontFamily: "var(--font-dm-mono)",
                }}
              >
                {change.section}
              </span>
            </div>
            <p
              className="text-xs text-[var(--muted)] line-through mb-1"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              {change.original.slice(0, 80)}
              {change.original.length > 80 ? "..." : ""}
            </p>
            <p
              className="text-xs text-[var(--text)] mb-1"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              {change.updated.slice(0, 100)}
              {change.updated.length > 100 ? "..." : ""}
            </p>
            <p
              className="text-[0.6rem] text-[var(--muted)]"
              style={{ fontFamily: "var(--font-dm-sans)", fontStyle: "italic" }}
            >
              {change.reason}
            </p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="space-y-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <button
          onClick={handleDownloadPdf}
          className="w-full py-2.5 rounded-[10px] text-xs font-medium flex items-center justify-center gap-2 text-white"
          style={{
            background: "var(--teal)",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          <IconDownload size={14} /> Download Tailored Resume
        </button>

        {!coverLetter ? (
          <button
            onClick={handleCoverLetter}
            disabled={coverLoading}
            className="w-full py-2.5 rounded-[10px] text-xs font-medium flex items-center justify-center gap-2 transition-colors hover:text-[var(--text)]"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--muted2)",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            {coverLoading ? (
              <>
                <div
                  className="w-3 h-3 rounded-full border border-[var(--border)] spinner"
                  style={{ borderTopColor: "var(--teal)" }}
                />
                Generating...
              </>
            ) : (
              <>
                <IconFileText size={14} /> Generate Cover Letter
              </>
            )}
          </button>
        ) : (
          <div
            className="p-3 rounded-[12px] max-h-48 overflow-y-auto"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p
              className="text-[0.55rem] text-[var(--muted)] uppercase tracking-wider mb-1"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              Cover Letter
            </p>
            <p
              className="text-xs text-[var(--muted2)] whitespace-pre-line"
              style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
            >
              {coverLetter}
            </p>
          </div>
        )}

        <button
          onClick={() => {
            setStep("upload");
            setResumeData(null);
            setTailoredResume(null);
            setChanges([]);
            setCoverLetter("");
            setError("");
          }}
          className="w-full py-2 text-xs text-[var(--muted)] hover:text-[var(--muted2)] transition-colors flex items-center justify-center gap-1"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          <IconArrowRight size={12} /> Try another resume
        </button>
      </div>

      {error && (
        <p
          className="text-xs mt-2 text-center"
          style={{ color: "#ef4444", fontFamily: "var(--font-dm-sans)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
