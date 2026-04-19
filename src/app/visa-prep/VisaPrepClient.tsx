"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconArrowLeft,
  IconSparkles,
  IconLoader2,
  IconChevronDown,
  IconChevronUp,
  IconBulb,
} from "@tabler/icons-react";
import { generateVisaPrepQuestions } from "@/lib/api";
import type { InterviewQuestion } from "@/lib/api";

const CONSULATES = ["Chennai", "Mumbai", "Hyderabad", "Delhi", "Kolkata"];
const FUNDING_OPTIONS = ["Self-funded", "University Assistantship", "Scholarship", "Loan", "Sponsor"];

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  intent: { bg: "rgba(99,102,241,0.1)", color: "var(--accent)" },
  academic: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6" },
  financial: { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
  "ties-to-home": { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
  "post-graduation": { bg: "rgba(139,92,246,0.1)", color: "#8b5cf6" },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "#10b981", medium: "#f59e0b", hard: "#ef4444",
};

export default function VisaPrepClient({ token }: { token: string }) {
  const [university, setUniversity] = useState("");
  const [program, setProgram] = useState("");
  const [consulate, setConsulate] = useState("");
  const [funding, setFunding] = useState("Self-funded");
  const [workExp, setWorkExp] = useState(0);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!university.trim() || !program.trim()) return;
    setGenerating(true);
    setQuestions([]);
    setError("");
    try {
      const { questions: qs } = await generateVisaPrepQuestions(token, {
        university: university.trim(),
        program: program.trim(),
        consulate_city: consulate,
        funding,
        work_experience_years: workExp,
        question_count: 10,
      });
      setQuestions(qs);
    } catch (err) { console.error("Visa prep generation failed:", err); setError("Failed to generate questions. Please try again."); }
    finally { setGenerating(false); }
  };

  return (
    <main className="min-h-screen pt-14" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 py-2.5 flex items-center justify-between"
        style={{ background: "rgba(10,10,14,0.88)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1 text-sm text-[var(--muted2)] hover:text-[var(--text)] transition-colors"
            style={{ fontFamily: "var(--font-dm-sans)" }}>
            <IconArrowLeft size={14} /> Dashboard
          </Link>
          <span className="text-sm font-semibold text-[var(--text)]" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            F-1 Visa Prep
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-[var(--text)] mb-1" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            F-1 Visa Interview Practice
          </h1>
          <p className="text-sm text-[var(--muted2)] mb-6" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            Simulate a real US consulate interview. AI generates tough, realistic questions based on your profile and consulate patterns.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-5 rounded-[16px] mb-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[0.55rem] text-[var(--muted)] block mb-1 tracking-[0.12em] uppercase" style={{ fontFamily: "var(--font-dm-mono)" }}>University</label>
              <input value={university} onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. University of Texas at Dallas"
                className="w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }} />
            </div>
            <div>
              <label className="text-[0.55rem] text-[var(--muted)] block mb-1 tracking-[0.12em] uppercase" style={{ fontFamily: "var(--font-dm-mono)" }}>Program</label>
              <input value={program} onChange={(e) => setProgram(e.target.value)}
                placeholder="e.g. MS in Computer Science"
                className="w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }} />
            </div>
            <div>
              <label className="text-[0.55rem] text-[var(--muted)] block mb-1 tracking-[0.12em] uppercase" style={{ fontFamily: "var(--font-dm-mono)" }}>Consulate</label>
              <select value={consulate} onChange={(e) => setConsulate(e.target.value)}
                className="w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                <option value="">Any</option>
                {CONSULATES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.55rem] text-[var(--muted)] block mb-1 tracking-[0.12em] uppercase" style={{ fontFamily: "var(--font-dm-mono)" }}>Funding</label>
              <select value={funding} onChange={(e) => setFunding(e.target.value)}
                className="w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                {FUNDING_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.55rem] text-[var(--muted)] block mb-1 tracking-[0.12em] uppercase" style={{ fontFamily: "var(--font-dm-mono)" }}>Work Experience (years)</label>
              <input type="number" min={0} max={20} value={workExp} onChange={(e) => setWorkExp(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }} />
            </div>
          </div>

          <button onClick={handleGenerate}
            disabled={generating || !university.trim() || !program.trim()}
            className="mt-4 w-full py-3 rounded-[10px] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--accent), #7c3aed)", fontFamily: "var(--font-dm-sans)", boxShadow: "0 4px 20px rgba(108,99,255,0.3)" }}>
            {generating ? <><IconLoader2 size={16} className="animate-spin" /> Generating...</> : <><IconSparkles size={16} /> Start Mock Interview</>}
          </button>
          {error && <p className="mt-2 text-xs text-red-400 text-center" style={{ fontFamily: "var(--font-dm-sans)" }}>{error}</p>}
        </motion.div>

        {/* Questions */}
        <AnimatePresence>
          {questions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <h2 className="text-base font-semibold text-[var(--text)]" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                Visa Interview Questions
              </h2>
              {questions.map((q, i) => {
                const catStyle = CATEGORY_COLORS[q.category] || CATEGORY_COLORS.intent;
                const isExpanded = expandedQ === i;
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-[14px] overflow-hidden cursor-pointer"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    onClick={() => setExpandedQ(isExpanded ? null : i)}>
                    <div className="p-4 flex items-start gap-3">
                      <span className="text-sm font-bold flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: "var(--surface)", color: "var(--muted2)", fontFamily: "var(--font-dm-mono)", fontSize: "0.65rem" }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text)] leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)" }}>
                          {q.question}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded-full text-[0.55rem] font-medium uppercase tracking-wide"
                            style={{ background: catStyle.bg, color: catStyle.color, fontFamily: "var(--font-dm-sans)" }}>
                            {q.category}
                          </span>
                          <span className="text-[0.55rem] font-medium uppercase" style={{ color: DIFFICULTY_COLORS[q.difficulty] || "var(--muted)", fontFamily: "var(--font-dm-mono)" }}>
                            {q.difficulty}
                          </span>
                        </div>
                      </div>
                      <span style={{ color: "var(--muted)" }}>
                        {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                      </span>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden">
                          <div className="px-4 pb-4 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                            <div className="flex items-start gap-2 p-3 rounded-[8px]" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)" }}>
                              <IconBulb size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                              <p className="text-xs text-[var(--muted2)] leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                                {q.tip}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
