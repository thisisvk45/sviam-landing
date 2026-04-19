"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconUpload,
  IconFile,
  IconTrash,
  IconMapPin,
  IconBuilding,
  IconX,
  IconSparkles,
  IconCheck,
  IconArrowRight,
  IconArrowLeft,
  IconFileText,
  IconSearch,
  IconTarget,
  IconExternalLink,
  IconBookmark,
  IconBookmarkFilled,
  IconBriefcase,
  IconCopy,
  IconMenu2,
  IconBulb,
  IconLoader2,
} from "@tabler/icons-react";
import SignOutButton from "./SignOutButton";
import JobCard from "@/components/JobCard";
import ErrorBoundary from "@/components/ErrorBoundary";
import { JobCardSkeleton } from "@/components/Skeleton";
import {
  matchStored,
  listResumes,
  uploadUserResume,
  deleteResume,
  parseResume,
  updateProfile,
  getProfile,
  saveJob,
  unsaveJob,
  getSavedJobs,
  suggestSkills,
  generateCoverLetter,
  tailorResume,
  getJob,
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  explainMatch,
  getSimilarJobs,
} from "@/lib/api";
import type { MatchResult, UserResume, ResumeData, Application, ApplicationStatus, SavedJob, TailorChange, JobDetail } from "@/lib/api";
import { ScoreRing } from "@/components/JobCard";

const INDIAN_CITIES = [
  "Bangalore", "Mumbai", "Delhi NCR", "Hyderabad", "Chennai",
  "Pune", "Kolkata", "Ahmedabad", "Noida", "Gurgaon", "Jaipur",
];
const WORK_MODES = ["All", "Remote", "Hybrid", "Onsite"] as const;
const EXP_LEVELS = [
  { value: "Fresher", label: "Fresher (0-1 years)" },
  { value: "Junior", label: "Junior (1-3 years)" },
  { value: "Mid", label: "Mid-level (3-6 years)" },
  { value: "Senior", label: "Senior (6-10 years)" },
  { value: "Lead", label: "Lead / Staff (10+ years)" },
];
const SALARY_RANGES = [
  "0-3 LPA", "3-6 LPA", "6-10 LPA", "10-15 LPA", "15-25 LPA", "25-50 LPA", "50+ LPA",
];

