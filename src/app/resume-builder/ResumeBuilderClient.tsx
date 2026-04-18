"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconUpload,
  IconChevronDown,
  IconPlus,
  IconX,
  IconSparkles,
  IconDownload,
  IconArrowLeft,
  IconEdit,
  IconFileText,
  IconWand,
} from "@tabler/icons-react";
import {
  parseResume,
  improveBullets,
  generateSummary,
  suggestSkills,
  tailorResume,
  generatePdf,
} from "@/lib/api";
import type {
  ResumeData,
  ResumeExperience,
  ResumeEducation,
  ResumeCertification,
  TailorChange,
} from "@/lib/api";

type Mode = "upload" | "edit" | "preview";

const emptyResume: ResumeData = {
  personal: {
    name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    linkedin: "",
    portfolio: "",
  },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  certifications: [],
};

const emptyExperience: ResumeExperience = {
  company: "",
  title: "",
  start: "",
  end: "",
  location: "",
  bullets: [""],
};

const emptyEducation: ResumeEducation = {
  institution: "",
  degree: "",
  field: "",
  year: "",
  gpa: "",
};

const emptyCert: ResumeCertification = {
  name: "",
  issuer: "",
  year: "",
};

const inputClass =
  "w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none";
const inputStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  fontFamily: "var(--font-dm-sans)",
};

export default function ResumeBuilderClient({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const [mode, setMode] = useState<Mode>("upload");
  const [resume, setResume] = useState<ResumeData>({
    ...emptyResume,
    personal: { ...emptyResume.personal, email },
  });
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");

  // Tailor state
  const [tailorChanges, setTailorChanges] = useState<TailorChange[]>([]);
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [tailorJD, setTailorJD] = useState("");
  const [tailoring, setTailoring] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are accepted.");
      return;
    }
    setError("");
    setParsing(true);
    try {
      const data = await parseResume(token, file);
      setResume(data);
      setMode("edit");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse resume");
    } finally {
      setParsing(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await generatePdf(token, resume);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume.personal.name || "resume"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
    }
  };

  const handleTailor = async () => {
    if (!tailorJD.trim()) return;
    setTailoring(true);
    try {
      const result = await tailorResume(token, {
        resume,
        job_description: tailorJD,
      });
      setResume(result.tailored_resume);
      setTailorChanges(result.changes);
      setShowTailorModal(false);
      setTailorJD("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to tailor resume");
    } finally {
      setTailoring(false);
    }
  };

  if (mode === "upload") {
    return (
      <UploadMode
        parsing={parsing}
        error={error}
        inputRef={inputRef}
        onUpload={handleUpload}
        onStartScratch={() => {
          setResume({ ...emptyResume, personal: { ...emptyResume.personal, email } });
          setMode("edit");
        }}
      />
    );
  }

  if (mode === "preview") {
    return (
      <PreviewMode
        resume={resume}
        changes={tailorChanges}
        error={error}
        showTailorModal={showTailorModal}
        tailorJD={tailorJD}
        tailoring={tailoring}
        onBack={() => setMode("edit")}
        onDownload={handleDownloadPdf}
        onOpenTailor={() => setShowTailorModal(true)}
        onCloseTailor={() => setShowTailorModal(false)}
        onTailorJDChange={setTailorJD}
        onTailor={handleTailor}
      />
    );
  }

  return (
    <EditMode
      token={token}
      resume={resume}
      setResume={setResume}
      onPreview={() => {
        setTailorChanges([]);
        setMode("preview");
      }}
    />
  );
}

