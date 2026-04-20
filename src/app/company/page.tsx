"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
  IconSettings,
  IconList,
  IconChartBar,
  IconPlus,
  IconCopy,
  IconCheck,
  IconLoader2,
  IconTrash,
  IconExternalLink,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Config = {
  id: string;
  name: string;
  topics: string[];
  difficulty: string;
  duration_minutes: number;
  question_count: number;
  follow_up_depth: string;
  programming_languages: string[];
  created_at: string;
};

type Session = {
  id: string;
  candidate_name: string;
  candidate_email: string;
  status: string;
  scorecard: { verdict: string; overall_score: number } | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
};

type Tab = "configure" | "sessions" | "analytics";

const TOPIC_OPTIONS = [
  "Arrays and Strings",
  "Linked Lists",
  "Trees and Graphs",
  "Dynamic Programming",
  "System Design",
  "SQL and Databases",
  "React and Frontend",
  "Python Fundamentals",
  "Algorithms and Complexity",
  "Behavioral",
];

const LANGUAGE_OPTIONS = ["Python", "JavaScript", "Java", "Go", "C++", "SQL"];

export default function CompanyDashboard() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [tab, setTab] = useState<Tab>("sessions");
  const [configs, setConfigs] = useState<Config[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // Config form state
  const [configName, setConfigName] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [duration, setDuration] = useState(30);
  const [questionCount, setQuestionCount] = useState(5);
  const [followUpDepth, setFollowUpDepth] = useState("medium");
  const [languages, setLanguages] = useState<string[]>(["Python", "JavaScript"]);
  const [saving, setSaving] = useState(false);

  // Session creation
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateEmail, setNewCandidateEmail] = useState("");
  const [selectedConfigId, setSelectedConfigId] = useState("");
  const [createdLink, setCreatedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

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
      setToken(data.session.access_token);
    });
  }, [supabase, router]);

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [configRes, sessionRes] = await Promise.all([
        fetch(`${API_URL}/interviews/config`, { headers }),
        fetch(`${API_URL}/interviews/sessions`, { headers }),
      ]);
      if (configRes.ok) {
        const d = await configRes.json();
        setConfigs(d.configs || []);
      }
      if (sessionRes.ok) {
        const d = await sessionRes.json();
        setSessions(d.sessions || []);
      }
    } catch {
      // silent
    }
    setLoading(false);
  };

  const handleSaveConfig = async () => {
    if (!configName.trim() || !selectedTopics.length) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/interviews/config`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: configName,
          topics: selectedTopics,
          difficulty,
          duration_minutes: duration,
          question_count: questionCount,
          follow_up_depth: followUpDepth,
          programming_languages: languages.map((l) => l.toLowerCase()),
        }),
      });
      if (res.ok) {
        setConfigName("");
        setSelectedTopics([]);
        await fetchData();
      }
    } catch {
      // silent
    }
    setSaving(false);
  };

  const handleCreateSession = async () => {
    if (!newCandidateName.trim() || !newCandidateEmail.trim() || !selectedConfigId) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/interviews/sessions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          config_id: selectedConfigId,
          candidate_email: newCandidateEmail,
          candidate_name: newCandidateName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedLink(data.candidate_link);
        await fetchData();
      }
    } catch {
      // silent
    }
    setCreating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(createdLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "#22c55e";
      case "completed": return "var(--teal)";
      case "cancelled": return "#ef4444";
      default: return "var(--muted)";
    }
  };

  const verdictColor = (v: string) => {
    if (v === "Strong Hire") return "#009999";
    if (v === "Hire") return "#6366f1";
    return "#ef4444";
  };

  if (!token) return null;

  return (
    <main className="min-h-screen pt-20 px-6 pb-12" style={{ background: "var(--bg)" }}>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1
            className="text-[var(--text)] mb-1"
            style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            Interview Platform
          </h1>
          <p className="text-sm text-[var(--muted2)] mb-6" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            Configure AI interviews, create sessions, and review scorecards.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-[10px] w-fit" style={{ background: "var(--surface)" }}>
          {([
            { id: "sessions" as Tab, icon: IconList, label: "Sessions" },
            { id: "configure" as Tab, icon: IconSettings, label: "Configure" },
            { id: "analytics" as Tab, icon: IconChartBar, label: "Analytics" },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-xs font-medium transition-all"
              style={{
                background: tab === t.id ? "var(--card)" : "transparent",
                color: tab === t.id ? "var(--text)" : "var(--muted2)",
                fontFamily: "var(--font-dm-sans)",
                border: tab === t.id ? "1px solid var(--border)" : "1px solid transparent",
              }}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Sessions Tab */}
        {tab === "sessions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--text)]" style={{ fontFamily: "var(--font-display)" }}>
                Interview Sessions
              </h2>
              <button
                onClick={() => { setShowCreateSession(true); setCreatedLink(""); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-xs font-medium text-white"
                style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)" }}
              >
                <IconPlus size={14} /> New Session
              </button>
            </div>

            {/* Create session modal */}
            {showCreateSession && (
              <div className="p-5 rounded-[14px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                {!createdLink ? (
                  <div className="space-y-3">
                    <input
                      value={newCandidateName}
                      onChange={(e) => setNewCandidateName(e.target.value)}
                      placeholder="Candidate name"
                      className="w-full px-3 py-2 rounded-[8px] text-sm outline-none"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-dm-sans)" }}
                    />
                    <input
                      value={newCandidateEmail}
                      onChange={(e) => setNewCandidateEmail(e.target.value)}
                      placeholder="Candidate email"
                      className="w-full px-3 py-2 rounded-[8px] text-sm outline-none"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-dm-sans)" }}
                    />
                    <select
                      value={selectedConfigId}
                      onChange={(e) => setSelectedConfigId(e.target.value)}
                      className="w-full px-3 py-2 rounded-[8px] text-sm outline-none"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-dm-sans)" }}
                    >
                      <option value="">Select config...</option>
                      {configs.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateSession}
                        disabled={creating || !selectedConfigId || !newCandidateName.trim()}
                        className="px-4 py-2 rounded-[8px] text-xs font-medium text-white disabled:opacity-50"
                        style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)" }}
                      >
                        {creating ? "Creating..." : "Generate Link"}
                      </button>
                      <button
                        onClick={() => setShowCreateSession(false)}
                        className="px-4 py-2 rounded-[8px] text-xs text-[var(--muted2)]"
                        style={{ fontFamily: "var(--font-dm-sans)", border: "1px solid var(--border)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      Interview link created for {newCandidateName}:
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={createdLink}
                        className="flex-1 px-3 py-2 rounded-[8px] text-xs"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--teal)", fontFamily: "var(--font-dm-mono)" }}
                      />
                      <button onClick={handleCopy} className="p-2 rounded-[8px]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        {copied ? <IconCheck size={14} style={{ color: "var(--teal)" }} /> : <IconCopy size={14} style={{ color: "var(--muted2)" }} />}
                      </button>
                    </div>
                    <button
                      onClick={() => setShowCreateSession(false)}
                      className="text-xs text-[var(--muted2)] hover:text-[var(--text)]"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Sessions table */}
            {loading ? (
              <div className="flex justify-center py-8"><IconLoader2 size={20} className="animate-spin" style={{ color: "var(--muted)" }} /></div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>No sessions yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 rounded-[12px]"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                          {s.candidate_name}
                        </p>
                        <p className="text-[0.65rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                          {new Date(s.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[0.6rem] font-medium uppercase"
                        style={{ background: `${statusColor(s.status)}15`, color: statusColor(s.status), fontFamily: "var(--font-dm-mono)" }}
                      >
                        {s.status}
                      </span>
                      {s.scorecard && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[0.6rem] font-semibold"
                          style={{ background: `${verdictColor(s.scorecard.verdict)}15`, color: verdictColor(s.scorecard.verdict), fontFamily: "var(--font-dm-sans)" }}
                        >
                          {s.scorecard.verdict} ({s.scorecard.overall_score}/10)
                        </span>
                      )}
                      <button
                        onClick={() => router.push(`/company/session/${s.id}`)}
                        className="p-1.5 rounded-[6px] hover:bg-[var(--surface)] transition-colors"
                        style={{ color: "var(--muted2)" }}
                      >
                        <IconExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Configure Tab */}
        {tab === "configure" && (
          <div className="space-y-6">
            <div className="p-5 rounded-[14px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 className="text-sm font-semibold text-[var(--text)] mb-4" style={{ fontFamily: "var(--font-display)" }}>
                New Interview Configuration
              </h3>

              <div className="space-y-4">
                <input
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="Configuration name (e.g. Senior Backend Engineer)"
                  className="w-full px-3 py-2.5 rounded-[8px] text-sm outline-none focus:ring-1 focus:ring-[var(--teal)]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-dm-sans)" }}
                />

                {/* Topics */}
                <div>
                  <label className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider block mb-2" style={{ fontFamily: "var(--font-dm-mono)" }}>Topics</label>
                  <div className="flex flex-wrap gap-1.5">
                    {TOPIC_OPTIONS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTopics((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])}
                        className="px-2.5 py-1 rounded-[6px] text-[0.65rem] transition-all"
                        style={{
                          background: selectedTopics.includes(t) ? "rgba(0,153,153,0.1)" : "var(--surface)",
                          border: `1px solid ${selectedTopics.includes(t) ? "rgba(0,153,153,0.3)" : "var(--border)"}`,
                          color: selectedTopics.includes(t) ? "var(--teal)" : "var(--muted2)",
                          fontFamily: "var(--font-dm-sans)",
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider block mb-2" style={{ fontFamily: "var(--font-dm-mono)" }}>Difficulty</label>
                  <div className="flex gap-2">
                    {["easy", "medium", "hard", "mixed"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className="px-3 py-1.5 rounded-[6px] text-xs capitalize transition-all"
                        style={{
                          background: difficulty === d ? "rgba(0,153,153,0.1)" : "var(--surface)",
                          border: `1px solid ${difficulty === d ? "rgba(0,153,153,0.3)" : "var(--border)"}`,
                          color: difficulty === d ? "var(--teal)" : "var(--muted2)",
                          fontFamily: "var(--font-dm-sans)",
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration & Questions */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider block mb-2" style={{ fontFamily: "var(--font-dm-mono)" }}>
                      Duration: {duration} min
                    </label>
                    <input type="range" min={10} max={60} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full" />
                  </div>
                  <div>
                    <label className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider block mb-2" style={{ fontFamily: "var(--font-dm-mono)" }}>
                      Questions: {questionCount}
                    </label>
                    <input type="range" min={3} max={10} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-full" />
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <label className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider block mb-2" style={{ fontFamily: "var(--font-dm-mono)" }}>Languages</label>
                  <div className="flex flex-wrap gap-1.5">
                    {LANGUAGE_OPTIONS.map((l) => (
                      <button
                        key={l}
                        onClick={() => setLanguages((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l])}
                        className="px-2.5 py-1 rounded-[6px] text-[0.65rem] transition-all"
                        style={{
                          background: languages.includes(l) ? "rgba(0,153,153,0.1)" : "var(--surface)",
                          border: `1px solid ${languages.includes(l) ? "rgba(0,153,153,0.3)" : "var(--border)"}`,
                          color: languages.includes(l) ? "var(--teal)" : "var(--muted2)",
                          fontFamily: "var(--font-dm-sans)",
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveConfig}
                  disabled={saving || !configName.trim() || !selectedTopics.length}
                  className="px-6 py-2.5 rounded-[8px] text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)" }}
                >
                  {saving ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </div>

            {/* Existing configs */}
            {configs.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text)] mb-3" style={{ fontFamily: "var(--font-display)" }}>
                  Saved Configurations
                </h3>
                <div className="space-y-2">
                  {configs.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-[10px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                      <div>
                        <p className="text-sm text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{c.name}</p>
                        <p className="text-[0.6rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                          {c.topics?.join(", ")?.slice(0, 60)} &middot; {c.difficulty} &middot; {c.question_count}Q
                        </p>
                      </div>
                      <span className="text-[0.6rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {tab === "analytics" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Interviews", value: sessions.length },
              { label: "Completed", value: sessions.filter((s) => s.status === "completed").length },
              { label: "Avg Score", value: sessions.filter((s) => s.scorecard).length ? (sessions.filter((s) => s.scorecard).reduce((acc, s) => acc + (s.scorecard?.overall_score || 0), 0) / sessions.filter((s) => s.scorecard).length).toFixed(1) : "—" },
              { label: "Strong Hire %", value: sessions.filter((s) => s.scorecard).length ? `${Math.round((sessions.filter((s) => s.scorecard?.verdict === "Strong Hire").length / sessions.filter((s) => s.scorecard).length) * 100)}%` : "—" },
            ].map((stat) => (
              <div key={stat.label} className="p-5 rounded-[14px] text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <p className="text-2xl font-bold text-[var(--text)] mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  {stat.value}
                </p>
                <p className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono)" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
