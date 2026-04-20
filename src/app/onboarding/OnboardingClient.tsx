"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ============================================================
   DATA — Categories, subcategories, cities, etc.
   ============================================================ */

type SubcategoryGroup = { group: string; roles: string[] };

const JOB_CATEGORIES: Record<string, SubcategoryGroup[]> = {
  "Software / Internet / AI": [
    { group: "Backend Engineering", roles: ["Backend Engineer", "Full Stack Engineer", "Python Engineer", "Java Engineer", "Go Engineer", "Node.js Engineer"] },
    { group: "Frontend Engineering", roles: ["Frontend Engineer", "React Developer", "Angular Developer", "Vue Developer"] },
    { group: "Data & Analytics", roles: ["Data Analyst", "Data Scientist", "Data Engineer", "Business Analyst", "Power BI Developer"] },
    { group: "Machine Learning & AI", roles: ["ML Engineer", "AI Engineer", "NLP Engineer", "Computer Vision Engineer"] },
    { group: "DevOps & Cloud", roles: ["DevOps Engineer", "Cloud Engineer", "SRE", "Platform Engineer"] },
    { group: "Mobile", roles: ["Android Developer", "iOS Developer", "React Native Developer"] },
    { group: "QA & Testing", roles: ["QA Engineer", "Automation Engineer", "SDET"] },
  ],
  "Finance / Accounting": [
    { group: "Finance", roles: ["Investment Banking", "Financial Analyst", "Risk Analyst", "Chartered Accountant", "CFO", "Controller"] },
  ],
  "Product Management": [
    { group: "Product", roles: ["Product Manager", "Senior PM", "Group PM", "CPO", "Product Analyst"] },
  ],
  "Marketing": [
    { group: "Marketing", roles: ["Digital Marketing", "Growth Marketing", "Content Marketing", "SEO Specialist", "Performance Marketing", "Brand Manager"] },
  ],
  "Consulting": [
    { group: "Consulting", roles: ["Management Consultant", "Strategy Consultant", "IT Consultant", "Business Analyst"] },
  ],
  "Healthcare": [],
  "Electrical Engineering": [],
  "Human Resources / Legal": [],
  "Sales": [],
  "Production / Manufacturing": [],
  "Customer Service": [],
  "Creative & Design": [],
  "Logistics / Supply Chain": [],
  "Education": [],
  "Real Estate": [],
};

const CATEGORY_NAMES = Object.keys(JOB_CATEGORIES);

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"] as const;

const CITIES = [
  "Anywhere in India",
  "Bengaluru",
  "Mumbai",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Delhi NCR",
  "Gurgaon",
  "Noida",
  "Kolkata",
  "Ahmedabad",
  "Remote Only",
];

const EXP_LEVELS = [
  { id: "intern", icon: "\u{1F393}", label: "Intern / New Grad", range: "" },
  { id: "entry", icon: "\u{1F4CB}", label: "Entry Level", range: "0-2 yrs" },
  { id: "mid", icon: "\u{1F4BC}", label: "Mid Level", range: "2-5 yrs" },
  { id: "senior", icon: "\u{1F680}", label: "Senior Level", range: "5-8 yrs" },
  { id: "lead", icon: "\u2B50", label: "Lead / Staff", range: "8+ yrs" },
  { id: "director", icon: "\u{1F454}", label: "Director / Executive", range: "" },
];

const REC_MODES = [
  { id: "match", icon: "\u{1F3AF}", label: "Match-focused", desc: "More strong-fit jobs" },
  { id: "balanced", icon: "\u2696\uFE0F", label: "Balanced", desc: "Mix of match and freshness" },
  { id: "fresh", icon: "\u{1F195}", label: "Freshness-focused", desc: "More newly posted jobs" },
];

const WORK_MODES = ["Remote", "Hybrid", "Onsite"];

const STEP_MESSAGES = [
  "To get started, what type of role are you looking for?",
  "Great choice. Now let\u2019s calibrate your experience level and preferences.",
  "One last step. Let\u2019s level up your search by uploading your resume.",
];

/* ============================================================
   Animation variants
   ============================================================ */
