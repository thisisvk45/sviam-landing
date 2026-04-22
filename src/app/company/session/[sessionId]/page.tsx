"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
  IconArrowLeft,
  IconLoader2,
  IconCode,
  IconEye,
  IconBrowserCheck,
  IconClock,
  IconShieldCheck,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Scorecard = {
  overall_score: number;
  verdict: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  categories: Record<string, { score: number; feedback: string }>;
};

type TranscriptEntry = {
  role: string;
  content: string;
  timestamp: string;
  type?: string;
};

type SessionDetail = {
  id: string;
  candidate_name: string;
  candidate_email: string;
  status: string;
  scorecard: Scorecard | null;
  transcript: TranscriptEntry[];
  events: { type: string; timestamp: string; data?: Record<string, unknown> }[];
  config: { name: string; topics: string[]; difficulty: string; duration_minutes: number; question_count: number; persona?: string };
  integrity_signals?: {
    typing_analysis?: { ai_signal_score: number; paste_events: number; suspicious_segments: { type: string; length: number; avg_delta_ms: number }[] };
    ip_check?: { ip: string; city: string; country: string; org: string; is_vpn_or_datacenter: boolean; checked_at: string };
    violations?: { action: string; target: string; timestamp: string }[];
    violation_count?: number;
    screenshot_count?: number;
  };
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"scorecard" | "transcript" | "events" | "integrity">("scorecard");

  const supabase = useMemo(
    () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    []
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/signin");
        return;
      }
      fetchSession(data.session.access_token);
    });
  }, [supabase, router, sessionId]);

  const fetchSession = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/interviews/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError(res.status === 404 ? "Session not found" : "Failed to load session");
        return;
      }
      setSession(await res.json());
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const verdictColor = (v: string) => {
    if (v === "Strong Hire") return "#009999";
    if (v === "Hire") return "#6366f1";
    return "#ef4444";
  };

  const scoreColor = (s: number) => {
    if (s >= 8) return "#009999";
    if (s >= 6) return "#6366f1";
    if (s >= 4) return "#eab308";
    return "#ef4444";
  };

  const duration = session?.started_at && session?.ended_at
    ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000)
    : null;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <IconLoader2 size={24} className="animate-spin" style={{ color: "var(--muted)" }} />
      </main>
    );
  }

  if (error || !session) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <p className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{error || "Session not found"}</p>
          <button onClick={() => router.push("/company")} className="mt-3 text-xs text-[var(--teal)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  const tabSwitch = session.events?.filter((e) => e.type === "tab_switch").length || 0;
  const eyeEvents = session.events?.filter((e) => e.type === "eye_tracking").length || 0;

  return (
    <main className="min-h-screen pt-20 px-6 pb-12" style={{ background: "var(--bg)" }}>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <button
            onClick={() => router.push("/company")}
            className="flex items-center gap-1.5 text-xs text-[var(--muted2)] hover:text-[var(--text)] mb-4 transition-colors"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            <IconArrowLeft size={14} /> Back to Dashboard
          </button>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1
                className="text-[var(--text)] mb-1"
                style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.03em" }}
              >
                {session.candidate_name}
              </h1>
              <p className="text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {session.candidate_email} &middot; {session.config?.name || "Default Config"}
              </p>
            </div>
            {session.scorecard && (
              <div className="text-right">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: `${verdictColor(session.scorecard.verdict)}15`,
                    color: verdictColor(session.scorecard.verdict),
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  {session.scorecard.verdict}
                </span>
                <p
                  className="text-2xl font-bold mt-1"
                  style={{ color: scoreColor(session.scorecard.overall_score), fontFamily: "var(--font-display)" }}
                >
                  {session.scorecard.overall_score}/10
                </p>
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { icon: IconClock, label: "Duration", value: duration ? `${duration}m` : "—" },
              { icon: IconCode, label: "Questions", value: session.transcript?.filter((t) => t.role === "ai").length || 0 },
              { icon: IconBrowserCheck, label: "Tab Switches", value: tabSwitch },
              { icon: IconEye, label: "Eye Events", value: eyeEvents },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-[10px] text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <s.icon size={14} className="mx-auto mb-1" style={{ color: "var(--muted)" }} />
                <p className="text-sm font-bold text-[var(--text)]" style={{ fontFamily: "var(--font-display)" }}>{s.value}</p>
                <p className="text-[0.55rem] text-[var(--muted)] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-5 p-1 rounded-[10px] w-fit" style={{ background: "var(--surface)" }}>
            {(["scorecard", "transcript", "events", "integrity"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className="px-4 py-2 rounded-[8px] text-xs font-medium capitalize transition-all"
                style={{
                  background: activeTab === t ? "var(--card)" : "transparent",
                  color: activeTab === t ? "var(--text)" : "var(--muted2)",
                  fontFamily: "var(--font-dm-sans)",
                  border: activeTab === t ? "1px solid var(--border)" : "1px solid transparent",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Scorecard */}
          {activeTab === "scorecard" && session.scorecard && (
            <div className="space-y-4">
              <div className="p-5 rounded-[14px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h3 className="text-sm font-semibold text-[var(--text)] mb-3" style={{ fontFamily: "var(--font-display)" }}>Summary</h3>
                <p className="text-sm text-[var(--muted2)] leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                  {session.scorecard.summary}
                </p>
              </div>

              {/* Category scores */}
              {session.scorecard.categories && Object.keys(session.scorecard.categories).length > 0 && (
                <div className="p-5 rounded-[14px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <h3 className="text-sm font-semibold text-[var(--text)] mb-3" style={{ fontFamily: "var(--font-display)" }}>Category Scores</h3>
                  <div className="space-y-3">
                    {Object.entries(session.scorecard.categories).map(([cat, data]) => (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{cat}</span>
                          <span className="text-xs font-bold" style={{ color: scoreColor(data.score), fontFamily: "var(--font-dm-mono)" }}>
                            {data.score}/10
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${data.score * 10}%`, background: scoreColor(data.score) }}
                          />
                        </div>
                        <p className="text-[0.65rem] text-[var(--muted2)] mt-1" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                          {data.feedback}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-[14px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <h3 className="text-sm font-semibold text-[var(--text)] mb-3" style={{ fontFamily: "var(--font-display)" }}>Strengths</h3>
                  <ul className="space-y-1.5">
                    {session.scorecard.strengths?.map((s, i) => (
                      <li key={i} className="text-xs text-[var(--muted2)] flex gap-2" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                        <span style={{ color: "var(--teal)" }}>+</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-5 rounded-[14px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <h3 className="text-sm font-semibold text-[var(--text)] mb-3" style={{ fontFamily: "var(--font-display)" }}>Areas for Improvement</h3>
                  <ul className="space-y-1.5">
                    {session.scorecard.weaknesses?.map((w, i) => (
                      <li key={i} className="text-xs text-[var(--muted2)] flex gap-2" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                        <span style={{ color: "#ef4444" }}>-</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "scorecard" && !session.scorecard && (
            <div className="text-center py-12">
              <p className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {session.status === "completed" ? "Scorecard is being generated..." : "Interview not yet completed."}
              </p>
            </div>
          )}

          {/* Transcript */}
          {activeTab === "transcript" && (
            <div className="space-y-3">
              {!session.transcript?.length ? (
                <p className="text-sm text-[var(--muted2)] text-center py-12" style={{ fontFamily: "var(--font-dm-sans)" }}>No transcript available.</p>
              ) : (
                session.transcript.map((entry, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-[12px]"
                    style={{
                      background: entry.role === "ai" ? "rgba(0,153,153,0.04)" : "var(--card)",
                      border: `1px solid ${entry.role === "ai" ? "rgba(0,153,153,0.15)" : "var(--border)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="text-[0.6rem] font-semibold uppercase"
                        style={{
                          color: entry.role === "ai" ? "var(--teal)" : "var(--muted2)",
                          fontFamily: "var(--font-dm-mono)",
                        }}
                      >
                        {entry.role === "ai" ? "AI Interviewer" : "Candidate"}
                      </span>
                      {entry.type === "interrupt" && (
                        <span className="text-[0.5rem] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500" style={{ fontFamily: "var(--font-dm-mono)" }}>
                          INTERRUPT
                        </span>
                      )}
                      <span className="text-[0.55rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                      {entry.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Events */}
          {activeTab === "events" && (
            <div className="space-y-1.5">
              {!session.events?.length ? (
                <p className="text-sm text-[var(--muted2)] text-center py-12" style={{ fontFamily: "var(--font-dm-sans)" }}>No events recorded.</p>
              ) : (
                session.events.map((evt, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 rounded-[8px]"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: evt.type === "tab_switch" ? "#ef4444" : evt.type === "eye_tracking" ? "#eab308" : "var(--teal)",
                      }}
                    />
                    <span className="text-xs text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      {evt.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-[0.55rem] text-[var(--muted)] ml-auto" style={{ fontFamily: "var(--font-dm-mono)" }}>
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Integrity Signals */}
          {activeTab === "integrity" && (
            <div className="space-y-4">
              {/* IP Check */}
              <div className="p-5 rounded-[14px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <IconShieldCheck size={16} style={{ color: "var(--teal)" }} />
                  <h3 className="text-sm font-semibold text-[var(--text)]" style={{ fontFamily: "var(--font-display)" }}>IP &amp; Network Check</h3>
                </div>
                {session.integrity_signals?.ip_check ? (
                  <div className="space-y-2">
                    {[
                      { label: "IP Address", value: session.integrity_signals.ip_check.ip },
                      { label: "Location", value: `${session.integrity_signals.ip_check.city}, ${session.integrity_signals.ip_check.country}` },
                      { label: "Organization", value: session.integrity_signals.ip_check.org },
                      {
                        label: "VPN / Datacenter",
                        value: session.integrity_signals.ip_check.is_vpn_or_datacenter ? "DETECTED" : "No",
                        highlight: session.integrity_signals.ip_check.is_vpn_or_datacenter,
                      },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between">
                        <span className="text-[0.65rem] text-[var(--muted)] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono)" }}>
                          {row.label}
                        </span>
                        <span
                          className="text-xs font-medium"
                          style={{
                            color: (row as { highlight?: boolean }).highlight ? "#ef4444" : "var(--text)",
                            fontFamily: "var(--font-dm-sans)",
                          }}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>No IP check data available.</p>
                )}
              </div>

              {/* Typing Analysis */}
              <div className="p-5 rounded-[14px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h3 className="text-sm font-semibold text-[var(--text)] mb-3" style={{ fontFamily: "var(--font-display)" }}>Typing Cadence Analysis</h3>
                {session.integrity_signals?.typing_analysis ? (() => {
                  const ta = session.integrity_signals.typing_analysis;
                  const scoreColor = ta.ai_signal_score >= 50 ? "#ef4444" : ta.ai_signal_score >= 20 ? "#eab308" : "var(--teal)";
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.65rem] text-[var(--muted)] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono)" }}>
                          AI Signal Score
                        </span>
                        <span className="text-lg font-bold" style={{ color: scoreColor, fontFamily: "var(--font-display)" }}>
                          {ta.ai_signal_score}/100
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${ta.ai_signal_score}%`, background: scoreColor }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[0.65rem] text-[var(--muted)] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono)" }}>
                          Paste Events
                        </span>
                        <span className="text-xs font-medium" style={{ color: ta.paste_events > 0 ? "#ef4444" : "var(--text)", fontFamily: "var(--font-dm-sans)" }}>
                          {ta.paste_events}
                        </span>
                      </div>
                      {ta.suspicious_segments.length > 0 && (
                        <div>
                          <p className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider mb-1.5" style={{ fontFamily: "var(--font-dm-mono)" }}>
                            Suspicious Segments
                          </p>
                          <div className="space-y-1">
                            {ta.suspicious_segments.map((seg, i) => (
                              <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-[6px]" style={{ background: "var(--surface)" }}>
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ background: seg.type === "ai_assisted" ? "#ef4444" : "#eab308" }}
                                />
                                <span className="text-[0.6rem] text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                                  {seg.type.replace(/_/g, " ")} · {seg.length} keystrokes · avg {seg.avg_delta_ms}ms
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <p className="text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>No typing analysis data available.</p>
                )}
              </div>

              {/* Violations */}
              <div className="p-5 rounded-[14px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h3 className="text-sm font-semibold text-[var(--text)] mb-3" style={{ fontFamily: "var(--font-display)" }}>
                  Violations &amp; Anti-Cheat Log
                </h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[0.65rem] text-[var(--muted)] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono)" }}>
                    Total Violations
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{
                      color: (session.integrity_signals?.violation_count || 0) > 3 ? "#ef4444" : (session.integrity_signals?.violation_count || 0) > 0 ? "#eab308" : "var(--teal)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {session.integrity_signals?.violation_count || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[0.65rem] text-[var(--muted)] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono)" }}>
                    Screenshots Captured
                  </span>
                  <span className="text-xs font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                    {session.integrity_signals?.screenshot_count || 0}
                  </span>
                </div>
                {session.integrity_signals?.violations && session.integrity_signals.violations.length > 0 ? (
                  <div className="space-y-1 mt-2">
                    {session.integrity_signals.violations.map((v, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-[6px]" style={{ background: "var(--surface)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <span className="text-[0.6rem] text-[var(--muted2)] flex-1" style={{ fontFamily: "var(--font-dm-mono)" }}>
                          {v.action.replace(/_/g, " ")}
                          {v.target ? ` (${v.target})` : ""}
                        </span>
                        <span className="text-[0.55rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                          {new Date(v.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--teal)]" style={{ fontFamily: "var(--font-dm-sans)" }}>No violations detected.</p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
