"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconPlayerPlay,
  IconCheck,
  IconAlertTriangle,
  IconSend,
  IconLoader2,
  IconEye,
  IconBrowserCheck,
  IconClock,
  IconBolt,
  IconCode,
} from "@tabler/icons-react";

type Phase = "waiting" | "briefing" | "active" | "completed";

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

type TranscriptEntry = {
  role: "ai" | "candidate";
  text: string;
  type?: "question" | "answer" | "interrupt" | "code";
};

type Scorecard = {
  verdict: string;
  overall_score: number;
  competencies: Record<string, { score: number; evidence: string; gaps: string }>;
  red_flags: string[];
  standout_moments: string[];
  hiring_recommendation_rationale: string;
};

export default function InterviewRoom({
  sessionId,
  sessionData,
}: {
  sessionId: string;
  sessionData: SessionData;
}) {
  const [phase, setPhase] = useState<Phase>("waiting");
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(sessionData?.config.question_count || 5);
  const [code, setCode] = useState("");
  const [answer, setAnswer] = useState("");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [interrupt, setInterrupt] = useState("");
  const [tabSwitches, setTabSwitches] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [warning, setWarning] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCodeRef = useRef("");
  const codeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  const config = sessionData?.config;
  const candidateName = sessionData?.candidate_name || "Candidate";

  // ── System checks ──
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => setMicReady(true))
      .catch(() => setMicReady(false));

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        setCameraReady(true);
        stream.getTracks().forEach((t) => t.stop());
      })
      .catch(() => setCameraReady(false));
  }, []);

  // ── WebSocket connection ──
  const connectWs = useCallback(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const wsUrl = API_URL.replace("http", "ws") + `/ws/interview/${sessionId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "question":
          setCurrentQuestion(msg.text);
          setQuestionNumber(msg.question_number);
          setTotalQuestions(msg.total_questions);
          setTranscript((prev) => [...prev, { role: "ai", text: msg.text, type: "question" }]);
          setInterrupt("");
          break;

        case "interrupt":
          setInterrupt(msg.text);
          setTranscript((prev) => [...prev, { role: "ai", text: msg.text, type: "interrupt" }]);
          break;

        case "interview_complete":
          setPhase("completed");
          break;

        case "scorecard_generating":
          // Just wait
          break;

        case "scorecard_ready":
          setScorecard(msg.scorecard);
          break;

        case "warning":
          setWarning(msg.message);
          setTimeout(() => setWarning(""), 3000);
          break;

        case "error":
          setWarning(msg.message);
          break;

        case "timeout":
          setPhase("completed");
          break;
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onerror = () => {
      setWsConnected(false);
    };

    return ws;
  }, [sessionId]);

  // ── Start interview ──
  const handleStart = async () => {
    setPhase("briefing");

    // Request permissions
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    } catch {
      // Continue without camera if denied
    }

    // Connect WebSocket
    connectWs();

    // Transition to active after brief delay
    setTimeout(() => setPhase("active"), 2000);
  };

  // ── Timer ──
  useEffect(() => {
    if (phase === "active") {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // ── Code sync every 2 seconds ──
  useEffect(() => {
    if (phase === "active") {
      codeIntervalRef.current = setInterval(() => {
        if (code !== lastCodeRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "code_update", code }));
          lastCodeRef.current = code;
        }
      }, 2000);
    }
    return () => {
      if (codeIntervalRef.current) clearInterval(codeIntervalRef.current);
    };
  }, [phase, code]);

  // ── Tab detection ──
  useEffect(() => {
    if (phase !== "active") return;

    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitches((n) => n + 1);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({ type: "tab_switch_event", timestamp: new Date().toISOString() })
          );
        }
      }
    };

    const handleBlur = () => {
      setTabSwitches((n) => n + 1);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ type: "tab_switch_event", timestamp: new Date().toISOString() })
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [phase]);

  // ── Submit answer ──
  const handleSubmit = () => {
    if (submitting) return;
    setSubmitting(true);

    const payload = {
      type: "answer_submit",
      answer: answer || "(code submission)",
      code,
    };

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }

    setTranscript((prev) => [
      ...prev,
      { role: "candidate", text: answer || code.slice(0, 200), type: "answer" },
    ]);
    setAnswer("");
    setCode("");
    setInterrupt("");
    setSubmitting(false);
  };

  // ── End interview ──
  const handleEnd = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "end_interview" }));
    }
    setPhase("completed");
  };

  // ── Format time ──
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ──────────── RENDER ────────────

  // WAITING PHASE
  if (phase === "waiting") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <span
            className="gradient-text inline-block mb-6"
            style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            SViam
          </span>

          <h1
            className="text-[var(--text)] mb-2"
            style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Your interview is ready
          </h1>
          <p className="text-sm text-[var(--muted2)] mb-8" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            {candidateName} &middot; {config?.name || "Technical Interview"}
          </p>

          {/* System checks */}
          <div
            className="p-5 rounded-[14px] mb-6 text-left space-y-3"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <p className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-dm-mono)" }}>
              System Check
            </p>
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${cameraReady ? "bg-green-500" : "bg-red-400"}`} />
              <span className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                Camera: {cameraReady ? "Detected" : "Not found"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${micReady ? "bg-green-500" : "bg-red-400"}`} />
              <span className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                Microphone: {micReady ? "Detected" : "Not found"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                Screen share: Will be requested on start
              </span>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!micReady}
            className="w-full py-3.5 rounded-[12px] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)", boxShadow: "0 4px 20px rgba(0,153,153,0.3)" }}
          >
            <IconPlayerPlay size={16} /> Start Interview
          </button>

          <p className="text-[0.6rem] text-[var(--muted)] mt-4 leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)" }}>
            Your camera, microphone, and screen will be monitored during this interview. Tab switches and eye movement are tracked.
          </p>
        </motion.div>
      </main>
    );
  }

  // BRIEFING PHASE
  if (phase === "briefing") {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <IconLoader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "var(--teal)" }} />
          <p className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
            Setting up your interview environment...
          </p>
        </motion.div>
      </main>
    );
  }

  // COMPLETED PHASE
  if (phase === "completed") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(0,153,153,0.1)" }}
          >
            <IconCheck size={32} style={{ color: "var(--teal)" }} />
          </div>
          <h1
            className="text-[var(--text)] mb-3"
            style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            Interview Complete
          </h1>
          <p className="text-sm text-[var(--muted2)] mb-8" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            Your responses have been recorded. The hiring team will review your interview shortly.
          </p>

          {scorecard && (
            <div className="p-5 rounded-[14px] text-left" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-[var(--muted)] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono)" }}>
                  Interview Score
                </span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: scorecard.verdict === "Strong Hire" ? "rgba(0,153,153,0.1)" : scorecard.verdict === "Hire" ? "rgba(99,102,241,0.1)" : "rgba(239,68,68,0.1)",
                    color: scorecard.verdict === "Strong Hire" ? "var(--teal)" : scorecard.verdict === "Hire" ? "#6366f1" : "#ef4444",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  {scorecard.verdict}
                </span>
              </div>
              <p className="text-3xl font-bold text-[var(--text)] mb-2" style={{ fontFamily: "var(--font-display)" }}>
                {scorecard.overall_score}/10
              </p>
              <p className="text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                {scorecard.hiring_recommendation_rationale}
              </p>
            </div>
          )}

          {!scorecard && (
            <div className="flex items-center justify-center gap-2 text-sm text-[var(--muted2)]">
              <IconLoader2 size={14} className="animate-spin" />
              <span style={{ fontFamily: "var(--font-dm-sans)" }}>Generating scorecard...</span>
            </div>
          )}

          <p className="mt-8 text-xs text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
            Thank you for interviewing with SViam
          </p>
        </motion.div>
      </main>
    );
  }

  // ACTIVE PHASE — Main interview UI
  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-between"
        style={{ background: "rgba(10,10,14,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-4">
          <span className="gradient-text text-sm font-bold" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            SViam
          </span>
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
            <IconClock size={12} />
            {formatTime(elapsedSeconds)}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
            <IconEye size={12} className="text-green-500" />
            <span>Tracking</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ fontFamily: "var(--font-dm-mono)", color: tabSwitches > 0 ? "#ef4444" : "var(--muted2)" }}>
            <IconBrowserCheck size={12} />
            <span>Tabs: {tabSwitches}</span>
          </div>
          {!wsConnected && (
            <span className="text-[0.6rem] text-red-400" style={{ fontFamily: "var(--font-dm-mono)" }}>Reconnecting...</span>
          )}
          <button
            onClick={handleEnd}
            className="px-3 py-1 rounded-[6px] text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
            style={{ fontFamily: "var(--font-dm-sans)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Warning toast */}
      <AnimatePresence>
        {warning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-[8px] flex items-center gap-2"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <IconAlertTriangle size={14} className="text-red-400" />
            <span className="text-xs text-red-300" style={{ fontFamily: "var(--font-dm-sans)" }}>{warning}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content — two columns */}
      <div className="flex-1 pt-12 flex flex-col lg:flex-row">
        {/* Left — Code editor */}
        <div className="flex-1 flex flex-col p-4 lg:border-r" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <IconCode size={14} style={{ color: "var(--teal)" }} />
            <span className="text-xs text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
              {config?.programming_languages?.[0] || "python"}
            </span>
          </div>

          {/* Code editor (textarea fallback — CodeMirror can be added later) */}
          <textarea
            ref={editorRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Write your solution here..."
            className="flex-1 min-h-[300px] lg:min-h-[400px] p-4 rounded-[12px] text-sm resize-none outline-none focus:ring-1 focus:ring-[var(--teal)]"
            style={{
              background: "#1e1e2e",
              color: "#cdd6f4",
              fontFamily: "var(--font-dm-mono)",
              fontSize: "0.8rem",
              lineHeight: 1.6,
              border: "1px solid var(--border)",
            }}
            spellCheck={false}
          />

          {/* Answer text area */}
          <div className="mt-3">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Explain your approach (optional)..."
              className="w-full p-3 rounded-[10px] text-sm resize-none outline-none focus:ring-1 focus:ring-[var(--teal)]"
              style={{
                background: "var(--surface)",
                color: "var(--text)",
                fontFamily: "var(--font-dm-sans)",
                border: "1px solid var(--border)",
                minHeight: "80px",
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || (!code.trim() && !answer.trim())}
            className="mt-3 w-full py-3 rounded-[10px] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)" }}
          >
            {submitting ? <IconLoader2 size={14} className="animate-spin" /> : <IconSend size={14} />}
            Submit Answer
          </button>
        </div>

        {/* Right — AI interviewer */}
        <div className="lg:w-[400px] flex flex-col p-4">
          {/* AI avatar */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--teal), #7c3aed)", boxShadow: "0 0 12px rgba(0,153,153,0.3)" }}
            >
              <span className="text-xs font-bold text-white">AI</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                Arya — SViam AI
              </p>
              <p className="text-[0.6rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                Question {questionNumber} of {totalQuestions}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 rounded-full mb-4" style={{ background: "var(--surface)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(questionNumber / totalQuestions) * 100}%`, background: "var(--teal)" }}
            />
          </div>

          {/* Current question */}
          <div className="p-4 rounded-[14px] mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p
              className="text-sm text-[var(--text)] leading-relaxed"
              style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 400 }}
            >
              {currentQuestion || "Waiting for question..."}
            </p>
          </div>

          {/* Interrupt display */}
          <AnimatePresence>
            {interrupt && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-[12px] mb-4"
                style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <IconBolt size={12} style={{ color: "#f59e0b" }} />
                  <span className="text-[0.6rem] text-[#f59e0b] uppercase tracking-wider font-semibold" style={{ fontFamily: "var(--font-dm-mono)" }}>
                    Follow-up
                  </span>
                </div>
                <p className="text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  {interrupt}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transcript */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ maxHeight: "300px" }}>
            {transcript.map((entry, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-[10px] text-xs ${entry.role === "ai" ? "mr-4" : "ml-4"}`}
                style={{
                  background: entry.role === "ai" ? "var(--surface)" : "rgba(0,153,153,0.06)",
                  border: entry.type === "interrupt" ? "1px solid rgba(245,158,11,0.2)" : "1px solid var(--border)",
                  fontFamily: "var(--font-dm-sans)",
                  color: "var(--muted2)",
                }}
              >
                {entry.text.slice(0, 150)}
                {entry.text.length > 150 && "..."}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
