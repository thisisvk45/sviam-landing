"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  IconSearch,
  IconSparkles,
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

const TECH_STACK_TAGS = [
  "React", "Next.js", "Node.js", "Express", "Python", "Django", "FastAPI", "Flask",
  "Java", "Spring Boot", "Go", "Rust", "C++", "TypeScript",
  "PostgreSQL", "MongoDB", "Redis", "MySQL", "DynamoDB",
  "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform",
  "GraphQL", "REST APIs", "gRPC", "Kafka", "RabbitMQ",
  "Machine Learning", "Data Engineering", "System Design",
  "React Native", "Flutter", "iOS/Swift", "Android/Kotlin",
];

const EXPERIENCE_LEVELS = [
  { id: "junior", label: "Junior", desc: "0-2 years" },
  { id: "mid", label: "Mid-level", desc: "2-5 years" },
  { id: "senior", label: "Senior", desc: "5-8 years" },
  { id: "lead", label: "Lead / Staff", desc: "8+ years" },
];

const PERSONA_OPTIONS = [
  { id: "arya", name: "Arya", style: "Warm but thorough" },
  { id: "vikram", name: "Vikram", style: "Rigorous and precise" },
  { id: "priya", name: "Priya", style: "System-design focused" },
  { id: "rahul", name: "Rahul", style: "Fast-paced and challenging" },
  { id: "ananya", name: "Ananya", style: "Collaborative and exploratory" },
];

type SearchResult = {
  session_id: string;
  candidate_name: string;
  verdict: string;
  overall_score: number | null;
  matches: { field: string; snippet: string }[];
};