const slideRight = {
  initial: { x: 60, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
};

/* ============================================================
   Main component
   ============================================================ */
export default function OnboardingClient({
  token,
  userName,
}: {
  token: string;
  userName: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORY_NAMES[0]);
  const [jobType, setJobType] = useState<string>("Full-time");
  const [city, setCity] = useState("Anywhere in India");
  const [openToRelocation, setOpenToRelocation] = useState(false);

  // Step 2
  const [expLevel, setExpLevel] = useState("");
  const [recMode, setRecMode] = useState("balanced");
  const [workModes, setWorkModes] = useState<string[]>(["Remote", "Hybrid", "Onsite"]);

  // Step 3
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 4
  const [processingStep, setProcessingStep] = useState(0);
  const [matchCount, setMatchCount] = useState(0);

  // Mobile accordion state
  const [mobileExpandedCategory, setMobileExpandedCategory] = useState<string | null>(CATEGORY_NAMES[0]);

  /* ------- Helpers ------- */

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const selectExpLevel = (id: string) => {
    setExpLevel(id);
  };

  const toggleWorkMode = (mode: string) => {
    setWorkModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const saveStepData = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        await fetch(`${API_URL}/profile/me`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
      } catch {
        // Continue even if save fails
      }
    },
    [token]
  );

  /* ------- Step transitions ------- */

  const goToStep2 = async () => {
    await saveStepData({
      job_preferences: {
        target_roles: selectedRoles,
        job_type: jobType,
        cities: [city],
        open_to_relocation: openToRelocation,
      },
    });
    setStep(2);
  };

  const goToStep3 = async () => {
    await saveStepData({
      experience_level: expLevel,
      job_preferences: {
        target_roles: selectedRoles,
        job_type: jobType,
        cities: [city],
        open_to_relocation: openToRelocation,
        recommendation_mode: recMode,
        work_modes: workModes,
      },
    });
    setStep(3);
  };

  const startProcessing = async () => {
    if (!file) return;
    setStep(4);

    const steps = [
      "Parsing your resume",
      "Extracting skills and experience",
      "Building your AI profile",
      "Finding matching roles",
      "Calibrating match scores",
    ];

    // Upload resume
    const form = new FormData();
    form.append("resume", file);

    try {
      // Step 1: Parse
      setProcessingStep(0);
      await new Promise((r) => setTimeout(r, 800));
      setProcessingStep(1);

      // Upload & parse in parallel
      const [uploadRes, matchRes] = await Promise.allSettled([
        fetch(`${API_URL}/profile/resume`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        }),
        (async () => {
          await new Promise((r) => setTimeout(r, 400));
          setProcessingStep(2);
          await new Promise((r) => setTimeout(r, 600));
          setProcessingStep(3);

          const matchForm = new FormData();
          matchForm.append("resume", file);
          const res = await fetch(`${API_URL}/match/resume`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: matchForm,
          });
          return res.ok ? res.json() : null;
        })(),
      ]);

      // Finish processing animation
      setProcessingStep(4);
      await new Promise((r) => setTimeout(r, 800));

      // Get match count
      let count = 0;
      if (matchRes.status === "fulfilled" && matchRes.value) {
        count = matchRes.value.jobs_matched || matchRes.value.results?.length || 0;
        // Cache results
        try {
          sessionStorage.setItem("sviam_onboarding_matches", JSON.stringify(matchRes.value));
        } catch { /* ignore */ }
      }

      void uploadRes; // acknowledge
      void steps; // used for labels
      setMatchCount(count);
      setStep(5);
    } catch {
      // If processing fails, still go to step 5
      setMatchCount(0);
      setStep(5);
    }
  };

  const completeOnboarding = async () => {
    await saveStepData({
      experience_level: expLevel,
      job_preferences: {
        target_roles: selectedRoles,
        job_type: jobType,
        cities: [city],
        open_to_relocation: openToRelocation,
        recommendation_mode: recMode,
        work_modes: workModes,
        onboarding_completed: true,
      },
    });
    router.push("/dashboard");
  };

  /* ------- File handlers ------- */

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.type === "application/pdf" || dropped.name.endsWith(".docx"))) {
      setFile(dropped);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  /* ------- Processing / Welcome views (steps 4-5) ------- */
  if (step === 4) {
    return <ProcessingView currentStep={processingStep} />;
  }

  if (step === 5) {
    return (
      <WelcomeModal
        count={matchCount}
        expLevel={expLevel}
        recMode={recMode}
        onChangeExpLevel={setExpLevel}
        onChangeRecMode={setRecMode}
        onConfirm={completeOnboarding}
      />
    );
  }

  /* ------- Main split-screen layout (steps 1-3) ------- */
  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Left panel — desktop only */}
      <div className="hidden md:flex w-[380px] shrink-0 flex-col justify-between p-8" style={{ background: "var(--card)" }}>
        <div>
          {/* Logo */}
          <span
            className="gradient-text block mb-12"
            style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontStyle: "italic" }}
          >
            SViam
          </span>

          {/* AI Avatar */}
          <div className="flex flex-col items-center text-center mb-10">
            <div
              className="w-20 h-20 rounded-full mb-4 flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #009999, #33b3b3)",
                padding: 3,
                animation: "gradientBorderPulse 3s ease-in-out infinite",
              }}
            >
              <div
                className="w-full h-full rounded-full flex items-center justify-center"
                style={{ background: "var(--card)" }}
              >
                <span className="text-2xl">&#x2728;</span>
              </div>
            </div>
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "1.3rem", color: "var(--text)" }}>
              Viks
            </span>
            <span className="text-xs text-[var(--muted)] mt-1" style={{ fontFamily: "var(--font-dm-sans)" }}>
              Your SViam AI Copilot
            </span>
          </div>

          {/* Step message */}
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-[var(--muted2)] leading-relaxed text-center"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              {STEP_MESSAGES[step - 1]}
            </motion.p>
          </AnimatePresence>

          {userName && (
            <p className="text-xs text-[var(--muted)] text-center mt-6" style={{ fontFamily: "var(--font-dm-sans)" }}>
              Signed in as {userName}
            </p>
          )}
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-colors duration-300"
              style={{
                background: s <= step ? "linear-gradient(90deg, #009999, #33b3b3)" : "var(--border)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-start md:items-center justify-center p-4 md:p-8 overflow-y-auto min-h-screen">
        {/* Mobile progress */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex gap-1 px-4 pt-3 pb-2" style={{ background: "var(--bg)" }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full"
              style={{ background: s <= step ? "linear-gradient(90deg, #009999, #33b3b3)" : "var(--border)" }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" {...slideRight} transition={{ duration: 0.3 }} className="w-full max-w-[560px] mt-10 md:mt-0">
              <Card>
                <h2 className="text-2xl mb-6 text-[var(--text)]" style={{ fontFamily: "var(--font-serif)", fontSize: 28 }}>
                  What are you looking for?
                </h2>

                {/* Two-column job function selector — desktop */}
                <div className="hidden md:grid grid-cols-[200px_1fr] gap-0 rounded-xl overflow-hidden mb-6" style={{ border: "1px solid var(--border)", maxHeight: 320 }}>
                  {/* Left — categories */}
                  <div className="overflow-y-auto" style={{ borderRight: "1px solid var(--border)", background: "var(--surface)" }}>
                    {CATEGORY_NAMES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className="w-full text-left px-3 py-2.5 text-xs transition-colors"
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          background: activeCategory === cat ? "rgba(0,153,153,0.1)" : "transparent",
                          color: activeCategory === cat ? "var(--teal)" : "var(--muted2)",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Right — subcategories */}
                  <div className="overflow-y-auto p-3">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeCategory}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {JOB_CATEGORIES[activeCategory]?.length === 0 ? (
                          <p className="text-xs text-[var(--muted)] py-4 text-center" style={{ fontFamily: "var(--font-dm-sans)" }}>
                            Coming soon — more roles will be added.
                          </p>
                        ) : (
                          JOB_CATEGORIES[activeCategory]?.map((group) => (
                            <div key={group.group} className="mb-3">
                              <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1.5" style={{ fontFamily: "var(--font-dm-mono)" }}>
                                {group.group}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {group.roles.map((role) => (
                                  <button
                                    key={role}
                                    onClick={() => toggleRole(role)}
                                    className="px-2.5 py-1 rounded-lg text-xs transition-all"
                                    style={{
                                      fontFamily: "var(--font-dm-sans)",
                                      background: selectedRoles.includes(role) ? "rgba(0,153,153,0.15)" : "var(--surface)",
                                      color: selectedRoles.includes(role) ? "var(--teal)" : "var(--muted2)",
                                      border: `1px solid ${selectedRoles.includes(role) ? "rgba(0,153,153,0.3)" : "var(--border)"}`,
                                    }}
                                  >
                                    {role}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Mobile accordion */}
                <div className="md:hidden mb-6 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                  {CATEGORY_NAMES.map((cat) => (
                    <div key={cat} style={{ borderBottom: "1px solid var(--surface)" }}>
                      <button
                        onClick={() => setMobileExpandedCategory(mobileExpandedCategory === cat ? null : cat)}
                        className="w-full text-left px-3 py-2.5 text-xs flex justify-between items-center"
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          color: mobileExpandedCategory === cat ? "var(--teal)" : "var(--muted2)",
                          background: mobileExpandedCategory === cat ? "rgba(0,153,153,0.05)" : "transparent",
                        }}
                      >
                        {cat}
                        <span className="text-[10px]">{mobileExpandedCategory === cat ? "\u25B2" : "\u25BC"}</span>
                      </button>
                      <AnimatePresence>
                        {mobileExpandedCategory === cat && JOB_CATEGORIES[cat]?.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden px-3 pb-3"
                          >
                            {JOB_CATEGORIES[cat].map((group) => (
                              <div key={group.group} className="mb-2">
                                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-dm-mono)" }}>
                                  {group.group}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {group.roles.map((role) => (
                                    <button
                                      key={role}
                                      onClick={() => toggleRole(role)}
                                      className="px-2 py-1 rounded-lg text-xs transition-all"
                                      style={{
                                        fontFamily: "var(--font-dm-sans)",
                                        background: selectedRoles.includes(role) ? "rgba(0,153,153,0.15)" : "var(--surface)",
                                        color: selectedRoles.includes(role) ? "var(--teal)" : "var(--muted2)",
                                        border: `1px solid ${selectedRoles.includes(role) ? "rgba(0,153,153,0.3)" : "var(--border)"}`,
                                      }}
                                    >
                                      {role}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                {/* Selected roles count */}
                {selectedRoles.length > 0 && (
                  <p className="text-xs text-[var(--teal)] mb-4" style={{ fontFamily: "var(--font-dm-sans)" }}>
                    {selectedRoles.length} role{selectedRoles.length !== 1 ? "s" : ""} selected
                  </p>
                )}

                {/* Job type toggle */}
                <div className="mb-5">
                  <p className="text-xs text-[var(--muted2)] mb-2" style={{ fontFamily: "var(--font-dm-sans)" }}>Job Type</p>
                  <div className="flex flex-wrap gap-2">
                    {JOB_TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setJobType(t)}
                        className="px-3 py-1.5 rounded-lg text-xs transition-all"
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          background: jobType === t ? "rgba(0,153,153,0.15)" : "var(--surface)",
                          color: jobType === t ? "var(--teal)" : "var(--muted2)",
                          border: `1px solid ${jobType === t ? "rgba(0,153,153,0.3)" : "var(--border)"}`,
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="mb-5">
                  <p className="text-xs text-[var(--muted2)] mb-2" style={{ fontFamily: "var(--font-dm-sans)" }}>Where are you based out of?</p>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs text-[var(--text)] outline-none"
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c} style={{ background: "var(--card)" }}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Relocation */}
                <label className="flex items-center gap-2 mb-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openToRelocation}
                    onChange={(e) => setOpenToRelocation(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#009999]"
                  />
                  <span className="text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                    Open to relocating for the right opportunity
                  </span>
                </label>

                {/* Next button */}
                <div className="flex justify-end">
                  <button
                    onClick={goToStep2}
                    disabled={selectedRoles.length === 0}
                    className="px-6 py-2.5 rounded-xl text-sm text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed w-full md:w-auto"
                    style={{
                      background: selectedRoles.length > 0 ? "linear-gradient(135deg, #009999, #33b3b3)" : "rgba(0,153,153,0.2)",
                      fontFamily: "var(--font-dm-sans)",
                    }}
                  >
                    Next &rarr;
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" {...slideRight} transition={{ duration: 0.3 }} className="w-full max-w-[560px] mt-10 md:mt-0">
              <Card>
                <h2 className="text-2xl mb-6 text-[var(--text)]" style={{ fontFamily: "var(--font-serif)", fontSize: 28 }}>
                  What&apos;s your experience level?
                </h2>

                {/* Experience level cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-8">
                  {EXP_LEVELS.map((level) => (
                    <motion.button
                      key={level.id}
                      onClick={() => selectExpLevel(level.id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex flex-col items-center p-4 rounded-xl text-center transition-all"
                      style={{
                        background: expLevel === level.id ? "rgba(0,153,153,0.08)" : "var(--surface)",
                        border: `1px solid ${expLevel === level.id ? "rgba(0,153,153,0.4)" : "var(--border)"}`,
                        animation: expLevel === level.id ? "borderGlow 2s ease infinite" : "none",
                      }}
                    >
                      <span className="text-2xl mb-2">{level.icon}</span>
                      <span className="text-xs text-[var(--text)] font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>
                        {level.label}
                      </span>
                      {level.range && (
                        <span className="text-[10px] text-[var(--muted)] mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
                          {level.range}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Recommendation preference */}
                <p className="text-xs text-[var(--muted2)] mb-2" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  Job recommendation preference
                </p>
                <div className="grid grid-cols-3 gap-2 mb-8">
                  {REC_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setRecMode(mode.id)}
                      className="flex flex-col items-center p-3 rounded-xl text-center transition-all"
                      style={{
                        background: recMode === mode.id ? "rgba(0,153,153,0.08)" : "var(--surface)",
                        border: `1px solid ${recMode === mode.id ? "rgba(0,153,153,0.4)" : "var(--border)"}`,
                      }}
                    >
                      <span className="text-lg mb-1">{mode.icon}</span>
                      <span className="text-[11px] text-[var(--text)] font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>
                        {mode.label}
                      </span>
                      <span className="text-[9px] text-[var(--muted)] mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
                        {mode.desc}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Work mode */}
                <p className="text-xs text-[var(--muted2)] mb-2" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  Work mode preference
                </p>
                <div className="flex gap-2 mb-8">
                  {WORK_MODES.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => toggleWorkMode(mode)}
                      className="px-4 py-1.5 rounded-lg text-xs transition-all"
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        background: workModes.includes(mode) ? "rgba(0,153,153,0.15)" : "var(--surface)",
                        color: workModes.includes(mode) ? "var(--teal)" : "var(--muted2)",
                        border: `1px solid ${workModes.includes(mode) ? "rgba(0,153,153,0.3)" : "var(--border)"}`,
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex justify-between gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 rounded-xl text-sm text-[var(--muted2)] transition-colors hover:text-[var(--text)]"
                    style={{ fontFamily: "var(--font-dm-sans)", border: "1px solid var(--border)" }}
                  >
                    &larr; Back
                  </button>
                  <button
                    onClick={goToStep3}
                    className="flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm text-white font-medium"
                    style={{
                      background: "linear-gradient(135deg, #009999, #33b3b3)",
                      fontFamily: "var(--font-dm-sans)",
                    }}
                  >
                    Next &rarr;
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" {...slideRight} transition={{ duration: 0.3 }} className="w-full max-w-[560px] mt-10 md:mt-0">
              <Card>
                <h2 className="text-2xl mb-6 text-[var(--text)]" style={{ fontFamily: "var(--font-serif)", fontSize: 28 }}>
                  Upload your resume
                </h2>

                {/* Upload zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !file && fileInputRef.current?.click()}
                  className="rounded-2xl p-8 md:p-10 text-center cursor-pointer transition-all mb-6"
                  style={{
                    border: `2px dashed ${isDragOver ? "rgba(0,153,153,0.6)" : file ? "rgba(34,197,94,0.3)" : "var(--border2)"}`,
                    background: isDragOver ? "rgba(0,153,153,0.05)" : file ? "rgba(34,197,94,0.03)" : "var(--surface)",
                    animation: isDragOver ? "glowPulse 1.5s ease infinite" : "none",
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      {/* PDF icon */}
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{file.name}</p>
                        <p className="text-[10px] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="text-xs text-red-400 hover:text-red-300 ml-2"
                        style={{ fontFamily: "var(--font-dm-sans)" }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <p className="text-sm text-[var(--text)] mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>
                        Drop your resume here
                      </p>
                      <p className="text-xs text-[var(--muted)] mb-3" style={{ fontFamily: "var(--font-dm-sans)" }}>
                        PDF or Word format &middot; Max 10MB
                      </p>
                      <span className="text-xs text-[var(--teal)] underline" style={{ fontFamily: "var(--font-dm-sans)" }}>
                        Browse files
                      </span>
                    </>
                  )}
                </div>

                {/* Privacy notice */}
                <div
                  className="flex items-start gap-3 p-4 rounded-xl mb-4"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <div>
                    <p className="text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      Your resume is private. It is only used for job matching and will never be shared with third parties.
                    </p>
                    <Link href="/privacy" className="text-[10px] text-[var(--teal)] mt-1 inline-block" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      See our Privacy Policy
                    </Link>
                  </div>
                </div>

                {/* Feature highlight */}
                <div
                  className="p-4 rounded-xl mb-6"
                  style={{ background: "rgba(0,153,153,0.04)", border: "1px solid rgba(0,153,153,0.1)" }}
                >
                  <span
                    className="inline-block text-[9px] px-2 py-0.5 rounded-full mb-2"
                    style={{ background: "rgba(0,153,153,0.15)", color: "var(--teal)", fontFamily: "var(--font-dm-mono)" }}
                  >
                    Feature Highlights
                  </span>
                  <p className="text-sm text-[var(--text)] font-medium mb-2" style={{ fontFamily: "var(--font-dm-sans)" }}>
                    Generate Custom Resume For Each Job
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-16 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}>
                      <div className="p-1.5 space-y-1">
                        <div className="h-1 rounded-full" style={{ background: "var(--border2)", width: "80%" }} />
                        <div className="h-1 rounded-full" style={{ background: "var(--border2)", width: "60%" }} />
                        <div className="h-1 rounded-full" style={{ background: "var(--border2)", width: "70%" }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-10 h-10">
                        <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray={`${0.9 * 94.2} ${94.2}`} strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] text-[#22c55e] font-bold">9.0</span>
                      </div>
                      <span className="text-[10px] text-[#22c55e]" style={{ fontFamily: "var(--font-dm-sans)" }}>Excellent</span>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-xl text-sm text-[var(--muted2)] transition-colors hover:text-[var(--text)]"
                    style={{ fontFamily: "var(--font-dm-sans)", border: "1px solid var(--border)" }}
                  >
                    &larr; Back
                  </button>
                  <button
                    onClick={startProcessing}
                    disabled={!file}
                    className="flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: file ? "linear-gradient(135deg, #009999, #33b3b3)" : "rgba(0,153,153,0.2)",
                      fontFamily: "var(--font-dm-sans)",
                    }}
                  >
                    Start Matching &rarr;
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full rounded-[20px] p-6 md:p-8"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "0 25px 80px rgba(0,0,0,0.08)",
        backdropFilter: "blur(20px)",
      }}
    >
      {children}
    </div>
  );
}

/* ---- Step 4: Processing Animation ---- */

const PROCESSING_STEPS = [
  "Parsing your resume",
  "Extracting skills and experience",
  "Building your AI profile",
  "Finding matching roles",
  "Calibrating match scores",
];

function ProcessingView({ currentStep }: { currentStep: number }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-center max-w-md mx-auto px-6">
        {/* Pulsing logo */}
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mb-10"
        >
          <span
            className="gradient-text inline-block"
            style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem", fontStyle: "italic" }}
          >
            SViam
          </span>
        </motion.div>

        {/* Steps */}
        <div className="space-y-4 text-left">
          {PROCESSING_STEPS.map((label, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -20 }}
              animate={i <= currentStep ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="flex items-center gap-3"
            >
              {i < currentStep ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(34,197,94,0.15)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.div>
              ) : i === currentStep ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 rounded-full shrink-0"
                  style={{ border: "2px solid rgba(0,153,153,0.3)", borderTopColor: "#009999" }}
                />
              ) : (
                <div className="w-6 h-6 rounded-full shrink-0" style={{ background: "var(--surface)" }} />
              )}
              <span
                className="text-sm"
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  color: i <= currentStep ? "var(--text)" : "var(--muted)",
                }}
              >
                {label}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-xs text-[var(--muted)] mt-8"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          Applying advanced AI to create your unique suitability profile...
        </motion.p>
      </div>
    </div>
  );
}

/* ---- Step 5: Welcome Results Modal ---- */

function WelcomeModal({
  count,
  expLevel,
  recMode,
  onChangeExpLevel,
  onChangeRecMode,
  onConfirm,
}: {
  count: number;
  expLevel: string;
  recMode: string;
  onChangeExpLevel: (level: string) => void;
  onChangeRecMode: (mode: string) => void;
  onConfirm: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)", backdropFilter: "blur(20px)" }}>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
        className="w-full max-w-lg rounded-[20px] p-6 md:p-8"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "0 30px 100px rgba(0,0,0,0.08)",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <span
            className="gradient-text inline-block mb-4"
            style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontStyle: "italic" }}
          >
            SViam
          </span>
          <h2
            className="text-xl md:text-2xl text-[var(--text)]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Welcome! We found {count || "several"} roles that fit you best.
          </h2>
          <p className="text-xs text-[var(--muted2)] mt-2" style={{ fontFamily: "var(--font-dm-sans)" }}>
            Based on your resume and preferences
          </p>
        </div>

        {/* Experience levels */}
        <p className="text-xs text-[var(--muted2)] mb-2" style={{ fontFamily: "var(--font-dm-sans)" }}>
          Recommended experience levels
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
          {EXP_LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => onChangeExpLevel(level.id)}
              className="flex items-center gap-2 p-2 rounded-lg text-xs transition-all"
              style={{
                fontFamily: "var(--font-dm-sans)",
                background: expLevel === level.id ? "rgba(0,153,153,0.1)" : "var(--surface)",
                border: `1px solid ${expLevel === level.id ? "rgba(0,153,153,0.35)" : "var(--border)"}`,
                color: expLevel === level.id ? "var(--teal)" : "var(--muted2)",
              }}
            >
              <span>{level.icon}</span>
              <span>{level.label}</span>
            </button>
          ))}
        </div>

        {/* Recommendation mode */}
        <p className="text-xs text-[var(--muted2)] mb-2" style={{ fontFamily: "var(--font-dm-sans)" }}>
          Job recommendation preference
        </p>
        <div className="grid grid-cols-3 gap-2 mb-8">
          {REC_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onChangeRecMode(mode.id)}
              className="flex flex-col items-center p-2.5 rounded-xl text-center transition-all"
              style={{
                background: recMode === mode.id ? "rgba(0,153,153,0.08)" : "var(--surface)",
                border: `1px solid ${recMode === mode.id ? "rgba(0,153,153,0.4)" : "var(--border)"}`,
              }}
            >
              <span className="text-sm mb-0.5">{mode.icon}</span>
              <span className="text-[10px] text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {mode.label}
              </span>
            </button>
          ))}
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm text-white font-medium transition-all disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg, #009999, #33b3b3)",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          {loading ? "Setting up your dashboard..." : "Confirm & See Jobs \u2192"}
        </button>
      </motion.div>
    </div>
  );
}