/* ─── UPLOAD MODE ─── */
function UploadMode({
  parsing,
  error,
  inputRef,
  onUpload,
  onStartScratch,
}: {
  parsing: boolean;
  error: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (f: File) => void;
  onStartScratch: () => void;
}) {
  return (
    <main
      className="min-h-screen px-6 pt-28 pb-16 flex items-start justify-center"
      style={{ background: "var(--bg)" }}
    >
      <div className="max-w-3xl w-full">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1
            className="text-[var(--text)] mb-3"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Build your resume. Land the interview.
          </h1>
          <p
            className="text-[var(--muted2)]"
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 300,
              lineHeight: 1.6,
            }}
          >
            Upload your existing CV and SViam will extract everything &mdash; or
            start from scratch.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Upload existing */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => !parsing && inputRef.current?.click()}
            className="p-8 rounded-[16px] text-center cursor-pointer transition-all duration-200 hover:border-[var(--accent)]"
            style={{
              background: "var(--card)",
              border: "2px dashed var(--border)",
            }}
          >
            {parsing ? (
              <div className="py-4">
                <motion.div
                  className="w-8 h-8 rounded-full border-2 mx-auto mb-3"
                  style={{
                    borderColor: "var(--border)",
                    borderTopColor: "var(--accent)",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <p
                  className="text-sm text-[var(--muted2)]"
                  style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
                >
                  Parsing your resume...
                </p>
              </div>
            ) : (
              <>
                <IconUpload
                  size={28}
                  className="mx-auto mb-3"
                  style={{ color: "var(--muted)" }}
                />
                <p
                  className="text-[var(--text)] text-sm font-medium mb-1"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Upload existing CV
                </p>
                <p
                  className="text-xs text-[var(--muted)]"
                  style={{ fontFamily: "var(--font-dm-mono)" }}
                >
                  PDF only
                </p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) onUpload(e.target.files[0]);
              }}
            />
          </motion.div>

          {/* Start from scratch */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={onStartScratch}
            className="p-8 rounded-[16px] text-center cursor-pointer transition-all duration-200 hover:border-[var(--accent)]"
            style={{
              background: "var(--card)",
              border: "2px dashed var(--border)",
            }}
          >
            <IconFileText
              size={28}
              className="mx-auto mb-3"
              style={{ color: "var(--muted)" }}
            />
            <p
              className="text-[var(--text)] text-sm font-medium mb-1"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Start from scratch
            </p>
            <p
              className="text-xs text-[var(--muted)]"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              Blank template
            </p>
          </motion.div>
        </div>

        {error && (
          <p
            className="text-center text-sm mt-4"
            style={{ color: "#ef4444", fontFamily: "var(--font-dm-sans)" }}
          >
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

/* ─── EDIT MODE ─── */
function EditMode({
  token,
  resume,
  setResume,
  onPreview,
}: {
  token: string;
  resume: ResumeData;
  setResume: React.Dispatch<React.SetStateAction<ResumeData>>;
  onPreview: () => void;
}) {
  const updatePersonal = (field: string, value: string) =>
    setResume((r) => ({
      ...r,
      personal: { ...r.personal, [field]: value },
    }));

  return (
    <main
      className="min-h-screen px-4 pt-24 pb-16"
      style={{ background: "var(--bg)" }}
    >
      {/* Top bar */}
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-6">
        <h1
          className="text-[var(--text)] text-lg font-semibold"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Resume Editor
        </h1>
        <button
          onClick={onPreview}
          className="px-5 py-2 rounded-[10px] text-sm font-medium text-white"
          style={{
            background: "var(--accent)",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          Preview & Download
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1fr] gap-6">
        {/* Left — Form */}
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-120px)] pr-2">
          {/* Personal Info */}
          <CollapsibleSection title="Personal Info" defaultOpen>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Full Name"
                value={resume.personal.name}
                onChange={(v) => updatePersonal("name", v)}
              />
              <FormField
                label="Email"
                value={resume.personal.email}
                onChange={(v) => updatePersonal("email", v)}
              />
              <FormField
                label="Phone"
                value={resume.personal.phone}
                onChange={(v) => updatePersonal("phone", v)}
              />
              <FormField
                label="City"
                value={resume.personal.city}
                onChange={(v) => updatePersonal("city", v)}
              />
              <FormField
                label="State"
                value={resume.personal.state}
                onChange={(v) => updatePersonal("state", v)}
              />
              <FormField
                label="LinkedIn URL"
                value={resume.personal.linkedin}
                onChange={(v) => updatePersonal("linkedin", v)}
              />
              <FormField
                label="Portfolio / GitHub"
                value={resume.personal.portfolio}
                onChange={(v) => updatePersonal("portfolio", v)}
                span2
              />
            </div>
          </CollapsibleSection>

          {/* Summary */}
          <SummarySection token={token} resume={resume} setResume={setResume} />

          {/* Experience */}
          <ExperienceSection
            token={token}
            resume={resume}
            setResume={setResume}
          />

          {/* Education */}
          <EducationSection resume={resume} setResume={setResume} />

          {/* Skills */}
          <SkillsSection token={token} resume={resume} setResume={setResume} />

          {/* Certifications */}
          <CertificationsSection resume={resume} setResume={setResume} />
        </div>

        {/* Right — Live Preview */}
        <div className="sticky top-24 h-[calc(100vh-120px)] overflow-y-auto">
          <p
            className="text-xs text-[var(--muted)] mb-2 text-center"
            style={{ fontFamily: "var(--font-dm-mono)" }}
          >
            Live preview
          </p>
          <div
            className="bg-white rounded-[8px] p-8 text-black mx-auto"
            style={{
              maxWidth: 595,
              minHeight: 842,
              boxShadow:
                "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            <ResumePreview resume={resume} />
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─── PREVIEW MODE ─── */
function PreviewMode({
  resume,
  changes,
  error,
  showTailorModal,
  tailorJD,
  tailoring,
  onBack,
  onDownload,
  onOpenTailor,
  onCloseTailor,
  onTailorJDChange,
  onTailor,
}: {
  resume: ResumeData;
  changes: TailorChange[];
  error: string;
  showTailorModal: boolean;
  tailorJD: string;
  tailoring: boolean;
  onBack: () => void;
  onDownload: () => void;
  onOpenTailor: () => void;
  onCloseTailor: () => void;
  onTailorJDChange: (v: string) => void;
  onTailor: () => void;
}) {
  return (
    <main
      className="min-h-screen px-6 pt-24 pb-16"
      style={{ background: "var(--bg)" }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-[var(--muted2)] hover:text-[var(--text)]"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            <IconArrowLeft size={16} />
            Back to edit
          </button>
          <div className="flex gap-2">
            <button
              onClick={onOpenTailor}
              className="px-4 py-2 rounded-[8px] text-xs font-medium text-[var(--text)] flex items-center gap-1"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              <IconWand size={14} />
              Tailor to a job
            </button>
            <button
              onClick={onDownload}
              className="px-4 py-2 rounded-[8px] text-xs font-medium text-white flex items-center gap-1"
              style={{
                background: "var(--accent)",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              <IconDownload size={14} />
              Download PDF
            </button>
          </div>
        </div>

        {error && (
          <p
            className="text-center text-sm mb-4"
            style={{ color: "#ef4444", fontFamily: "var(--font-dm-sans)" }}
          >
            {error}
          </p>
        )}

        {/* Changes diff */}
        {changes.length > 0 && (
          <div
            className="p-4 rounded-[12px] mb-6 space-y-3"
            style={{
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            <p
              className="text-sm font-medium text-[var(--text)]"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Tailored changes ({changes.length})
            </p>
            {changes.map((c, i) => (
              <div key={i} className="text-xs space-y-1">
                <p className="font-medium text-[var(--accent)]">
                  {c.section}
                </p>
                <p className="text-[var(--muted)]line-through">{c.original}</p>
                <p style={{ color: "var(--text)" }}>{c.updated}</p>
                <p className="text-[var(--muted)] italic">{c.reason}</p>
              </div>
            ))}
          </div>
        )}

        {/* Resume preview */}
        <div
          className="bg-white rounded-[8px] p-10 text-black mx-auto"
          style={{
            maxWidth: 595,
            minHeight: 842,
            boxShadow:
              "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            fontSize: 11,
            lineHeight: 1.5,
          }}
        >
          <ResumePreview resume={resume} />
        </div>
      </div>

      {/* Tailor Modal */}
      <AnimatePresence>
        {showTailorModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={onCloseTailor}
            />
            <motion.div
              className="relative w-full max-w-lg p-6 rounded-[16px]"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <h3
                className="text-[var(--text)] text-base font-medium mb-3"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Tailor resume to a job
              </h3>
              <p
                className="text-xs text-[var(--muted2)] mb-4"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Paste the job description below and AI will rewrite your resume
                to match.
              </p>
              <textarea
                value={tailorJD}
                onChange={(e) => onTailorJDChange(e.target.value)}
                rows={8}
                placeholder="Paste the full job description here..."
                className={inputClass}
                style={{ ...inputStyle, resize: "vertical" as const }}
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={onCloseTailor}
                  className="px-4 py-2 rounded-[8px] text-xs text-[var(--muted2)]"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={onTailor}
                  disabled={tailoring || !tailorJD.trim()}
                  className="px-4 py-2 rounded-[8px] text-xs font-medium text-white disabled:opacity-50"
                  style={{
                    background: "var(--accent)",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  {tailoring ? "Tailoring..." : "Tailor Resume"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/* ─── RESUME PREVIEW (renders on white bg) ─── */
function ResumePreview({ resume }: { resume: ResumeData }) {
  const { personal, summary, experience, education, skills, certifications } =
    resume;

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold" style={{ letterSpacing: "-0.02em" }}>
          {personal.name || "Your Name"}
        </h2>
        <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-center gap-2 flex-wrap">
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {(personal.city || personal.state) && (
            <span>
              {[personal.city, personal.state].filter(Boolean).join(", ")}
            </span>
          )}
          {personal.linkedin && <span>{personal.linkedin}</span>}
          {personal.portfolio && <span>{personal.portfolio}</span>}
        </div>
      </div>

      <hr className="border-gray-300 mb-3" />

      {/* Summary */}
      {summary && (
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
            Professional Summary
          </h3>
          <p className="text-[11px] text-gray-700">{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
            Experience
          </h3>
          {experience.map((exp, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between">
                <span className="font-semibold text-[11px]">
                  {exp.title}
                  {exp.company ? ` — ${exp.company}` : ""}
                </span>
                <span className="text-[10px] text-gray-500">
                  {[exp.start, exp.end].filter(Boolean).join(" – ")}
                </span>
              </div>
              {exp.location && (
                <p className="text-[10px] text-gray-500">{exp.location}</p>
              )}
              {exp.bullets.filter(Boolean).length > 0 && (
                <ul className="list-disc ml-4 mt-1">
                  {exp.bullets
                    .filter(Boolean)
                    .map((b, j) => (
                      <li key={j} className="text-[11px] text-gray-700">
                        {b}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
            Education
          </h3>
          {education.map((edu, i) => (
            <div key={i} className="mb-1">
              <div className="flex justify-between">
                <span className="font-semibold text-[11px]">
                  {edu.degree}
                  {edu.field ? ` in ${edu.field}` : ""}
                  {edu.institution ? ` — ${edu.institution}` : ""}
                </span>
                <span className="text-[10px] text-gray-500">{edu.year}</span>
              </div>
              {edu.gpa && (
                <p className="text-[10px] text-gray-500">GPA: {edu.gpa}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
            Skills
          </h3>
          <p className="text-[11px] text-gray-700">{skills.join(" • ")}</p>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
            Certifications
          </h3>
          {certifications.map((c, i) => (
            <p key={i} className="text-[11px] text-gray-700">
              {c.name}
              {c.issuer ? ` — ${c.issuer}` : ""}
              {c.year ? ` (${c.year})` : ""}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── COLLAPSIBLE SECTION ─── */
function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  action,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-[16px] overflow-hidden"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between"
      >
        <span
          className="text-sm font-medium text-[var(--text)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {title}
        </span>
        <div className="flex items-center gap-2">
          {action}
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <IconChevronDown size={16} className="text-[var(--muted)]" />
          </motion.div>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── FORM FIELD ─── */
function FormField({
  label,
  value,
  onChange,
  span2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <label
        className="text-[0.65rem] text-[var(--muted)] block mb-1 tracking-[0.1em] uppercase"
        style={{ fontFamily: "var(--font-dm-mono)" }}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        style={inputStyle}
      />
    </div>
  );
}

/* ─── SUMMARY SECTION ─── */
function SummarySection({
  token,
  resume,
  setResume,
}: {
  token: string;
  resume: ResumeData;
  setResume: React.Dispatch<React.SetStateAction<ResumeData>>;
}) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateSummary(token, {
        experience: resume.experience,
        skills: resume.skills,
      });
      setResume((r) => ({ ...r, summary: result.summary }));
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  };

  return (
    <CollapsibleSection
      title="Professional Summary"
      defaultOpen
      action={
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleGenerate();
          }}
          disabled={generating}
          className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          <IconSparkles size={12} />
          {generating ? "Generating..." : "Generate with AI"}
        </button>
      }
    >
      <textarea
        value={resume.summary}
        onChange={(e) =>
          setResume((r) => ({ ...r, summary: e.target.value }))
        }
        rows={4}
        placeholder="Write a 3-4 sentence professional summary..."
        className={inputClass}
        style={{ ...inputStyle, resize: "vertical" as const }}
      />
    </CollapsibleSection>
  );
}

/* ─── EXPERIENCE SECTION ─── */
function ExperienceSection({
  token,
  resume,
  setResume,
}: {
  token: string;
  resume: ResumeData;
  setResume: React.Dispatch<React.SetStateAction<ResumeData>>;
}) {
  const updateExp = (
    idx: number,
    field: keyof ResumeExperience,
    value: string | string[]
  ) =>
    setResume((r) => ({
      ...r,
      experience: r.experience.map((e, i) =>
        i === idx ? { ...e, [field]: value } : e
      ),
    }));

  const addExp = () =>
    setResume((r) => ({
      ...r,
      experience: [...r.experience, { ...emptyExperience }],
    }));

  const removeExp = (idx: number) =>
    setResume((r) => ({
      ...r,
      experience: r.experience.filter((_, i) => i !== idx),
    }));

  return (
    <CollapsibleSection title="Work Experience" defaultOpen>
      <div className="space-y-4">
        {resume.experience.map((exp, idx) => (
          <ExperienceEntry
            key={idx}
            exp={exp}
            idx={idx}
            token={token}
            onUpdate={updateExp}
            onRemove={() => removeExp(idx)}
          />
        ))}
        <button
          onClick={addExp}
          className="flex items-center gap-1 text-xs text-[var(--accent)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          <IconPlus size={14} />
          Add Experience
        </button>
      </div>
    </CollapsibleSection>
  );
}

function ExperienceEntry({
  exp,
  idx,
  token,
  onUpdate,
  onRemove,
}: {
  exp: ResumeExperience;
  idx: number;
  token: string;
  onUpdate: (i: number, f: keyof ResumeExperience, v: string | string[]) => void;
  onRemove: () => void;
}) {
  const [improving, setImproving] = useState(false);

  const handleImprove = async () => {
    setImproving(true);
    try {
      const result = await improveBullets(token, {
        company: exp.company,
        title: exp.title,
        bullets: exp.bullets,
      });
      onUpdate(idx, "bullets", result.improved_bullets);
    } catch {
      // silent
    } finally {
      setImproving(false);
    }
  };

  const updateBullet = (bIdx: number, value: string) => {
    const newBullets = [...exp.bullets];
    newBullets[bIdx] = value;
    onUpdate(idx, "bullets", newBullets);
  };

  const addBullet = () =>
    onUpdate(idx, "bullets", [...exp.bullets, ""]);

  const removeBullet = (bIdx: number) =>
    onUpdate(
      idx,
      "bullets",
      exp.bullets.filter((_, i) => i !== bIdx)
    );

  return (
    <div
      className="p-4 rounded-[12px] space-y-3"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex justify-between items-start">
        <div className="grid grid-cols-2 gap-2 flex-1">
          <FormField
            label="Company"
            value={exp.company}
            onChange={(v) => onUpdate(idx, "company", v)}
          />
          <FormField
            label="Job Title"
            value={exp.title}
            onChange={(v) => onUpdate(idx, "title", v)}
          />
          <FormField
            label="Start Date"
            value={exp.start}
            onChange={(v) => onUpdate(idx, "start", v)}
          />
          <FormField
            label="End Date"
            value={exp.end}
            onChange={(v) => onUpdate(idx, "end", v)}
          />
          <FormField
            label="Location"
            value={exp.location}
            onChange={(v) => onUpdate(idx, "location", v)}
            span2
          />
        </div>
        <button
          onClick={onRemove}
          className="ml-2 mt-4 text-[var(--muted)] hover:text-red-400"
        >
          <IconX size={16} />
        </button>
      </div>

      {/* Bullets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            className="text-[0.65rem] text-[var(--muted)] tracking-[0.1em] uppercase"
            style={{ fontFamily: "var(--font-dm-mono)" }}
          >
            Bullet Points
          </label>
          <button
            onClick={handleImprove}
            disabled={improving}
            className="flex items-center gap-1 text-xs text-[var(--accent)]"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            <IconSparkles size={12} />
            {improving ? "Improving..." : "Improve with AI"}
          </button>
        </div>
        <div className="space-y-2">
          {exp.bullets.map((bullet, bIdx) => (
            <div key={bIdx} className="flex gap-2">
              <input
                value={bullet}
                onChange={(e) => updateBullet(bIdx, e.target.value)}
                placeholder="Describe an achievement..."
                className={`${inputClass} flex-1`}
                style={inputStyle}
              />
              <button
                onClick={() => removeBullet(bIdx)}
                className="text-[var(--muted)] hover:text-red-400"
              >
                <IconX size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={addBullet}
            className="flex items-center gap-1 text-xs text-[var(--muted2)]"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            <IconPlus size={12} />
            Add bullet
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── EDUCATION SECTION ─── */
function EducationSection({
  resume,
  setResume,
}: {
  resume: ResumeData;
  setResume: React.Dispatch<React.SetStateAction<ResumeData>>;
}) {
  const updateEdu = (
    idx: number,
    field: keyof ResumeEducation,
    value: string
  ) =>
    setResume((r) => ({
      ...r,
      education: r.education.map((e, i) =>
        i === idx ? { ...e, [field]: value } : e
      ),
    }));

  const addEdu = () =>
    setResume((r) => ({
      ...r,
      education: [...r.education, { ...emptyEducation }],
    }));

  const removeEdu = (idx: number) =>
    setResume((r) => ({
      ...r,
      education: r.education.filter((_, i) => i !== idx),
    }));

  return (
    <CollapsibleSection title="Education">
      <div className="space-y-3">
        {resume.education.map((edu, idx) => (
          <div
            key={idx}
            className="p-4 rounded-[12px] space-y-2"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex justify-between">
              <div className="grid grid-cols-2 gap-2 flex-1">
                <FormField
                  label="Institution"
                  value={edu.institution}
                  onChange={(v) => updateEdu(idx, "institution", v)}
                  span2
                />
                <FormField
                  label="Degree"
                  value={edu.degree}
                  onChange={(v) => updateEdu(idx, "degree", v)}
                />
                <FormField
                  label="Field of Study"
                  value={edu.field}
                  onChange={(v) => updateEdu(idx, "field", v)}
                />
                <FormField
                  label="Year"
                  value={edu.year}
                  onChange={(v) => updateEdu(idx, "year", v)}
                />
                <FormField
                  label="GPA (optional)"
                  value={edu.gpa}
                  onChange={(v) => updateEdu(idx, "gpa", v)}
                />
              </div>
              <button
                onClick={() => removeEdu(idx)}
                className="ml-2 mt-4 text-[var(--muted)] hover:text-red-400"
              >
                <IconX size={16} />
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={addEdu}
          className="flex items-center gap-1 text-xs text-[var(--accent)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          <IconPlus size={14} />
          Add Education
        </button>
      </div>
    </CollapsibleSection>
  );
}

/* ─── SKILLS SECTION ─── */
function SkillsSection({
  token,
  resume,
  setResume,
}: {
  token: string;
  resume: ResumeData;
  setResume: React.Dispatch<React.SetStateAction<ResumeData>>;
}) {
  const [input, setInput] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || resume.skills.includes(trimmed)) return;
    setResume((r) => ({ ...r, skills: [...r.skills, trimmed] }));
  };

  const removeSkill = (idx: number) =>
    setResume((r) => ({
      ...r,
      skills: r.skills.filter((_, i) => i !== idx),
    }));

  const handleSuggest = async () => {
    setSuggesting(true);
    try {
      const result = await suggestSkills(token, {
        experience: resume.experience,
        current_skills: resume.skills,
      });
      setSuggestions(result.suggested_skills);
    } catch {
      // silent
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <CollapsibleSection
      title="Skills"
      action={
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSuggest();
          }}
          disabled={suggesting}
          className="flex items-center gap-1 text-xs text-[var(--accent)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          <IconSparkles size={12} />
          {suggesting ? "Suggesting..." : "Suggest skills"}
        </button>
      }
    >
      {/* Skill pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {resume.skills.map((skill, i) => (
          <span
            key={i}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs text-[var(--text)]"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            {skill}
            <button
              onClick={() => removeSkill(i)}
              className="text-[var(--muted)] hover:text-red-400"
            >
              <IconX size={12} />
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addSkill(input);
            setInput("");
          }
        }}
        placeholder="Type a skill and press Enter..."
        className={inputClass}
        style={inputStyle}
      />

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-3">
          <p
            className="text-[0.65rem] text-[var(--muted)] mb-2 tracking-[0.1em] uppercase"
            style={{ fontFamily: "var(--font-dm-mono)" }}
          >
            Suggested
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  addSkill(s);
                  setSuggestions((prev) => prev.filter((_, j) => j !== i));
                }}
                className="px-3 py-1 rounded-full text-xs text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
                style={{
                  border: "1px solid var(--accent)",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}

/* ─── CERTIFICATIONS SECTION ─── */
function CertificationsSection({
  resume,
  setResume,
}: {
  resume: ResumeData;
  setResume: React.Dispatch<React.SetStateAction<ResumeData>>;
}) {
  const updateCert = (
    idx: number,
    field: keyof ResumeCertification,
    value: string
  ) =>
    setResume((r) => ({
      ...r,
      certifications: r.certifications.map((c, i) =>
        i === idx ? { ...c, [field]: value } : c
      ),
    }));

  const addCert = () =>
    setResume((r) => ({
      ...r,
      certifications: [...r.certifications, { ...emptyCert }],
    }));

  const removeCert = (idx: number) =>
    setResume((r) => ({
      ...r,
      certifications: r.certifications.filter((_, i) => i !== idx),
    }));

  return (
    <CollapsibleSection title="Certifications">
      <div className="space-y-3">
        {resume.certifications.map((cert, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <div className="grid grid-cols-3 gap-2 flex-1">
              <FormField
                label="Name"
                value={cert.name}
                onChange={(v) => updateCert(idx, "name", v)}
              />
              <FormField
                label="Issuer"
                value={cert.issuer}
                onChange={(v) => updateCert(idx, "issuer", v)}
              />
              <FormField
                label="Year"
                value={cert.year}
                onChange={(v) => updateCert(idx, "year", v)}
              />
            </div>
            <button
              onClick={() => removeCert(idx)}
              className="mt-5 text-[var(--muted)] hover:text-red-400"
            >
              <IconX size={14} />
            </button>
          </div>
        ))}
        <button
          onClick={addCert}
          className="flex items-center gap-1 text-xs text-[var(--accent)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          <IconPlus size={14} />
          Add Certification
        </button>
      </div>
    </CollapsibleSection>
  );
}