export default function CompanyDashboard() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [tab, setTab] = useState<Tab>("sessions");
  const [configs, setConfigs] = useState<Config[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // Config form state
  const [configName, setConfigName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [duration, setDuration] = useState(30);
  const [questionCount, setQuestionCount] = useState(5);
  const [followUpDepth, setFollowUpDepth] = useState("medium");
  const [languages, setLanguages] = useState<string[]>(["Python", "JavaScript"]);
  const [persona, setPersona] = useState("arya");
  const [saving, setSaving] = useState(false);
  const [showJdGenerator, setShowJdGenerator] = useState(false);
  const [jdExpLevel, setJdExpLevel] = useState("mid");
  const [jdTechStack, setJdTechStack] = useState<string[]>([]);
  const [jdWorkMode, setJdWorkMode] = useState("hybrid");
  const [generatingJd, setGeneratingJd] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Comparison state
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [compareResults, setCompareResults] = useState<Array<{ name: string; overall_score: number; verdict: string; strengths: string[]; weaknesses: string[]; ai_signal_score: number | null; duration_minutes: number | null }> | null>(null);
  const [comparing, setComparing] = useState(false);

  // Session creation
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateEmail, setNewCandidateEmail] = useState("");
  const [selectedConfigId, setSelectedConfigId] = useState("");
  const [createdLink, setCreatedLink] = useState("");
  const [createdPin, setCreatedPin] = useState("");
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  const supabase = useMemo(
    () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    []
  );

  const getFreshToken = useCallback(async (): Promise<string | null> => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      router.replace("/signin");
      return null;
    }
    setToken(data.session.access_token);
    return data.session.access_token;
  }, [supabase, router]);

  useEffect(() => {
    getFreshToken();
  }, [getFreshToken]);

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
    } catch (e) {
      console.error("[fetchData] error:", e);
    }
    setLoading(false);
  };

  const handleSaveConfig = async () => {
    if (!configName.trim() || !selectedTopics.length) return;
    setSaving(true);
    try {
      const freshToken = await getFreshToken();
      if (!freshToken) return;
      const res = await fetch(`${API_URL}/interviews/config`, {
        method: "POST",
        headers: { Authorization: `Bearer ${freshToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: configName,
          topics: selectedTopics,
          difficulty,
          duration_minutes: duration,
          question_count: questionCount,
          follow_up_depth: followUpDepth,
          programming_languages: languages.map((l) => l.toLowerCase()),
          persona,
          job_description: jobDescription || undefined,
        }),
      });
      if (res.ok) {
        setConfigName("");
        setJobDescription("");
        setSelectedTopics([]);
        setDifficulty("medium");
        setDuration(30);
        setQuestionCount(5);
        setLanguages(["Python", "JavaScript"]);
        setPersona("arya");
        await fetchData();
        // Auto-switch to sessions so they can create an interview right away
        setTab("sessions");
      }
    } catch {
      // silent
    }
    setSaving(false);
  };

  const [jdError, setJdError] = useState("");

  const handleGenerateJD = async () => {
    if (!configName.trim()) return;
    setGeneratingJd(true);
    setJdError("");
    try {
      const freshToken = await getFreshToken();
      if (!freshToken) return;
      const res = await fetch(`${API_URL}/interviews/generate-jd`, {
        method: "POST",
        headers: { Authorization: `Bearer ${freshToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          role: configName,
          experience_level: jdExpLevel,
          tech_stack: jdTechStack,
          work_mode: jdWorkMode,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setJobDescription(data.job_description);
        setShowJdGenerator(false);
      } else {
        const err = await res.json().catch(() => ({ detail: "Server error" }));
        setJdError(typeof err.detail === "string" ? err.detail : "Failed to generate JD");
      }
    } catch {
      setJdError("Could not reach server. Is the backend running?");
    }
    setGeneratingJd(false);
  };

  const handleCreateSession = async () => {
    if (!newCandidateName.trim() || !newCandidateEmail.trim() || !selectedConfigId) return;
    setCreating(true);
    try {
      const freshToken = await getFreshToken();
      if (!freshToken) return;
      const res = await fetch(`${API_URL}/interviews/sessions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${freshToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          config_id: selectedConfigId,
          candidate_email: newCandidateEmail,
          candidate_name: newCandidateName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedLink(data.candidate_link);
        setCreatedPin(data.pin || "");
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API_URL}/interviews/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch {
        // silent
      }
      setSearching(false);
    }, 300);
  };

  const handleCompare = async () => {
    if (compareIds.size < 2) return;
    setComparing(true);
    try {
      const res = await fetch(`${API_URL}/interviews/compare?session_ids=${Array.from(compareIds).join(",")}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCompareResults(data.candidates || []);
      }
    } catch { /* silent */ }
    setComparing(false);
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
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
                onClick={() => {
                  if (configs.length === 0) {
                    setTab("configure");
                  } else {
                    setShowCreateSession(true);
                    setCreatedLink("");
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-xs font-medium text-white"
                style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)" }}
              >
                <IconPlus size={14} /> {configs.length === 0 ? "Create Config First" : "New Session"}
              </button>
            </div>

            {/* Transcript search */}
            <div className="relative">
              <div className="flex items-center gap-2 px-3 py-2 rounded-[8px]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <IconSearch size={14} style={{ color: "var(--muted)" }} />
                <input
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search transcripts (e.g. microservices, binary tree)..."
                  className="flex-1 text-sm outline-none bg-transparent"
                  style={{ color: "var(--text)", fontFamily: "var(--font-dm-sans)" }}
                />
                {searching && <IconLoader2 size={14} className="animate-spin" style={{ color: "var(--muted)" }} />}
              </div>

              {searchResults.length > 0 && (
                <div className="mt-2 space-y-2">
                  <p className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono)" }}>
                    {searchResults.length} result{searchResults.length !== 1 && "s"} for &ldquo;{searchQuery}&rdquo;
                  </p>
                  {searchResults.map((r) => (
                    <div
                      key={r.session_id}
                      onClick={() => router.push(`/company/session/${r.session_id}`)}
                      className="p-3 rounded-[10px] cursor-pointer hover:brightness-110 transition-all"
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                          {r.candidate_name}
                        </span>
                        {r.verdict && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[0.6rem] font-semibold"
                            style={{
                              background: `${verdictColor(r.verdict)}15`,
                              color: verdictColor(r.verdict),
                              fontFamily: "var(--font-dm-sans)",
                            }}
                          >
                            {r.verdict}
                          </span>
                        )}
                      </div>
                      {r.matches.map((m, i) => (
                        <p key={i} className="text-[0.65rem] text-[var(--muted2)] mt-1 leading-relaxed" style={{ fontFamily: "var(--font-dm-mono)" }}>
                          <span className="text-[var(--muted)] uppercase">[{m.field}]</span>{" "}
                          {m.snippet}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
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
                    <p className="text-sm text-[var(--text)] mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      Interview created for {newCandidateName}
                    </p>
                    <p className="text-[0.65rem] text-[var(--muted2)] mb-3" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      Share the link and PIN with the candidate. They&apos;ll need both to start.
                    </p>

                    {/* Link */}
                    <label className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider block mb-1" style={{ fontFamily: "var(--font-dm-mono)" }}>Interview Link</label>
                    <div className="flex items-center gap-2 mb-3">
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

                    {/* PIN */}
                    <label className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider block mb-1" style={{ fontFamily: "var(--font-dm-mono)" }}>Access PIN</label>
                    <div
                      className="px-4 py-3 rounded-[8px] text-center mb-3"
                      style={{ background: "rgba(0,153,153,0.06)", border: "1px solid rgba(0,153,153,0.2)" }}
                    >
                      <span className="text-2xl font-bold tracking-[0.3em] text-[var(--teal)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                        {createdPin}
                      </span>
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

            {/* Compare button */}
            {compareIds.size >= 2 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCompare}
                  disabled={comparing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-xs font-medium text-white disabled:opacity-50"
                  style={{ background: "#6366f1", fontFamily: "var(--font-dm-sans)" }}
                >
                  {comparing ? (
                    <><IconLoader2 size={14} className="animate-spin" /> Comparing...</>
                  ) : (
                    <>Compare {compareIds.size} Candidates</>
                  )}
                </button>
                <button
                  onClick={() => { setCompareIds(new Set()); setCompareResults(null); }}
                  className="text-xs text-[var(--muted2)] hover:text-[var(--text)]"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Clear selection
                </button>
              </div>
            )}

            {/* Comparison table */}
            {compareResults && compareResults.length > 0 && (
              <div className="rounded-[14px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                  <h3 className="text-sm font-semibold text-[var(--text)]" style={{ fontFamily: "var(--font-display)" }}>
                    Candidate Comparison
                  </h3>
                  <button
                    onClick={() => setCompareResults(null)}
                    className="text-xs text-[var(--muted2)] hover:text-[var(--text)]"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    Dismiss
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" style={{ fontFamily: "var(--font-dm-sans)" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th className="text-left px-4 py-2.5 text-[0.6rem] text-[var(--muted)] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono)" }}>Metric</th>
                        {compareResults.map((c) => (
                          <th key={c.name} className="text-left px-4 py-2.5 text-sm font-medium text-[var(--text)]">{c.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-2.5 text-[var(--muted)]">Score</td>
                        {compareResults.map((c) => (
                          <td key={c.name} className="px-4 py-2.5 font-semibold text-[var(--text)]">{c.overall_score}/10</td>
                        ))}
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-2.5 text-[var(--muted)]">Verdict</td>
                        {compareResults.map((c) => (
                          <td key={c.name} className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[0.6rem] font-semibold" style={{ background: `${verdictColor(c.verdict)}15`, color: verdictColor(c.verdict) }}>
                              {c.verdict}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-2.5 text-[var(--muted)] align-top">Strengths</td>
                        {compareResults.map((c) => (
                          <td key={c.name} className="px-4 py-2.5 text-[var(--text)]">
                            <ul className="list-disc list-inside space-y-0.5">
                              {c.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </td>
                        ))}
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-2.5 text-[var(--muted)] align-top">Weaknesses</td>
                        {compareResults.map((c) => (
                          <td key={c.name} className="px-4 py-2.5 text-[var(--text)]">
                            <ul className="list-disc list-inside space-y-0.5">
                              {c.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-[var(--muted)]">Duration</td>
                        {compareResults.map((c) => (
                          <td key={c.name} className="px-4 py-2.5 text-[var(--text)]">{c.duration_minutes != null ? `${c.duration_minutes} min` : "—"}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
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
                    style={{ background: "var(--card)", border: `1px solid ${compareIds.has(s.id) ? "rgba(99,102,241,0.5)" : "var(--border)"}` }}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={compareIds.has(s.id)}
                        onChange={() => toggleCompare(s.id)}
                        className="w-3.5 h-3.5 rounded accent-[#6366f1] cursor-pointer"
                        title="Select for comparison"
                      />
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
            <div className="p-6 rounded-[14px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 className="text-base font-semibold text-[var(--text)] mb-1" style={{ fontFamily: "var(--font-display)" }}>
                New Interview Configuration
              </h3>
              <p className="text-xs text-[var(--muted2)] mb-6" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                Set up the interview parameters. Once saved, you can create candidate sessions from it.
              </p>

              <div className="space-y-5">
                {/* Role / Config Name */}
                <div>
                  <label className="text-[0.65rem] text-[var(--muted)] uppercase tracking-wider block mb-1.5" style={{ fontFamily: "var(--font-dm-mono)" }}>
                    Role Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer, SDE-2 Frontend"
                    className="w-full px-3.5 py-2.5 rounded-[10px] text-sm outline-none focus:ring-2 focus:ring-[var(--teal)] transition-all"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-dm-sans)" }}
                  />
                </div>

                {/* Job Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[0.65rem] text-[var(--muted)] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono)" }}>
                      Job Description <span className="text-[var(--muted)]">(optional)</span>
                    </label>
                    <button
                      onClick={() => setShowJdGenerator(!showJdGenerator)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[0.65rem] font-medium transition-all hover:brightness-110"
                      style={{
                        background: showJdGenerator ? "rgba(0,153,153,0.1)" : "var(--surface)",
                        border: `1px solid ${showJdGenerator ? "var(--teal)" : "var(--border)"}`,
                        color: showJdGenerator ? "var(--teal)" : "var(--muted2)",
                        fontFamily: "var(--font-dm-sans)",
                      }}
                    >
                      <IconSparkles size={12} /> Auto-generate
                    </button>
                  </div>

                  {/* JD Generator panel */}
                  {showJdGenerator && (
                    <div
                      className="p-4 rounded-[12px] mb-3 space-y-4"
                      style={{ background: "rgba(0,153,153,0.03)", border: "1px solid rgba(0,153,153,0.15)" }}
                    >
                      <p className="text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                        Select the details below and we&apos;ll generate a JD{configName ? ` for "${configName}"` : ""}. Fill in the role name above first.
                      </p>

                      {/* Experience Level */}
                      <div>
                        <label className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider block mb-1.5" style={{ fontFamily: "var(--font-dm-mono)" }}>
                          Experience Level
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {EXPERIENCE_LEVELS.map((lvl) => (
                            <button
                              key={lvl.id}
                              onClick={() => setJdExpLevel(lvl.id)}
                              className="p-2 rounded-[8px] text-center transition-all"
                              style={{
                                background: jdExpLevel === lvl.id ? "rgba(0,153,153,0.1)" : "var(--surface)",
                                border: `1.5px solid ${jdExpLevel === lvl.id ? "var(--teal)" : "var(--border)"}`,
                              }}
                            >
                              <p className="text-[0.65rem] font-semibold" style={{
                                color: jdExpLevel === lvl.id ? "var(--teal)" : "var(--text)",
                                fontFamily: "var(--font-dm-sans)",
                              }}>{lvl.label}</p>
                              <p className="text-[0.55rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>{lvl.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tech Stack Tags */}
                      <div>
                        <label className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider block mb-1.5" style={{ fontFamily: "var(--font-dm-mono)" }}>
                          Tech Stack <span className="text-[var(--muted)]">— click to select</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                          {TECH_STACK_TAGS.map((tag) => {
                            const selected = jdTechStack.includes(tag);
                            return (
                              <button
                                key={tag}
                                onClick={() => setJdTechStack((prev) =>
                                  prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                                )}
                                className="px-2 py-1 rounded-[6px] text-[0.6rem] transition-all"
                                style={{
                                  background: selected ? "rgba(0,153,153,0.12)" : "var(--surface)",
                                  border: `1px solid ${selected ? "var(--teal)" : "var(--border)"}`,
                                  color: selected ? "var(--teal)" : "var(--muted2)",
                                  fontFamily: "var(--font-dm-sans)",
                                  fontWeight: selected ? 600 : 400,
                                }}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Work Mode */}
                      <div>
                        <label className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider block mb-1.5" style={{ fontFamily: "var(--font-dm-mono)" }}>
                          Work Mode
                        </label>
                        <div className="flex gap-2">
                          {["remote", "hybrid", "onsite"].map((mode) => (
                            <button
                              key={mode}
                              onClick={() => setJdWorkMode(mode)}
                              className="px-3 py-1.5 rounded-[8px] text-xs capitalize transition-all"
                              style={{
                                background: jdWorkMode === mode ? "rgba(0,153,153,0.1)" : "var(--surface)",
                                border: `1.5px solid ${jdWorkMode === mode ? "var(--teal)" : "var(--border)"}`,
                                color: jdWorkMode === mode ? "var(--teal)" : "var(--muted2)",
                                fontFamily: "var(--font-dm-sans)",
                              }}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>

                      {jdError && (
                        <p className="text-xs text-red-400 text-center" style={{ fontFamily: "var(--font-dm-sans)" }}>
                          {jdError}
                        </p>
                      )}

                      <button
                        onClick={handleGenerateJD}
                        disabled={generatingJd || !configName.trim()}
                        className="w-full py-2.5 rounded-[8px] text-xs font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:brightness-110"
                        style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)" }}
                      >
                        {generatingJd ? (
                          <><IconLoader2 size={13} className="animate-spin" /> Generating...</>
                        ) : (
                          <><IconSparkles size={13} /> Generate Job Description</>
                        )}
                      </button>
                    </div>
                  )}

                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste a JD here or use auto-generate above. The AI will tailor interview questions based on it."
                    rows={jobDescription ? 8 : 3}
                    className="w-full px-3.5 py-2.5 rounded-[10px] text-sm outline-none resize-none focus:ring-2 focus:ring-[var(--teal)] transition-all"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-dm-sans)" }}
                  />
                </div>

                {/* Topics */}
                <div>
                  <label className="text-[0.65rem] text-[var(--muted)] uppercase tracking-wider block mb-1.5" style={{ fontFamily: "var(--font-dm-mono)" }}>
                    Topics <span className="text-red-400">*</span> <span className="text-[var(--muted)]">— select all that apply</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TOPIC_OPTIONS.map((t) => {
                      const selected = selectedTopics.includes(t);
                      return (
                        <button
                          key={t}
                          onClick={() => setSelectedTopics((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs transition-all"
                          style={{
                            background: selected ? "rgba(0,153,153,0.12)" : "var(--surface)",
                            border: `1.5px solid ${selected ? "var(--teal)" : "var(--border)"}`,
                            color: selected ? "var(--teal)" : "var(--muted2)",
                            fontFamily: "var(--font-dm-sans)",
                            fontWeight: selected ? 600 : 400,
                          }}
                        >
                          <span className="w-3.5 h-3.5 rounded-[4px] flex items-center justify-center text-[0.5rem]" style={{
                            background: selected ? "var(--teal)" : "transparent",
                            border: selected ? "none" : "1.5px solid var(--border)",
                            color: "white",
                          }}>
                            {selected && <IconCheck size={10} />}
                          </span>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px" style={{ background: "var(--border)" }} />

                {/* Difficulty */}
                <div>
                  <label className="text-[0.65rem] text-[var(--muted)] uppercase tracking-wider block mb-2" style={{ fontFamily: "var(--font-dm-mono)" }}>Difficulty Level</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "easy", label: "Easy", desc: "Warm-up, fundamentals" },
                      { id: "medium", label: "Medium", desc: "Standard SDE rounds" },
                      { id: "hard", label: "Hard", desc: "Senior / competitive" },
                      { id: "mixed", label: "Mixed", desc: "Easy → Hard ramp-up" },
                    ].map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDifficulty(d.id)}
                        className="p-3 rounded-[10px] text-left transition-all"
                        style={{
                          background: difficulty === d.id ? "rgba(0,153,153,0.08)" : "var(--surface)",
                          border: `1.5px solid ${difficulty === d.id ? "var(--teal)" : "var(--border)"}`,
                        }}
                      >
                        <p className="text-xs font-semibold mb-0.5" style={{
                          color: difficulty === d.id ? "var(--teal)" : "var(--text)",
                          fontFamily: "var(--font-dm-sans)",
                        }}>{d.label}</p>
                        <p className="text-[0.6rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{d.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration & Questions — side by side selects */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[0.65rem] text-[var(--muted)] uppercase tracking-wider block mb-1.5" style={{ fontFamily: "var(--font-dm-mono)" }}>
                      Duration
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-[10px] text-sm outline-none focus:ring-2 focus:ring-[var(--teal)] transition-all appearance-none cursor-pointer"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-dm-sans)" }}
                    >
                      <option value={15}>15 minutes</option>
                      <option value={20}>20 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[0.65rem] text-[var(--muted)] uppercase tracking-wider block mb-1.5" style={{ fontFamily: "var(--font-dm-mono)" }}>
                      Number of Questions
                    </label>
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-[10px] text-sm outline-none focus:ring-2 focus:ring-[var(--teal)] transition-all appearance-none cursor-pointer"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-dm-sans)" }}
                    >
                      {[3, 4, 5, 6, 7, 8, 10].map((n) => (
                        <option key={n} value={n}>{n} questions</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Follow-up Depth */}
                <div>
                  <label className="text-[0.65rem] text-[var(--muted)] uppercase tracking-wider block mb-2" style={{ fontFamily: "var(--font-dm-mono)" }}>Follow-up Depth</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "light", label: "Light", desc: "Minimal follow-ups" },
                      { id: "medium", label: "Medium", desc: "Balanced probing" },
                      { id: "deep", label: "Deep", desc: "Thorough deep-dives" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFollowUpDepth(f.id)}
                        className="p-3 rounded-[10px] text-left transition-all"
                        style={{
                          background: followUpDepth === f.id ? "rgba(0,153,153,0.08)" : "var(--surface)",
                          border: `1.5px solid ${followUpDepth === f.id ? "var(--teal)" : "var(--border)"}`,
                        }}
                      >
                        <p className="text-xs font-semibold mb-0.5" style={{
                          color: followUpDepth === f.id ? "var(--teal)" : "var(--text)",
                          fontFamily: "var(--font-dm-sans)",
                        }}>{f.label}</p>
                        <p className="text-[0.6rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{f.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px" style={{ background: "var(--border)" }} />

                {/* Languages */}
                <div>
                  <label className="text-[0.65rem] text-[var(--muted)] uppercase tracking-wider block mb-1.5" style={{ fontFamily: "var(--font-dm-mono)" }}>
                    Allowed Languages
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map((l) => {
                      const selected = languages.includes(l);
                      return (
                        <button
                          key={l}
                          onClick={() => setLanguages((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l])}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs transition-all"
                          style={{
                            background: selected ? "rgba(0,153,153,0.12)" : "var(--surface)",
                            border: `1.5px solid ${selected ? "var(--teal)" : "var(--border)"}`,
                            color: selected ? "var(--teal)" : "var(--muted2)",
                            fontFamily: "var(--font-dm-sans)",
                            fontWeight: selected ? 600 : 400,
                          }}
                        >
                          <span className="w-3.5 h-3.5 rounded-[4px] flex items-center justify-center text-[0.5rem]" style={{
                            background: selected ? "var(--teal)" : "transparent",
                            border: selected ? "none" : "1.5px solid var(--border)",
                            color: "white",
                          }}>
                            {selected && <IconCheck size={10} />}
                          </span>
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* AI Persona */}
                <div>
                  <label className="text-[0.65rem] text-[var(--muted)] uppercase tracking-wider block mb-2" style={{ fontFamily: "var(--font-dm-mono)" }}>AI Interviewer Persona</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {PERSONA_OPTIONS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPersona(p.id)}
                        className="p-3 rounded-[10px] text-left transition-all"
                        style={{
                          background: persona === p.id ? "rgba(0,153,153,0.08)" : "var(--surface)",
                          border: `1.5px solid ${persona === p.id ? "var(--teal)" : "var(--border)"}`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[0.6rem] font-bold"
                            style={{
                              background: persona === p.id ? "var(--teal)" : "var(--card)",
                              color: persona === p.id ? "white" : "var(--muted2)",
                              border: persona === p.id ? "none" : "1px solid var(--border)",
                            }}
                          >
                            {p.name[0]}
                          </div>
                          <span className="text-xs font-semibold" style={{
                            color: persona === p.id ? "var(--teal)" : "var(--text)",
                            fontFamily: "var(--font-dm-sans)",
                          }}>{p.name}</span>
                        </div>
                        <p className="text-[0.6rem] text-[var(--muted)] ml-9" style={{ fontFamily: "var(--font-dm-sans)" }}>{p.style}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px" style={{ background: "var(--border)" }} />

                <button
                  onClick={handleSaveConfig}
                  disabled={saving || !configName.trim() || !selectedTopics.length}
                  className="w-full py-3 rounded-[10px] text-sm font-semibold text-white disabled:opacity-40 transition-all hover:brightness-110"
                  style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)", boxShadow: "0 4px 20px rgba(0,153,153,0.25)" }}
                >
                  {saving ? "Saving..." : "Save Configuration & Continue"}
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
                    <div key={c.id} className="flex items-center justify-between p-4 rounded-[12px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                      <div>
                        <p className="text-sm font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{c.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full text-[0.55rem] uppercase" style={{ background: "var(--surface)", color: "var(--muted2)", fontFamily: "var(--font-dm-mono)", border: "1px solid var(--border)" }}>
                            {c.difficulty}
                          </span>
                          <span className="text-[0.6rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                            {c.question_count}Q &middot; {c.duration_minutes}min
                          </span>
                        </div>
                        <p className="text-[0.6rem] text-[var(--muted)] mt-1" style={{ fontFamily: "var(--font-dm-sans)" }}>
                          {c.topics?.join(", ")?.slice(0, 80)}{(c.topics?.join(", ")?.length || 0) > 80 ? "..." : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedConfigId(c.id);
                            setShowCreateSession(true);
                            setCreatedLink("");
                            setTab("sessions");
                          }}
                          className="px-3 py-1.5 rounded-[6px] text-[0.65rem] font-medium text-white"
                          style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)" }}
                        >
                          Use
                        </button>
                        <span className="text-[0.6rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
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