function capitalize(s: string) {
  if (!s) return "";
  return s.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

function guessExpLevel(experience: ResumeData["experience"]): string {
  if (!experience || experience.length === 0) return "Fresher";
  const totalYears = experience.reduce((sum, exp) => {
    const sy = parseInt(exp.start) || 0;
    const ey = exp.end?.toLowerCase().includes("present") ? new Date().getFullYear() : parseInt(exp.end) || sy;
    return sum + Math.max(0, ey - sy);
  }, 0);
  if (totalYears <= 1) return "Fresher";
  if (totalYears <= 3) return "Junior";
  if (totalYears <= 6) return "Mid";
  if (totalYears <= 10) return "Senior";
  return "Lead";
}

/* ─── Animated processing visualization ─── */
function ProcessingAnimation({ stage }: { stage: "uploading" | "parsing" | "matching" }) {
  const stages = [
    { key: "uploading", label: "Uploading your resume...", icon: <IconUpload size={18} /> },
    { key: "parsing", label: "Reading & extracting details...", icon: <IconFileText size={18} /> },
    { key: "matching", label: "Analyzing your profile...", icon: <IconSearch size={18} /> },
  ];
  const currentIdx = stages.findIndex((s) => s.key === stage);

  return (
    <div className="flex flex-col items-center py-20">
      <div className="relative w-24 h-24 mb-8">
        <motion.div className="absolute inset-0 rounded-full" style={{ border: "3px solid rgba(99,102,241,0.15)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute inset-2 rounded-full" style={{ border: "3px solid rgba(99,102,241,0.25)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }} />
        <motion.div className="absolute inset-4 rounded-full flex items-center justify-center"
          style={{ background: "rgba(99,102,241,0.1)", border: "2px solid rgba(99,102,241,0.3)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
            style={{ color: "var(--accent)" }}>
            <IconSparkles size={24} />
          </motion.div>
        </motion.div>
      </div>
      <div className="space-y-2.5 w-full max-w-xs">
        {stages.map((s, i) => (
          <motion.div key={s.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: i < currentIdx ? "rgba(16,185,129,0.15)" : i === currentIdx ? "rgba(99,102,241,0.15)" : "var(--surface)",
                color: i < currentIdx ? "#10b981" : i === currentIdx ? "var(--accent)" : "var(--muted)",
                border: i === currentIdx ? "1px solid rgba(99,102,241,0.3)" : "1px solid var(--border)",
              }}>
              {i < currentIdx ? <IconCheck size={14} /> : s.icon}
            </div>
            <p className="text-sm" style={{
              fontFamily: "var(--font-dm-sans)", fontWeight: i === currentIdx ? 500 : 300,
              color: i <= currentIdx ? "var(--text)" : "var(--muted)",
            }}>
              {s.label}
            </p>
            {i === currentIdx && (
              <motion.div className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: "var(--accent)" }}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

type OnboardingStep = "upload" | "processing" | "review" | "preferences" | "done";

export default function DashboardClient({
  token, email, userName,
}: {
  token: string; email: string; userName: string;
}) {
  // Core
  const [resumes, setResumes] = useState<UserResume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [resumeText, setResumeText] = useState("");

  // Pipeline & Saved
  const [activeTab, setActiveTab] = useState<"matches" | "pipeline" | "saved">("matches");
  const [applications, setApplications] = useState<Application[]>([]);
  const [pipelineFilter, setPipelineFilter] = useState<ApplicationStatus | "all">("all");
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);

  // Selected job detail view (replaces list when set)
  const [selectedJob, setSelectedJob] = useState<MatchResult | null>(null);

  // Filters
  const [cityFilter, setCityFilter] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [workMode, setWorkMode] = useState("All");
  const [showCityInput, setShowCityInput] = useState(false);

  // Upload
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [resumeLabel, setResumeLabel] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);

  // Onboarding
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("upload");
  const [parseStage, setParseStage] = useState<"uploading" | "parsing" | "matching">("uploading");
  const [parsedResume, setParsedResume] = useState<ResumeData | null>(null);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", city: "", experience_level: "" });
  const [preferences, setPreferences] = useState({
    target_roles: "",
    preferred_cities: [] as string[],
    work_mode: "Any",
    salary_range: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const onboardingUploadRef = useRef<HTMLInputElement>(null);

  // Profile completeness
  const [profileComplete, setProfileComplete] = useState<Record<string, boolean>>({});
  const [profileScore, setProfileScore] = useState(0);
  // Auto-apply status
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(false);
  const [autoApplyMax, setAutoApplyMax] = useState(10);
  // Cover letter cache (persists across re-renders within session)
  const coverLetterCache = useRef<Record<string, string>>({});
  // Job detail cache (avoid re-fetching when navigating back and forth)
  const jobDetailCache = useRef<Record<string, JobDetail>>({});
  // Inline tailor panel
  const [tailorJob, setTailorJob] = useState<MatchResult | null>(null);

  const firstName = capitalize(userName?.split(" ")[0] || "");
  const isNewUser = !initialLoading && resumes.length === 0 && matches.length === 0;

  const computeProfileCompleteness = useCallback((profile: Record<string, unknown>) => {
    const prefs = (profile.job_preferences || {}) as Record<string, unknown>;
    const atsProfile = (prefs.ats_profile || {}) as Record<string, unknown>;
    const autoApplyData = (prefs.auto_apply || {}) as Record<string, unknown>;
    const fields = {
      name: !!profile.name,
      phone: !!profile.phone,
      city: !!profile.city,
      experience: !!profile.experience_level,
      resume: !!profile.resume_url || resumes.length > 0,
      linkedin: !!atsProfile.linkedin,
      work_auth: !!atsProfile.work_authorization,
      target_roles: !!(prefs.target_roles && (prefs.target_roles as string[]).length > 0),
    };
    setProfileComplete(fields);

    // Compute weighted score
    let score = 0;
    if (fields.name) score += 10;
    if (fields.phone) score += 10;
    if (fields.city) score += 10;
    if (fields.experience) score += 10;
    if (fields.linkedin) score += 10;
    if (fields.resume) score += 20;
    if (fields.target_roles) score += 15;
    if (atsProfile.expected_ctc) score += 10;
    if (fields.work_auth) score += 5;
    setProfileScore(score);

    setAutoApplyEnabled(!!autoApplyData.enabled);
    setAutoApplyMax(Number(autoApplyData.max_per_day) || 10);
  }, [resumes.length]);

  // Load dismissed jobs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sviam_dismissed");
      if (stored) setDismissedIds(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
  }, []);

  const fetchMatches = useCallback(async (resumeId?: string) => {
    setMatchesLoading(true);
    try {
      const data = await matchStored(token, { resume_id: resumeId, limit: 50 });
      setMatches(data.results);
    } catch { /* no matches */ }
    finally { setMatchesLoading(false); }
  }, [token]);

  // Initial load — all independent calls in parallel
  useEffect(() => {
    // Persist role (seeker/hirer) from sign-in fork selection
    try {
      const storedRole = localStorage.getItem("sviam-role");
      if (storedRole) {
        const role = storedRole === "hirer" ? "company" : "candidate";
        updateProfile(token, { job_preferences: { role } }).catch(() => {});
        localStorage.removeItem("sviam-role");
      }
    } catch { /* ignore */ }

    // Fire all independent loads at once
    const resumePromise = listResumes(token).catch(() => ({ resumes: [] as UserResume[] }));
    const profilePromise = getProfile(token).catch(() => null);
    const savedPromise = getSavedJobs(token).then((res) => {
      setSavedJobs(res.saved_jobs);
      setSavedJobIds(new Set(res.saved_jobs.map((j) => j.job_id)));
    }).catch(() => {});
    const appsPromise = fetchApplications();

    // Resume + profile drive match loading
    Promise.all([resumePromise, profilePromise, savedPromise, appsPromise]).then(async ([resumeRes, profile]) => {
      const ur = resumeRes.resumes;
      setResumes(ur);
      if (profile) computeProfileCompleteness(profile);

      if (ur.length > 0) {
        setSelectedResumeId(ur[0].id);
        fetchMatches(ur[0].id);
      } else {
        // Check localStorage for tryit results
        try {
          const stored = localStorage.getItem("sviam_tryit_results");
          if (stored) {
            const parsed = JSON.parse(stored) as MatchResult[];
            if (parsed.length > 0) { setMatches(parsed); localStorage.removeItem("sviam_tryit_results"); }
          }
        } catch { /* ignore */ }
        // Fallback: use profile resume text
        if (profile?.resume_text) { setResumeText(profile.resume_text); fetchMatches(); }
      }
    }).finally(() => setInitialLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ─── Onboarding handlers ───
  const handleOnboardingUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) { setUploadError("Only PDF files are accepted."); return; }
    setUploadError("");
    setOnboardingStep("processing");
    setParseStage("uploading");
    try {
      const newResume = await uploadUserResume(token, file, "Resume 1");
      setResumes([newResume]);
      setSelectedResumeId(newResume.id);

      setParseStage("parsing");
      try {
        const parsed = await parseResume(token, file);
        setParsedResume(parsed);
        setProfileForm({
          name: parsed.personal?.name || userName || "",
          phone: parsed.personal?.phone || "",
          city: parsed.personal?.city || "",
          experience_level: guessExpLevel(parsed.experience),
        });
        // Get skill suggestions
        try {
          const { suggested_skills } = await suggestSkills(token, {
            experience: parsed.experience || [],
            current_skills: parsed.skills || [],
          });
          setSuggestedSkills(suggested_skills);
        } catch { /* silent */ }
      } catch {
        setProfileForm({ name: userName || "", phone: "", city: "", experience_level: "Fresher" });
      }
      setOnboardingStep("review");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setOnboardingStep("upload");
    }
  };

  const handleSaveAndPreferences = async () => {
    setSavingProfile(true);
    try { await updateProfile(token, profileForm); } catch { /* continue */ }
    setSavingProfile(false);
    setOnboardingStep("preferences");
  };

  const handleFinishOnboarding = async () => {
    // Save preferences
    setSavingProfile(true);
    try {
      // Merge with existing job_preferences to preserve role
      let existing: Record<string, unknown> = {};
      try {
        const profile = await getProfile(token);
        if (profile.job_preferences && typeof profile.job_preferences === "object") {
          existing = profile.job_preferences as Record<string, unknown>;
        }
      } catch { /* ignore */ }
      await updateProfile(token, {
        job_preferences: {
          ...existing,
          target_roles: preferences.target_roles.split(",").map((r) => r.trim()).filter(Boolean),
          preferred_cities: preferences.preferred_cities,
          work_mode: preferences.work_mode,
          salary_range: preferences.salary_range,
        },
      });
    } catch { /* continue */ }
    setSavingProfile(false);
    setOnboardingStep("done");
    fetchMatches(selectedResumeId || undefined);
  };

  // ─── Regular handlers ───
  const handleAddResume = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) { setUploadError("Only PDF files are accepted."); return; }
    setUploading(true); setUploadError("");
    try {
      const label = resumeLabel.trim() || `Resume ${resumes.length + 1}`;
      const nr = await uploadUserResume(token, file, label);
      setResumes((prev) => [...prev, nr]);
      setSelectedResumeId(nr.id);
      setShowUploadPanel(false);
      setResumeLabel("");
      fetchMatches(nr.id);
    } catch (err) { setUploadError(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); }
  };

  const handleDeleteResume = async (id: string) => {
    try {
      await deleteResume(token, id);
      const remaining = resumes.filter((r) => r.id !== id);
      setResumes(remaining);
      if (selectedResumeId === id) {
        if (remaining.length > 0) { setSelectedResumeId(remaining[0].id); fetchMatches(remaining[0].id); }
        else { setSelectedResumeId(""); setMatches([]); }
      }
    } catch (err) { console.error("Failed to delete resume:", err); }
  };

  const handleResumeChange = (id: string) => { setSelectedResumeId(id); fetchMatches(id); };

  const handleSave = async (jobId: string) => {
    try {
      await saveJob(token, jobId);
      setSavedJobIds((prev) => new Set(prev).add(jobId));
      const job = matches.find((m) => m.job_id === jobId);
      if (job) {
        setSavedJobs((prev) => [{ user_id: "", job_id: jobId, title: job.title, company: job.company, city: job.city, created_at: new Date().toISOString() }, ...prev]);
      }
    } catch (err) { console.error("Failed to save job:", err); }
  };
  const handleUnsave = async (jobId: string) => {
    try {
      await unsaveJob(token, jobId);
      setSavedJobIds((prev) => { const n = new Set(prev); n.delete(jobId); return n; });
      setSavedJobs((prev) => prev.filter((j) => j.job_id !== jobId));
    } catch (err) { console.error("Failed to unsave job:", err); }
  };
  const handleDismiss = (jobId: string) => {
    setDismissedIds((prev) => {
      const n = new Set(prev); n.add(jobId);
      try { localStorage.setItem("sviam_dismissed", JSON.stringify([...n])); } catch { /* ignore */ }
      return n;
    });
  };

  const fetchApplications = useCallback(async () => {
    try {
      const { applications: apps } = await getApplications(token);
      setApplications(apps);
    } catch (err) { console.error("Failed to fetch applications:", err); }
  }, [token]);

  const handleQueueJob = async (job: MatchResult) => {
    try {
      const app = await createApplication(token, {
        job_id: job.job_id,
        title: job.title,
        company: job.company,
        city: job.city,
        apply_url: job.apply_url,
      });
      setApplications((prev) => [app, ...prev]);
      setActiveTab("pipeline");
    } catch (err) {
      if (err instanceof Error && err.message.includes("already")) {
        setActiveTab("pipeline");
      }
    }
  };

  const handleUpdateStatus = async (appId: string, status: ApplicationStatus) => {
    try {
      const updated = await updateApplication(token, appId, { status });
      setApplications((prev) => prev.map((a) => a.id === appId ? updated : a));
    } catch (err) { console.error("Failed to update application status:", err); }
  };

  const handleRemoveApplication = async (appId: string) => {
    try {
      await deleteApplication(token, appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    } catch (err) { console.error("Failed to remove application:", err); }
  };

  const handleUpdateNotes = async (appId: string, notes: string) => {
    try {
      const updated = await updateApplication(token, appId, { notes });
      setApplications((prev) => prev.map((a) => a.id === appId ? updated : a));
    } catch (err) { console.error("Failed to update notes:", err); }
  };

  const handleTailor = (job: MatchResult) => {
    setTailorJob(job);
  };

  const handleCoverLetter = async (job: MatchResult, tone: "formal" | "creative"): Promise<string> => {
    // Check cache first (keyed by job_id + tone)
    const cacheKey = `${job.job_id}_${tone}`;
    if (coverLetterCache.current[cacheKey]) {
      return coverLetterCache.current[cacheKey];
    }
    const profile = await getProfile(token);
    const { cover_letter } = await generateCoverLetter(token, {
      resume_text: profile.resume_text || resumeText || "",
      job_title: job.title,
      company: job.company,
      city: job.city || "",
      tone,
    });
    // Cache it
    coverLetterCache.current[cacheKey] = cover_letter;
    return cover_letter;
  };

  // Filters
  const effectiveCity = cityFilter === "Other" ? customCity : cityFilter;
  const filteredMatches = matches
    .filter((job) => !dismissedIds.has(job.job_id))
    .filter((job) => {
      if (effectiveCity && !job.city.toLowerCase().includes(effectiveCity.toLowerCase())) return false;
      if (workMode !== "All") {
        const jt = (job.work_type || (job.remote ? "Remote" : "Onsite")).toLowerCase();
        if (jt !== workMode.toLowerCase()) return false;
      }
      return true;
    });

  // ─── Loading ───
  if (initialLoading) {
    return (
      <main className="min-h-screen pt-20" style={{ background: "var(--bg)" }}>
        <TopBar firstName={firstName} subtitle="Loading..." />
        <div className="max-w-6xl mx-auto px-6 py-8 animate-pulse space-y-4">
          <div className="h-8 rounded w-56" style={{ background: "var(--surface)" }} />
          <div className="h-14 rounded-[14px] w-full" style={{ background: "var(--surface)" }} />
          {[0, 1, 2].map((i) => <JobCardSkeleton key={i} />)}
        </div>
      </main>
    );
  }

  // ═══════════════════════════════════════
  //  ONBOARDING
  // ═══════════════════════════════════════
  if (isNewUser && onboardingStep !== "done") {
    return (
      <ErrorBoundary>
        <main className="min-h-screen pt-14" style={{ background: "var(--bg)" }}>
          <TopBar firstName={firstName} />
          <BgGradient />

          <div className="relative z-10 max-w-3xl mx-auto px-6 pt-10 pb-16">
            <AnimatePresence mode="wait">
              {/* ── Upload ── */}
              {onboardingStep === "upload" && (
                <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <div className="mb-8">
                    <h1 className="text-[var(--text)] mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                      Welcome, {firstName || "there"}
                    </h1>
                    <p className="text-[var(--muted2)] text-base max-w-lg" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300, lineHeight: 1.6 }}>
                      Upload your resume and we&apos;ll build your profile, analyze your skills, and match you with the best jobs.
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
                    <div className="p-7 rounded-[20px]" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))", border: "1px solid rgba(99,102,241,0.15)" }}>
                      <div onClick={() => onboardingUploadRef.current?.click()}
                        className="py-16 rounded-[14px] text-center cursor-pointer transition-all duration-300 hover:border-[var(--accent)] hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]"
                        style={{ border: "2px dashed var(--border)" }}>
                        <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                          style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
                          <IconUpload size={26} style={{ color: "var(--accent)" }} />
                        </div>
                        <p className="text-[var(--text)] text-base font-medium mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>
                          Drop your resume or click to upload
                        </p>
                        <p className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                          We&apos;ll auto-fill everything from your CV
                        </p>
                        <p className="text-xs text-[var(--muted)] mt-2" style={{ fontFamily: "var(--font-dm-mono)" }}>PDF only</p>
                        <input ref={onboardingUploadRef} type="file" accept=".pdf" className="hidden"
                          onChange={(e) => { if (e.target.files?.[0]) handleOnboardingUpload(e.target.files[0]); }} />
                      </div>
                      {uploadError && <p className="text-sm mt-3 text-center" style={{ color: "#ef4444", fontFamily: "var(--font-dm-sans)" }}>{uploadError}</p>}
                    </div>

                    <div className="p-6 rounded-[20px] flex flex-col justify-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                      <h3 className="text-[var(--text)] text-sm font-semibold mb-5" style={{ fontFamily: "var(--font-dm-sans)" }}>How it works</h3>
                      <div className="space-y-4">
                        {[
                          { icon: <IconFileText size={16} />, text: "We parse your resume and build your profile", bg: "rgba(99,102,241,0.1)" },
                          { icon: <IconTarget size={16} />, text: "You tell us your job preferences and goals", bg: "rgba(139,92,246,0.1)" },
                          { icon: <IconSparkles size={16} />, text: "AI matches you with the best-fit jobs", bg: "rgba(245,158,11,0.1)" },
                          { icon: <IconCheck size={16} />, text: "Review, filter, tailor resume, and apply", bg: "rgba(16,185,129,0.1)" },
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: item.bg, color: "var(--accent)" }}>{item.icon}</div>
                            <p className="text-sm text-[var(--muted2)] pt-1.5" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>{item.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Processing ── */}
              {onboardingStep === "processing" && (
                <motion.div key="processing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <div className="rounded-[20px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <ProcessingAnimation stage={parseStage} />
                  </div>
                </motion.div>
              )}

              {/* ── Review Profile ── */}
              {onboardingStep === "review" && (
                <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <div className="grid lg:grid-cols-[1.1fr_1fr] gap-5">
                    <div className="p-7 rounded-[20px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-2 mb-5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
                          <IconCheck size={14} color="#10b981" />
                        </div>
                        <p className="text-xs text-[#10b981] font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>Resume uploaded</p>
                      </div>
                      <h2 className="text-[var(--text)] text-lg font-semibold mb-1" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Review your profile</h2>
                      <p className="text-sm text-[var(--muted2)] mb-5" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>Extracted from your CV. Correct anything off.</p>

                      <div className="space-y-3.5">
                        <FField label="Full Name"><FInput value={profileForm.name} onChange={(v) => setProfileForm({ ...profileForm, name: v })} /></FField>
                        <FField label="Phone"><FInput value={profileForm.phone} onChange={(v) => setProfileForm({ ...profileForm, phone: v })} placeholder="+91 98765 43210" /></FField>
                        <FField label="City">
                          <select value={INDIAN_CITIES.includes(profileForm.city) ? profileForm.city : profileForm.city ? "__other" : ""}
                            onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value === "__other" ? "" : e.target.value })}
                            className="w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                            <option value="">Select city</option>
                            {INDIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            <option value="__other">Other</option>
                          </select>
                          {!INDIAN_CITIES.includes(profileForm.city) && profileForm.city !== "" && (
                            <FInput value={profileForm.city} onChange={(v) => setProfileForm({ ...profileForm, city: v })} placeholder="Type your city" className="mt-2" />
                          )}
                        </FField>
                        <FField label="Experience Level">
                          <select value={profileForm.experience_level}
                            onChange={(e) => setProfileForm({ ...profileForm, experience_level: e.target.value })}
                            className="w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                            <option value="">Select level</option>
                            {EXP_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                          </select>
                        </FField>
                      </div>

                      <button onClick={handleSaveAndPreferences} disabled={savingProfile}
                        className="w-full mt-5 py-3 rounded-[10px] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
                        style={{ background: "linear-gradient(135deg, var(--accent), #7c3aed)", fontFamily: "var(--font-dm-sans)", boxShadow: "0 4px 20px rgba(108,99,255,0.3)" }}>
                        {savingProfile ? "Saving..." : <>Next: Job Preferences <IconArrowRight size={15} /></>}
                      </button>
                    </div>

                    {/* Right: Skills & Experience */}
                    <div className="space-y-4">
                      {parsedResume?.skills && parsedResume.skills.length > 0 && (
                        <div className="p-5 rounded-[20px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                          <h3 className="text-[var(--text)] text-sm font-semibold mb-3" style={{ fontFamily: "var(--font-dm-sans)" }}>Your skills</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {parsedResume.skills.slice(0, 15).map((s) => (
                              <span key={s} className="px-2 py-0.5 rounded-full text-[0.65rem]"
                                style={{ background: "rgba(99,102,241,0.1)", color: "var(--accent)", border: "1px solid rgba(99,102,241,0.2)", fontFamily: "var(--font-dm-sans)" }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {suggestedSkills.length > 0 && (
                        <div className="p-5 rounded-[20px]" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.04), rgba(239,68,68,0.02))", border: "1px solid rgba(245,158,11,0.15)" }}>
                          <h3 className="text-[var(--text)] text-sm font-semibold mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>Skills to consider adding</h3>
                          <p className="text-xs text-[var(--muted2)] mb-3" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>Based on your experience, these skills could strengthen your profile:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {suggestedSkills.slice(0, 10).map((s) => (
                              <span key={s} className="px-2 py-0.5 rounded-full text-[0.65rem]"
                                style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)", fontFamily: "var(--font-dm-sans)" }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {parsedResume?.experience && parsedResume.experience.length > 0 && (
                        <div className="p-5 rounded-[20px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                          <h3 className="text-[var(--text)] text-sm font-semibold mb-3" style={{ fontFamily: "var(--font-dm-sans)" }}>Experience</h3>
                          <div className="space-y-2.5">
                            {parsedResume.experience.slice(0, 3).map((exp, i) => (
                              <div key={i} className="p-2.5 rounded-[8px]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                <p className="text-sm text-[var(--text)] font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>{exp.title}</p>
                                <p className="text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>{exp.company} &middot; {exp.start}{exp.end ? ` - ${exp.end}` : ""}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Job Preferences ── */}
              {onboardingStep === "preferences" && (
                <motion.div key="preferences" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <div className="p-7 rounded-[20px] max-w-xl mx-auto" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <h2 className="text-[var(--text)] text-lg font-semibold mb-1" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>What are you looking for?</h2>
                    <p className="text-sm text-[var(--muted2)] mb-6" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>This helps us find the most relevant jobs for you.</p>

                    <div className="space-y-4">
                      <FField label="Target Roles">
                        <FInput value={preferences.target_roles} onChange={(v) => setPreferences({ ...preferences, target_roles: v })}
                          placeholder="e.g. Data Analyst, Product Manager, Frontend Developer" />
                        <p className="text-[0.6rem] text-[var(--muted)] mt-1" style={{ fontFamily: "var(--font-dm-mono)" }}>Separate multiple roles with commas</p>
                      </FField>

                      <FField label="Preferred Cities">
                        <div className="flex flex-wrap gap-1.5">
                          {INDIAN_CITIES.map((c) => {
                            const selected = preferences.preferred_cities.includes(c);
                            return (
                              <button key={c} onClick={() => {
                                setPreferences((p) => ({
                                  ...p,
                                  preferred_cities: selected ? p.preferred_cities.filter((x) => x !== c) : [...p.preferred_cities, c],
                                }));
                              }}
                                className="px-2.5 py-1 rounded-full text-xs transition-all"
                                style={{
                                  background: selected ? "rgba(99,102,241,0.12)" : "var(--surface)",
                                  border: selected ? "1px solid rgba(99,102,241,0.3)" : "1px solid var(--border)",
                                  color: selected ? "var(--accent)" : "var(--muted2)",
                                  fontFamily: "var(--font-dm-sans)",
                                }}>
                                {selected && <IconCheck size={10} className="inline mr-1" />}{c}
                              </button>
                            );
                          })}
                        </div>
                      </FField>

                      <FField label="Work Mode">
                        <div className="flex gap-2">
                          {["Any", "Remote", "Hybrid", "Onsite"].map((m) => (
                            <button key={m} onClick={() => setPreferences({ ...preferences, work_mode: m })}
                              className="px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all"
                              style={{
                                background: preferences.work_mode === m ? "rgba(99,102,241,0.12)" : "var(--surface)",
                                border: preferences.work_mode === m ? "1px solid rgba(99,102,241,0.3)" : "1px solid var(--border)",
                                color: preferences.work_mode === m ? "var(--accent)" : "var(--muted2)",
                                fontFamily: "var(--font-dm-sans)",
                              }}>{m}</button>
                          ))}
                        </div>
                      </FField>

                      <FField label="Expected Salary (Annual)">
                        <select value={preferences.salary_range}
                          onChange={(e) => setPreferences({ ...preferences, salary_range: e.target.value })}
                          className="w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none"
                          style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                          <option value="">Select range</option>
                          {SALARY_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </FField>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setOnboardingStep("review")}
                        className="px-4 py-3 rounded-[10px] text-sm font-medium flex items-center gap-1"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted2)", fontFamily: "var(--font-dm-sans)" }}>
                        <IconArrowLeft size={14} /> Back
                      </button>
                      <button onClick={handleFinishOnboarding} disabled={savingProfile}
                        className="flex-1 py-3 rounded-[10px] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
                        style={{ background: "linear-gradient(135deg, var(--accent), #7c3aed)", fontFamily: "var(--font-dm-sans)", boxShadow: "0 4px 20px rgba(108,99,255,0.3)" }}>
                        {savingProfile ? "Saving..." : <>Find My Jobs <IconSparkles size={15} /></>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </ErrorBoundary>
    );
  }

  // ═══════════════════════════════════════
  //  MAIN DASHBOARD
  // ═══════════════════════════════════════
  return (
    <ErrorBoundary>
      <main className="min-h-screen pt-14" style={{ background: "var(--bg)" }}>
        <TopBar firstName={firstName} subtitle={
          matchesLoading ? "Finding matches..." : filteredMatches.length > 0 ? `${filteredMatches.length} jobs matched` : "Dashboard"
        } />
        <BgGradient subtle />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-6">
          {/* Greeting */}
          <div className="mb-4">
            <h1 className="text-[var(--text)] mb-0.5" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
              {firstName ? `Hello, ${firstName}` : "Your Jobs"}
            </h1>
          </div>

          {/* Profile completion */}
          {Object.keys(profileComplete).length > 0 && profileScore < 100 && (
            <ProfileCompletionBar fields={profileComplete} score={profileScore} />
          )}

          {/* Auto-apply status */}
          <AutoApplyStatus enabled={autoApplyEnabled} maxPerDay={autoApplyMax || 1} appliedToday={applications.filter((a) => { if (a.status !== "applied" || !a.applied_at) return false; const d = new Date(a.applied_at); return !isNaN(d.getTime()) && d.toDateString() === new Date().toDateString(); }).length} />

          {/* Filter bar */}
          <div className="p-2.5 rounded-[12px] mb-4 flex flex-wrap items-center gap-2"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {resumes.length > 0 && (
              <Chip value={selectedResumeId} onChange={handleResumeChange} icon={<IconFile size={11} />}>
                {resumes.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </Chip>
            )}
            <Chip value={cityFilter} onChange={(v) => { setCityFilter(v); setShowCityInput(v === "Other"); if (v !== "Other") setCustomCity(""); }} icon={<IconMapPin size={11} />}>
              <option value="">All Cities</option>
              {INDIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="Other">Other</option>
            </Chip>
            {showCityInput && (
              <div className="relative">
                <input type="text" placeholder="Type city..." value={customCity} onChange={(e) => setCustomCity(e.target.value)}
                  className="pl-2.5 pr-6 py-1.5 rounded-[8px] text-[0.7rem] text-[var(--text)] outline-none"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)", width: 110 }} />
                {customCity && <button onClick={() => setCustomCity("")} className="absolute right-1.5 top-1/2 -translate-y-1/2"><IconX size={10} style={{ color: "var(--muted)" }} /></button>}
              </div>
            )}
            <Chip value={workMode} onChange={setWorkMode} icon={<IconBuilding size={11} />}>
              {WORK_MODES.map((m) => <option key={m} value={m}>{m === "All" ? "All Modes" : m}</option>)}
            </Chip>
            <div className="ml-auto flex items-center gap-2">
              {resumes.length > 0 && <span className="text-[0.55rem] text-[var(--muted)] uppercase tracking-wider hidden sm:block" style={{ fontFamily: "var(--font-dm-mono)" }}>{resumes.length}/3</span>}
              {resumes.length < 3 && (
                <button onClick={() => setShowUploadPanel(!showUploadPanel)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[0.65rem] font-medium text-white"
                  style={{ background: "var(--accent)", fontFamily: "var(--font-dm-sans)" }}>
                  <IconUpload size={11} />{resumes.length > 0 ? "Add" : "Upload"}
                </button>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 mb-4 p-1 rounded-[10px] w-fit"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {(["matches", "pipeline", "saved"] as const).map((tab) => {
              const labels = {
                matches: "Job Matches",
                pipeline: `My Pipeline${applications.length > 0 ? ` (${applications.length})` : ""}`,
                saved: `Saved${savedJobs.length > 0 ? ` (${savedJobs.length})` : ""}`,
              };
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="px-4 py-1.5 rounded-[8px] text-xs font-medium transition-all"
                  style={{
                    background: activeTab === tab ? "var(--accent)" : "transparent",
                    color: activeTab === tab ? "white" : "var(--muted2)",
                    fontFamily: "var(--font-dm-sans)",
                  }}>
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {/* Resume pills */}
          {resumes.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {resumes.map((r) => (
                <div key={r.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] cursor-pointer transition-all"
                  style={{
                    background: r.id === selectedResumeId ? "rgba(99,102,241,0.12)" : "var(--surface)",
                    border: r.id === selectedResumeId ? "1px solid rgba(99,102,241,0.25)" : "1px solid var(--border)",
                    color: r.id === selectedResumeId ? "var(--accent)" : "var(--muted2)", fontFamily: "var(--font-dm-sans)",
                  }} onClick={() => handleResumeChange(r.id)}>
                  <IconFile size={9} />{r.label}
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteResume(r.id); }} className="ml-0.5 hover:text-[#ef4444]"><IconTrash size={9} /></button>
                </div>
              ))}
            </div>
          )}

          {/* Upload panel */}
          <AnimatePresence>
            {showUploadPanel && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                <div className="p-4 rounded-[12px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="mb-3">
                    <input type="text" value={resumeLabel} onChange={(e) => setResumeLabel(e.target.value)}
                      placeholder={`Resume name (e.g. "ML-focused", "Razorpay-tailored")`}
                      className="w-full px-3 py-2 rounded-[8px] text-xs text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }} />
                  </div>
                  <div onClick={() => uploadRef.current?.click()} className="py-7 rounded-[8px] text-center cursor-pointer transition-all hover:border-[var(--accent)]" style={{ border: "2px dashed var(--border)" }}>
                    {uploading ? (
                      <motion.div className="w-7 h-7 rounded-full border-2 mx-auto" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
                        animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                    ) : (
                      <><IconUpload size={20} className="mx-auto mb-1.5" style={{ color: "var(--muted)" }} />
                      <p className="text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>Upload another resume (PDF)</p></>
                    )}
                    <input ref={uploadRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleAddResume(e.target.files[0]); }} />
                  </div>
                  {uploadError && <p className="text-sm mt-2 text-center" style={{ color: "#ef4444", fontFamily: "var(--font-dm-sans)" }}>{uploadError}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Content area ── */}
          {selectedJob ? (
            <JobDetailView
              job={selectedJob}
              token={token}
              resumeText={resumeText}
              parsedResume={parsedResume}
              saved={savedJobIds.has(selectedJob.job_id)}
              cache={jobDetailCache.current}
              onBack={() => setSelectedJob(null)}
              onSave={handleSave}
              onUnsave={handleUnsave}
              onTailor={handleTailor}
              onCoverLetter={handleCoverLetter}
              onQueue={handleQueueJob}
              onSelect={setSelectedJob}
            />
          ) : activeTab === "matches" ? (
            <>
              {matchesLoading ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div className="w-5 h-5 rounded-full border-2" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
                      animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                    <p className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>Finding your best matches...</p>
                  </div>
                  {[0, 1, 2, 3, 4].map((i) => <JobCardSkeleton key={i} />)}
                </div>
              ) : filteredMatches.length > 0 ? (
                <div className="space-y-3">
                  {filteredMatches.map((job, i) => (
                    <JobCard key={job.job_id} job={job} index={i}
                      saved={savedJobIds.has(job.job_id)}
                      token={token}
                      onSave={handleSave} onUnsave={handleUnsave}
                      onDismiss={handleDismiss} onTailor={handleTailor} onCoverLetter={handleCoverLetter}
                      onQueue={handleQueueJob} onSelect={setSelectedJob} />
                  ))}
                </div>
              ) : matches.length > 0 ? (
                <EmptyFilters onClear={() => { setCityFilter(""); setCustomCity(""); setWorkMode("All"); setShowCityInput(false); }} />
              ) : resumes.length === 0 ? (
                <div className="p-16 rounded-[16px] text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                    <IconUpload size={24} style={{ color: "var(--accent)" }} />
                  </div>
                  <p className="text-[var(--text)] text-base font-medium mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>Upload a resume to see your matches</p>
                  <button onClick={() => setShowUploadPanel(true)} className="mt-3 px-5 py-2.5 rounded-[10px] text-sm font-medium text-white"
                    style={{ background: "var(--accent)", fontFamily: "var(--font-dm-sans)" }}>Upload Resume</button>
                </div>
              ) : null}
            </>
          ) : activeTab === "pipeline" ? (
            <PipelineView
              applications={applications}
              filter={pipelineFilter}
              onFilterChange={setPipelineFilter}
              onUpdateStatus={handleUpdateStatus}
              onRemove={handleRemoveApplication}
              onUpdateNotes={handleUpdateNotes}
            />
          ) : (
            <SavedJobsView
              savedJobs={savedJobs}
              onUnsave={handleUnsave}
              onQueue={(job) => handleQueueJob({ job_id: job.job_id, title: job.title, company: job.company, city: job.city, apply_url: "", match_score: 0, remote: false, work_type: "", posted_at: "", skills: [], source: "" })}
            />
          )}
        </div>
      </main>

      {/* Inline Tailor Resume Panel */}
      <AnimatePresence>
        {tailorJob && (
          <TailorPanel
            job={tailorJob}
            token={token}
            resumeText={resumeText}
            parsedResume={parsedResume}
            onClose={() => setTailorJob(null)}
          />
        )}
      </AnimatePresence>
    </ErrorBoundary>
  );
}

/* ─── Tailor Resume Side Panel ─── */
function TailorPanel({ job, token, resumeText, parsedResume, onClose }: {
  job: MatchResult;
  token: string;
  resumeText: string;
  parsedResume: ResumeData | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [changes, setChanges] = useState<TailorChange[]>([]);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleTailor = async () => {
    if (!parsedResume) {
      setError("No parsed resume available. Please upload and parse a resume first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { changes: c } = await tailorResume(token, {
        resume: parsedResume,
        job_description: `${job.title} at ${job.company}. Skills: ${job.skills.join(", ")}`,
      });
      setChanges(c);
      setDone(true);
    } catch (err) {
      console.error("Tailor failed:", err);
      setError("Failed to tailor resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60]"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />
      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 z-[61] w-full max-w-lg overflow-y-auto"
        style={{ background: "var(--bg)", borderLeft: "1px solid var(--border)" }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-[var(--text)]" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                Tailor Resume
              </h2>
              <p className="text-xs text-[var(--muted2)] mt-0.5" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                {job.title} at {job.company}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-[8px] hover:bg-[var(--surface)] transition-colors">
              <IconX size={18} style={{ color: "var(--muted)" }} />
            </button>
          </div>

          {/* Job context */}
          <div className="p-3 rounded-[10px] mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-[0.55rem] text-[var(--muted)] uppercase tracking-wider mb-1.5" style={{ fontFamily: "var(--font-dm-mono)" }}>Target Role</p>
            <p className="text-sm text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{job.title}</p>
            {job.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {job.skills.slice(0, 8).map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded-full text-[0.6rem]"
                    style={{ background: "rgba(99,102,241,0.1)", color: "var(--accent)", fontFamily: "var(--font-dm-sans)" }}>
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {!done ? (
            <>
              <p className="text-xs text-[var(--muted2)] mb-4 leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                AI will analyze your resume against this job and suggest targeted improvements to your summary, skills, and experience bullets.
              </p>
              <button
                onClick={handleTailor}
                disabled={loading}
                className="w-full py-3 rounded-[10px] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--accent), #7c3aed)", fontFamily: "var(--font-dm-sans)", boxShadow: "0 4px 20px rgba(108,99,255,0.3)" }}
              >
                {loading ? (
                  <><motion.div className="w-4 h-4 rounded-full border-2" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }}
                    animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} /> Tailoring...</>
                ) : (
                  <><IconSparkles size={16} /> Tailor My Resume</>
                )}
              </button>
              {error && <p className="mt-2 text-xs text-red-400 text-center" style={{ fontFamily: "var(--font-dm-sans)" }}>{error}</p>}
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {changes.length} suggested changes
              </p>
              {changes.map((c, i) => (
                <div key={i} className="p-3 rounded-[10px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <p className="text-[0.55rem] text-[var(--muted)] uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-dm-mono)" }}>{c.section}</p>
                  <div className="text-xs mb-1.5">
                    <span className="text-red-400 line-through" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>{c.original}</span>
                  </div>
                  <div className="text-xs mb-1.5">
                    <span className="text-green-400" style={{ fontFamily: "var(--font-dm-sans)" }}>{c.updated}</span>
                  </div>
                  <p className="text-[0.6rem] text-[var(--muted2)] italic" style={{ fontFamily: "var(--font-dm-sans)" }}>{c.reason}</p>
                </div>
              ))}
              <a
                href={`/resume-builder?job_title=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}`}
                className="block w-full py-2.5 rounded-[10px] text-center text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--surface)]"
                style={{ border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}
              >
                Open in Resume Builder for Full Edit
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

/* ─── Job Detail View (Jobright-style full page) ─── */
function JobDetailView({ job, token, resumeText, parsedResume, saved, cache, onBack, onSave, onUnsave, onTailor, onCoverLetter, onQueue, onSelect }: {
  job: MatchResult;
  token: string;
  resumeText: string;
  parsedResume: ResumeData | null;
  saved: boolean;
  cache: Record<string, JobDetail>;
  onBack: () => void;
  onSave: (jobId: string) => void;
  onUnsave: (jobId: string) => void;
  onTailor: (job: MatchResult) => void;
  onCoverLetter: (job: MatchResult, tone: "formal" | "creative") => Promise<string>;
  onQueue: (job: MatchResult) => void;
  onSelect?: (job: MatchResult) => void;
}) {
  const [detail, setDetail] = useState<JobDetail | null>(cache[job.job_id] || null);
  const [loading, setLoading] = useState(!cache[job.job_id]);
  const [isSaved, setIsSaved] = useState(saved);
  const [coverLetter, setCoverLetter] = useState("");
  const [clLoading, setClLoading] = useState(false);
  const [clTone, setClTone] = useState<"formal" | "creative" | null>(null);
  const [explanation, setExplanation] = useState("");
  const [explainLoading, setExplainLoading] = useState(false);
  const [similarJobs, setSimilarJobs] = useState<MatchResult[]>([]);

  useEffect(() => {
    if (cache[job.job_id]) { setDetail(cache[job.job_id]); setLoading(false); return; }
    const load = async () => {
      try {
        const d = await getJob(job.job_id);
        cache[job.job_id] = d;
        setDetail(d);
      } catch (err) { console.error("Failed to load job detail:", err); }
      finally { setLoading(false); }
    };
    load();
    // Fetch similar jobs
    getSimilarJobs(job.job_id).then(res => setSimilarJobs(res.similar_jobs || [])).catch(() => {});
  }, [job.job_id, cache]);

  const handleExplainMatch = async () => {
    if (explanation) return; // already fetched
    setExplainLoading(true);
    try {
      const res = await explainMatch(token, { job_id: job.job_id, resume_text: resumeText });
      setExplanation(res.explanation);
    } catch (err) { console.error("Explain match failed:", err); }
    finally { setExplainLoading(false); }
  };

  const handleSave = () => { if (isSaved) { onUnsave(job.job_id); setIsSaved(false); } else { onSave(job.job_id); setIsSaved(true); } };

  const handleCoverLetter = async (tone: "formal" | "creative") => {
    setClTone(null);
    setClLoading(true);
    try {
      const text = await onCoverLetter(job, tone);
      setCoverLetter(text);
    } catch (err) { console.error("CL failed:", err); }
    finally { setClLoading(false); }
  };

  const workType = job.work_type || (job.remote ? "Remote" : "Onsite");

  // Parse JD sections from raw text
  const parseJdSections = (raw: string) => {
    const sections: { title: string; content: string }[] = [];
    const lines = raw.split("\n");
    let currentTitle = "";
    let currentLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Detect section headers (all caps, or ending with colon, or bold-like patterns)
      const isHeader = (
        (trimmed.length > 3 && trimmed.length < 80 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) ||
        /^(responsibilities|qualifications|requirements|benefits|about|what you|who you|nice to have|preferred|minimum|the role|your role|what we|why join)/i.test(trimmed) ||
        (trimmed.endsWith(":") && trimmed.length < 60)
      );

      if (isHeader && trimmed) {
        if (currentTitle || currentLines.length > 0) {
          sections.push({ title: currentTitle, content: currentLines.join("\n").trim() });
        }
        currentTitle = trimmed.replace(/:$/, "");
        currentLines = [];
      } else {
        currentLines.push(line);
      }
    }
    if (currentTitle || currentLines.length > 0) {
      sections.push({ title: currentTitle, content: currentLines.join("\n").trim() });
    }
    return sections;
  };

  const jdSections = detail?.raw_jd ? parseJdSections(detail.raw_jd) : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Back + actions bar */}
      <div className="flex items-center justify-between mb-5 p-3 rounded-[12px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[var(--muted2)] hover:text-[var(--text)] transition-colors"
          style={{ fontFamily: "var(--font-dm-sans)" }}>
          <IconArrowLeft size={16} /> Back to Jobs
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} className="p-2 rounded-[8px] hover:bg-[var(--surface)] transition-colors">
            {isSaved ? <IconBookmarkFilled size={18} style={{ color: "var(--accent)" }} /> : <IconBookmark size={18} style={{ color: "var(--muted)" }} />}
          </button>
          {job.apply_url && (
            <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
              className="px-5 py-2 rounded-[10px] text-xs font-semibold text-white transition-all hover:brightness-110"
              style={{ background: "var(--accent)", fontFamily: "var(--font-dm-sans)" }}>
              APPLY NOW <IconExternalLink size={12} className="inline ml-1" />
            </a>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 rounded w-2/3" style={{ background: "var(--surface)" }} />
          <div className="h-4 rounded w-1/3" style={{ background: "var(--surface)" }} />
          <div className="h-64 rounded-[16px]" style={{ background: "var(--surface)" }} />
        </div>
      ) : (
        <div className="flex gap-5">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Header section */}
            <div className="p-5 rounded-[16px] mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex gap-6">
                <div className="flex-1">
                  {/* Company + time */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{job.company}</span>
                    {job.posted_at && (
                      <span className="text-[0.6rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                        · {new Date(job.posted_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-[var(--text)] mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.4rem, 2.5vw, 1.8rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
                    {job.title}
                  </h1>

                  {/* Info row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                    {job.city && <span className="flex items-center gap-1"><IconMapPin size={13} style={{ color: "var(--muted)" }} />{job.city}</span>}
                    <span className="flex items-center gap-1"><IconBriefcase size={13} style={{ color: "var(--muted)" }} />Full-time</span>
                    <span className="px-2 py-0.5 rounded text-[0.55rem] font-medium uppercase"
                      style={{ background: workType === "Remote" ? "rgba(16,185,129,0.12)" : workType === "Hybrid" ? "rgba(245,158,11,0.12)" : "rgba(99,102,241,0.1)", color: workType === "Remote" ? "#10b981" : workType === "Hybrid" ? "#f59e0b" : "var(--accent)" }}>
                      {workType}
                    </span>
                    {detail?.role?.level && (
                      <span className="px-2 py-0.5 rounded text-[0.55rem] font-medium uppercase" style={{ background: "var(--surface)", color: "var(--muted2)", border: "1px solid var(--border)" }}>
                        {detail.role.level}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score section */}
                <div className="flex-shrink-0 flex flex-col items-center gap-3">
                  <ScoreRing score={job.match_score} size={90} />
                  {/* Sub-scores placeholder — can be populated when backend supports it */}
                  <div className="flex gap-3">
                    {[
                      { label: "Exp. Level", score: Math.min(100, Math.round(job.match_score * 1.1)) },
                      { label: "Skill", score: job.match_score },
                      { label: "Industry", score: Math.max(40, Math.round(job.match_score * 0.9)) },
                    ].map((s) => (
                      <div key={s.label} className="flex flex-col items-center">
                        <ScoreRing score={s.score} size={44} />
                        <span className="text-[0.5rem] text-[var(--muted)] mt-0.5" style={{ fontFamily: "var(--font-dm-mono)" }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Company summary + skills */}
            {detail && (
              <div className="p-5 rounded-[16px] mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                {detail.company?.industry && (
                  <p className="text-sm text-[var(--muted2)] mb-3 leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                    <strong className="text-[var(--text)] font-medium">{detail.company.name}</strong> is a {detail.company.industry} company
                    {detail.company.size ? ` with ${detail.company.size} employees` : ""}
                    {detail.company.city ? ` based in ${detail.company.city}` : ""}.
                  </p>
                )}
                {job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-full text-[0.65rem]"
                        style={{ background: "rgba(99,102,241,0.1)", color: "var(--accent)", border: "1px solid rgba(99,102,241,0.15)", fontFamily: "var(--font-dm-sans)" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* JD Sections */}
            {jdSections.length > 0 ? (
              jdSections.map((section, i) => (
                section.content.trim() ? (
                  <div key={i} className="p-5 rounded-[16px] mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    {section.title && (
                      <h2 className="text-sm font-semibold text-[var(--text)] mb-3" style={{ fontFamily: "var(--font-dm-sans)" }}>
                        {section.title}
                      </h2>
                    )}
                    <div className="text-sm text-[var(--muted2)] whitespace-pre-line leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                      {section.content}
                    </div>
                  </div>
                ) : null
              ))
            ) : detail?.raw_jd ? (
              <div className="p-5 rounded-[16px] mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h2 className="text-sm font-semibold text-[var(--text)] mb-3" style={{ fontFamily: "var(--font-dm-sans)" }}>Job Description</h2>
                <div className="text-sm text-[var(--muted2)] whitespace-pre-line leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                  {detail.raw_jd}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-[16px] mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <p className="text-xs text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-sans)" }}>No detailed description available for this job.</p>
              </div>
            )}

            {/* Company info card */}
            {detail?.company && (
              <div className="p-5 rounded-[16px] mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h2 className="text-sm font-semibold text-[var(--text)] mb-3" style={{ fontFamily: "var(--font-dm-sans)" }}>Company</h2>
                <div className="grid grid-cols-2 gap-3 text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  {detail.company.industry && (
                    <div><span className="text-[var(--muted)] text-[0.5rem] uppercase tracking-wider block mb-0.5" style={{ fontFamily: "var(--font-dm-mono)" }}>Industry</span>{detail.company.industry}</div>
                  )}
                  {detail.company.size && (
                    <div><span className="text-[var(--muted)] text-[0.5rem] uppercase tracking-wider block mb-0.5" style={{ fontFamily: "var(--font-dm-mono)" }}>Size</span>{detail.company.size} employees</div>
                  )}
                  {detail.company.city && (
                    <div><span className="text-[var(--muted)] text-[0.5rem] uppercase tracking-wider block mb-0.5" style={{ fontFamily: "var(--font-dm-mono)" }}>Location</span>{detail.company.city}</div>
                  )}
                  {detail.company.domain && (
                    <div><span className="text-[var(--muted)] text-[0.5rem] uppercase tracking-wider block mb-0.5" style={{ fontFamily: "var(--font-dm-mono)" }}>Website</span>{detail.company.domain}</div>
                  )}
                </div>
                {/* Research links */}
                <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  {[
                    { label: "Glassdoor", url: `https://www.glassdoor.co.in/Reviews/${encodeURIComponent(detail.company.name)}-Reviews` },
                    { label: "LinkedIn", url: `https://www.linkedin.com/company/${encodeURIComponent(detail.company.name.toLowerCase().replace(/\s+/g, "-"))}` },
                    { label: "Original Post", url: detail.source_url || detail.apply_url || job.apply_url },
                  ].filter(l => l.url).map((link) => (
                    <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[0.65rem] font-medium transition-colors hover:text-[var(--accent)]"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted2)", fontFamily: "var(--font-dm-sans)" }}>
                      {link.label} <IconExternalLink size={10} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Roles */}
            {similarJobs.length > 0 && (
              <div className="p-5 rounded-[16px] mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h2 className="text-sm font-semibold text-[var(--text)] mb-3" style={{ fontFamily: "var(--font-dm-sans)" }}>Similar Roles</h2>
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
                  {similarJobs.slice(0, 5).map((sj) => (
                    <div key={sj.job_id}
                      onClick={() => { onBack(); if (onSelect) onSelect(sj); }}
                      className="flex-shrink-0 w-[200px] p-3 rounded-[12px] cursor-pointer transition-all hover:brightness-110"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                      <p className="text-xs font-medium text-[var(--text)] truncate" style={{ fontFamily: "var(--font-dm-sans)" }}>{sj.title}</p>
                      <p className="text-[0.6rem] text-[var(--muted2)] truncate mt-0.5" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                        {sj.company}
                      </p>
                      {sj.city && (
                        <p className="text-[0.55rem] text-[var(--muted)] mt-1 flex items-center gap-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
                          <IconMapPin size={9} />{sj.city}
                        </p>
                      )}
                      <div className="mt-1.5">
                        <ScoreRing score={sj.match_score} size={36} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar: AI Tools */}
          <div className="hidden lg:block w-[240px] flex-shrink-0 space-y-3">
            <p className="text-xs font-semibold text-[var(--text)] mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>AI Tools</p>

            <button onClick={() => onTailor(job)}
              className="w-full text-left p-3 rounded-[12px] transition-colors hover:brightness-110"
              style={{ background: "linear-gradient(135deg, var(--accent), #7c3aed)", border: "none" }}>
              <p className="text-xs font-semibold text-white" style={{ fontFamily: "var(--font-dm-sans)" }}>Customize Resume</p>
              <p className="text-[0.6rem] text-white/70 mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>Tailor to this job</p>
            </button>

            <div className="relative">
              <button onClick={() => { if (coverLetter) return; setClTone(clTone ? null : "formal"); }}
                disabled={clLoading}
                className="w-full text-left p-3 rounded-[12px] transition-colors hover:bg-[var(--surface)]"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  {clLoading ? "Generating..." : coverLetter ? "View Cover Letter" : "Build Cover Letter"}
                </p>
                <p className="text-[0.6rem] text-[var(--muted2)] mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  {coverLetter ? "Click to scroll down" : "Make your application stand out"}
                </p>
              </button>
              <AnimatePresence>
                {clTone !== null && !coverLetter && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 right-0 top-full mt-1 z-50 rounded-[10px] p-1.5"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                    <button onClick={() => handleCoverLetter("formal")} className="w-full text-left px-2.5 py-2 rounded-[6px] text-xs text-[var(--text)] hover:bg-[var(--surface)]" style={{ fontFamily: "var(--font-dm-sans)" }}>Professional</button>
                    <button onClick={() => handleCoverLetter("creative")} className="w-full text-left px-2.5 py-2 rounded-[6px] text-xs text-[var(--text)] hover:bg-[var(--surface)]" style={{ fontFamily: "var(--font-dm-sans)" }}>Creative</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => onQueue(job)}
              className="w-full text-left p-3 rounded-[12px] transition-colors hover:bg-[var(--surface)]"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>Add to Pipeline</p>
              <p className="text-[0.6rem] text-[var(--muted2)] mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>Track this application</p>
            </button>

            <button onClick={handleExplainMatch} disabled={explainLoading}
              className="w-full text-left p-3 rounded-[12px] transition-colors hover:bg-[var(--surface)]"
              style={{ background: explanation ? "rgba(245,158,11,0.06)" : "var(--card)", border: `1px solid ${explanation ? "rgba(245,158,11,0.15)" : "var(--border)"}` }}>
              <p className="text-xs font-medium text-[var(--text)] flex items-center gap-1.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {explainLoading ? <IconLoader2 size={12} className="animate-spin" /> : <IconBulb size={12} style={{ color: "#f59e0b" }} />}
                Why this match?
              </p>
              <p className="text-[0.6rem] text-[var(--muted2)] mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {explanation ? "See explanation below" : "AI-powered score breakdown"}
              </p>
            </button>
            {explanation && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-[12px]"
                style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <div className="flex items-start gap-2">
                  <IconBulb size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                  <p className="text-[0.65rem] text-[var(--muted2)] leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                    {explanation}
                  </p>
                </div>
              </motion.div>
            )}

            <a href={`/interview-prep`}
              className="block w-full text-left p-3 rounded-[12px] transition-colors hover:bg-[var(--surface)]"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>Interview Prep</p>
              <p className="text-[0.6rem] text-[var(--muted2)] mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>Practice for this role</p>
            </a>
          </div>
        </div>
      )}

      {/* Cover letter display */}
      {coverLetter && (
        <div className="p-5 rounded-[16px] mt-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>Cover Letter</h2>
            <div className="flex items-center gap-2">
              <button onClick={async () => { await navigator.clipboard.writeText(coverLetter.replace(/\*\*/g, "")); }}
                className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-[0.65rem] hover:bg-[var(--surface)] transition-colors"
                style={{ color: "var(--accent)", fontFamily: "var(--font-dm-sans)", border: "1px solid var(--border)" }}>
                <IconCopy size={11} /> Copy
              </button>
            </div>
          </div>
          <div className="text-sm text-[var(--muted2)] whitespace-pre-line leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            {coverLetter}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Shared sub-components ─── */
function TopBar({ firstName, subtitle }: { firstName: string; subtitle?: string }) {
  const [mobileNav, setMobileNav] = useState(false);
  return (
    <div className="fixed top-0 left-0 right-0 z-50"
      style={{ background: "rgba(10,10,14,0.88)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
      <div className="px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="text-sm font-semibold text-[var(--text)]" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>SViam</a>
          {subtitle && <span className="text-[0.65rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{subtitle}</span>}
        </div>
        <div className="flex items-center gap-3">
          <a href="/profile" className="text-xs text-[var(--muted2)] hover:text-[var(--text)] transition-colors hidden sm:block"
            style={{ fontFamily: "var(--font-dm-sans)" }}>Profile</a>
          <a href="/resume-builder" className="text-xs text-[var(--muted2)] hover:text-[var(--text)] transition-colors hidden sm:block"
            style={{ fontFamily: "var(--font-dm-sans)" }}>Resume Builder</a>
          <button onClick={() => setMobileNav(!mobileNav)} className="sm:hidden p-1.5 rounded-[6px] hover:bg-[var(--surface)] transition-colors">
            {mobileNav ? <IconX size={16} style={{ color: "var(--muted2)" }} /> : <IconMenu2 size={16} style={{ color: "var(--muted2)" }} />}
          </button>
          <SignOutButton name={firstName} />
        </div>
      </div>
      <AnimatePresence>
        {mobileNav && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="sm:hidden overflow-hidden">
            <div className="flex flex-col gap-1 px-4 pb-3">
              {[{ href: "/profile", label: "Profile" }, { href: "/resume-builder", label: "Resume Builder" }, { href: "/interview-prep", label: "Interview Prep" }].map((l) => (
                <a key={l.href} href={l.href} className="px-3 py-2 rounded-[8px] text-xs text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                  style={{ fontFamily: "var(--font-dm-sans)" }}>{l.label}</a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BgGradient({ subtle }: { subtle?: boolean }) {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{
      background: subtle
        ? "radial-gradient(ellipse 50% 40% at 30% 0%, rgba(99,102,241,0.04) 0%, transparent 60%)"
        : "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 20%, rgba(139,92,246,0.05) 0%, transparent 60%)",
    }} />
  );
}

function FField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[0.55rem] text-[var(--muted)] block mb-1 tracking-[0.12em] uppercase" style={{ fontFamily: "var(--font-dm-mono)" }}>{label}</label>
      {children}
    </div>
  );
}

function FInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)] ${className || ""}`}
      style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }} />
  );
}

function Chip({ value, onChange, icon, children }: { value: string; onChange: (v: string) => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-2.5 pr-6 py-1.5 rounded-[8px] text-[0.65rem] text-[var(--text)] outline-none cursor-pointer"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)", minWidth: 100 }}>
        {children}
      </select>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }}>{icon}</span>
    </div>
  );
}

function EmptyFilters({ onClear }: { onClear: () => void }) {
  return (
    <div className="p-12 rounded-[16px] text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <IconMapPin size={28} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
      <p className="text-sm text-[var(--muted2)] mb-1" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>No matches for these filters</p>
      <button onClick={onClear} className="mt-2 text-xs font-medium" style={{ color: "var(--accent)", fontFamily: "var(--font-dm-sans)" }}>Clear filters</button>
    </div>
  );
}

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  queued: { bg: "rgba(99,102,241,0.1)", color: "var(--accent)", border: "rgba(99,102,241,0.2)" },
  applied: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "rgba(59,130,246,0.2)" },
  interview: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "rgba(245,158,11,0.2)" },
  offer: { bg: "rgba(16,185,129,0.1)", color: "#10b981", border: "rgba(16,185,129,0.2)" },
  rejected: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", border: "rgba(239,68,68,0.2)" },
};
const STATUS_ORDER: ApplicationStatus[] = ["queued", "applied", "interview", "offer", "rejected"];

function PipelineStats({ applications }: { applications: Application[] }) {
  if (applications.length === 0) return null;
  const total = applications.length;
  const applied = applications.filter((a) => a.status !== "queued").length;
  const interviews = applications.filter((a) => a.status === "interview").length;
  const offers = applications.filter((a) => a.status === "offer").length;
  const interviewRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;

  const stats = [
    { label: "Total", value: total, color: "var(--accent)" },
    { label: "Applied", value: applied, color: "#3b82f6" },
    { label: "Interviews", value: interviews, color: "#f59e0b" },
    { label: "Offers", value: offers, color: "#10b981" },
    { label: "Interview Rate", value: `${interviewRate}%`, color: "#8b5cf6" },
  ];

  return (
    <div className="grid grid-cols-5 gap-2 mb-4">
      {stats.map((s) => (
        <div key={s.label} className="p-2.5 rounded-[10px] text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-lg font-bold" style={{ color: s.color, fontFamily: "var(--font-dm-sans)" }}>{s.value}</p>
          <p className="text-[0.55rem] text-[var(--muted)] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono)" }}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function PipelineView({
  applications, filter, onFilterChange, onUpdateStatus, onRemove, onUpdateNotes,
}: {
  applications: Application[];
  filter: ApplicationStatus | "all";
  onFilterChange: (f: ApplicationStatus | "all") => void;
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onRemove: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const filtered = filter === "all" ? applications : applications.filter((a) => a.status === filter);

  const toggleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    const app = applications.find((a) => a.id === id);
    setNoteInput(app?.notes || "");
  };

  const handleSaveNote = (id: string) => {
    onUpdateNotes(id, noteInput);
  };

  return (
    <div>
      <PipelineStats applications={applications} />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(["all", ...STATUS_ORDER] as const).map((s) => {
          const count = s === "all" ? applications.length : applications.filter((a) => a.status === s).length;
          return (
            <button key={s} onClick={() => onFilterChange(s)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: filter === s ? (s === "all" ? "var(--accent)" : STATUS_COLORS[s]?.bg) : "var(--surface)",
                border: filter === s ? `1px solid ${s === "all" ? "var(--accent)" : STATUS_COLORS[s]?.border}` : "1px solid var(--border)",
                color: filter === s ? (s === "all" ? "white" : STATUS_COLORS[s]?.color) : "var(--muted2)",
                fontFamily: "var(--font-dm-sans)",
              }}>
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Application cards */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-[16px] text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            {applications.length === 0 ? "No applications yet. Add jobs from the Matches tab." : "No applications with this status."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((app, i) => {
            const sc = STATUS_COLORS[app.status] || STATUS_COLORS.queued;
            const isExpanded = expandedId === app.id;
            return (
              <motion.div key={app.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-[14px] overflow-hidden cursor-pointer"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                {/* Main row */}
                <div className="p-4 flex items-center gap-4" onClick={() => toggleExpand(app.id)}>
                  <span className="px-2 py-0.5 rounded-full text-[0.6rem] font-semibold uppercase tracking-wide flex-shrink-0"
                    style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontFamily: "var(--font-dm-sans)" }}>
                    {app.status}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      {app.title}
                    </p>
                    <p className="text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                      {app.company}{app.city ? ` \u00b7 ${app.city}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <select value={app.status}
                      onChange={(e) => onUpdateStatus(app.id, e.target.value as ApplicationStatus)}
                      className="px-2 py-1 rounded-[6px] text-[0.6rem] text-[var(--text)] outline-none cursor-pointer"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                      {STATUS_ORDER.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>

                    {app.apply_url && (
                      <a href={app.apply_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-[6px] hover:bg-[var(--surface)] transition-colors"
                        style={{ color: "var(--accent)" }}>
                        <IconExternalLink size={13} />
                      </a>
                    )}

                    <button onClick={() => onRemove(app.id)}
                      className="p-1.5 rounded-[6px] hover:bg-[var(--surface)] transition-colors"
                      style={{ color: "var(--muted)" }}>
                      <IconTrash size={13} />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                        {/* Timeline */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.6rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                          <span>Added: {new Date(app.created_at).toLocaleDateString()}</span>
                          {app.applied_at && <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>}
                          {app.updated_at && app.updated_at !== app.created_at && (
                            <span>Updated: {new Date(app.updated_at).toLocaleDateString()}</span>
                          )}
                        </div>

                        {/* Cover letter preview */}
                        {app.cover_letter && (
                          <div className="p-3 rounded-[8px]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <p className="text-[0.6rem] uppercase tracking-wider text-[var(--muted)] mb-1" style={{ fontFamily: "var(--font-dm-mono)" }}>Cover Letter</p>
                            <p className="text-xs text-[var(--muted2)] line-clamp-3" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                              {app.cover_letter}
                            </p>
                          </div>
                        )}

                        {/* Notes */}
                        <div>
                          <p className="text-[0.6rem] uppercase tracking-wider text-[var(--muted)] mb-1" style={{ fontFamily: "var(--font-dm-mono)" }}>Notes</p>
                          <div className="flex gap-2">
                            <textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)}
                              placeholder="Add notes about this application..."
                              rows={2}
                              className="flex-1 px-3 py-2 rounded-[8px] text-xs text-[var(--text)] outline-none resize-none focus:ring-1 focus:ring-[var(--accent)]"
                              style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}
                              onClick={(e) => e.stopPropagation()} />
                            <button onClick={(e) => { e.stopPropagation(); handleSaveNote(app.id); }}
                              className="px-3 self-end rounded-[8px] text-[0.65rem] font-medium text-white py-2"
                              style={{ background: "var(--accent)", fontFamily: "var(--font-dm-sans)" }}>
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SavedJobsView({
  savedJobs, onUnsave, onQueue,
}: {
  savedJobs: SavedJob[];
  onUnsave: (jobId: string) => void;
  onQueue: (job: SavedJob) => void;
}) {
  if (savedJobs.length === 0) {
    return (
      <div className="p-12 rounded-[16px] text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <IconBookmarkFilled size={28} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
        <p className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
          No saved jobs yet. Bookmark jobs from the Matches tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {savedJobs.map((job, i) => (
        <motion.div key={job.job_id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          className="p-4 rounded-[14px] flex items-center gap-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <IconBookmarkFilled size={16} style={{ color: "var(--accent)" }} className="flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text)] truncate" style={{ fontFamily: "var(--font-dm-sans)" }}>
              {job.title}
            </p>
            <p className="text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
              {job.company}{job.city ? ` \u00b7 ${job.city}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[0.55rem] text-[var(--muted)] hidden sm:block" style={{ fontFamily: "var(--font-dm-mono)" }}>
              {new Date(job.created_at).toLocaleDateString()}
            </span>
            <button onClick={() => onQueue(job)}
              className="px-2 py-1 rounded-[6px] text-[0.6rem] font-medium transition-colors hover:text-white hover:bg-[var(--accent)]"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted2)", fontFamily: "var(--font-dm-sans)" }}>
              + Queue
            </button>
            <button onClick={() => onUnsave(job.job_id)}
              className="p-1.5 rounded-[6px] hover:bg-[var(--surface)] transition-colors"
              style={{ color: "var(--muted)" }}>
              <IconTrash size={13} />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AutoApplyStatus({ enabled, maxPerDay, appliedToday }: { enabled: boolean; maxPerDay: number; appliedToday: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-[12px] mb-4 flex items-center gap-3"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: enabled ? "#10b981" : "var(--muted)" }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
          Auto-Apply: {enabled ? "Active" : "Paused"}
        </p>
        <p className="text-[0.6rem] text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
          Today: {appliedToday}/{maxPerDay} applications
        </p>
      </div>
      <a href="/profile" className="text-[0.65rem] font-medium px-2.5 py-1 rounded-[6px] transition-colors hover:bg-[var(--surface)]"
        style={{ color: "var(--accent)", fontFamily: "var(--font-dm-sans)", border: "1px solid var(--border)" }}>
        Settings
      </a>
    </motion.div>
  );
}

function ProfileCompletionBar({ fields, score }: { fields: Record<string, boolean>; score: number }) {
  const entries = Object.entries(fields);
  if (entries.length === 0 || score >= 100) return null;

  const labels: Record<string, string> = {
    name: "Full name", phone: "Phone", city: "City", experience: "Experience level",
    resume: "Resume", linkedin: "LinkedIn", work_auth: "Work authorization", target_roles: "Target roles",
  };
  const missing = entries.filter(([, v]) => !v).map(([k]) => labels[k] || k);
  const nextMissing = missing[0] || "";

  return (
    <a href="/profile" className="block no-underline">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-[14px] mb-4 cursor-pointer transition-all hover:brightness-105"
        style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))", border: "1px solid rgba(99,102,241,0.15)" }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
            Profile {score}% complete
          </p>
          <span className="text-[0.65rem] font-medium" style={{ color: "var(--accent)", fontFamily: "var(--font-dm-sans)" }}>
            Complete Profile
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "var(--surface)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444" }}
          />
        </div>
        <p className="text-[0.6rem] text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
          {nextMissing ? `Add ${nextMissing.toLowerCase()} to improve matches` : `Missing: ${missing.join(", ")}`}
        </p>
      </motion.div>
    </a>
  );
}
