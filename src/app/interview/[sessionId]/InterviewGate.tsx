"use client";

import { useState } from "react";
import { IconLock, IconLoader2 } from "@tabler/icons-react";
import InterviewRoom from "./InterviewRoom";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type SessionData = {
  session_id: string;
  candidate_name: string;
  status: string;
  config: {
    name: string;
    duration_minutes: number;
    question_count: number;
    programming_languages: string[];
  };
} | null;

export default function InterviewGate({
  sessionId,
  candidateName,
  configName,
}: {
  sessionId: string;
  candidateName: string;
  configName: string;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!pin.trim()) {
      setError("Please enter your PIN.");
      return;
    }
    if (pin.length !== 6) {
      setError("PIN must be 6 digits.");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch(`${API_URL}/interviews/sessions/${sessionId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionData({
          session_id: data.session_id,
          candidate_name: data.candidate_name,
          status: data.status,
          config: data.config,
        });
        setVerified(true);
      } else {
        const err = await res.json().catch(() => ({ detail: "Verification failed" }));
        setError(typeof err.detail === "string" ? err.detail : "Verification failed");
      }
    } catch {
      setError("Could not reach server. Please try again.");
    }
    setVerifying(false);
  };

  if (verified && sessionData) {
    return <InterviewRoom sessionId={sessionId} sessionData={sessionData} />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,153,153,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <span
            className="gradient-text inline-block mb-4"
            style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            SViam
          </span>
          <h1
            className="text-[var(--text)] mb-1"
            style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Join Interview
          </h1>
          {candidateName && (
            <p className="text-sm text-[var(--teal)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 500 }}>
              {candidateName}
            </p>
          )}
          <p className="text-xs text-[var(--muted2)] mt-1" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            {configName}
          </p>
        </div>

        <div
          className="p-6 rounded-[20px]"
          style={{ background: "var(--card)", border: "1px solid var(--border2)" }}
        >
          <p className="text-xs text-[var(--muted2)] text-center mb-5" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            Enter the PIN shared by your interviewer to begin.
          </p>

          <form onSubmit={handleVerify} className="space-y-3">
            <div className="relative">
              <IconLock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted)" }}
              />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full py-3 pl-10 pr-4 rounded-[12px] text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--teal)] tracking-[0.2em]"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  fontFamily: "var(--font-dm-mono)",
                  color: "var(--text)",
                }}
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 text-center" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3.5 rounded-[12px] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-60"
              style={{
                background: "var(--teal)",
                fontFamily: "var(--font-dm-sans)",
                boxShadow: "0 4px 20px rgba(0,153,153,0.25)",
              }}
            >
              {verifying ? (
                <><IconLoader2 size={16} className="animate-spin" /> Verifying...</>
              ) : (
                "Enter Interview"
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-[0.6rem] text-[var(--muted)] leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)" }}>
          Your camera, microphone, and screen will be monitored during this interview.
          Tab switches and eye movement are tracked.
        </p>
      </div>
    </main>
  );
}
