"use client";

import { useState } from "react";
import {
  IconBookmark,
  IconBookmarkFilled,
  IconMapPin,
  IconBriefcase,
  IconBuilding,
  IconExternalLink,
  IconX,
  IconFileText,
  IconCopy,
  IconCheck,
  IconLoader2,
  IconPlayerPlay,
  IconDownload,
} from "@tabler/icons-react";
import type { MatchResult } from "@/lib/api";
import { createApplicationFromApply } from "@/lib/api";
import { getResourcesForSkills } from "@/lib/learning-resources";

function scoreColor(score: number) {
  if (score >= 75) return "#009999";
  if (score >= 55) return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(score: number) {
  if (score >= 75) return "STRONG MATCH";
  if (score >= 55) return "GOOD MATCH";
  return "FAIR MATCH";
}

function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const color = scoreColor(score);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={4}
            strokeDasharray={circumference} strokeDashoffset={circumference - progress} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center" style={{ fontFamily: "var(--font-dm-sans)" }}>
          <span className="text-xl font-bold" style={{ color }}>
            {score}<span className="text-xs font-normal">%</span>
          </span>
        </div>
      </div>
      <span className="text-[0.55rem] font-bold tracking-wider uppercase" style={{ color, fontFamily: "var(--font-dm-sans)" }}>
        {scoreLabel(score)}
      </span>
    </div>
  );
}

/** Renders text with **bold** markers as <strong> */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold text-[var(--text)]">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export { ScoreRing, scoreColor, scoreLabel };

type Props = {
  job: MatchResult;
  index?: number;
  saved?: boolean;
  cachedCoverLetter?: string;
  token?: string;
  onSave?: (jobId: string) => void;
  onUnsave?: (jobId: string) => void;
  onDismiss?: (jobId: string) => void;
  onTailor?: (job: MatchResult) => void;
  onCoverLetter?: (job: MatchResult, tone: "formal" | "creative") => Promise<string>;
  onQueue?: (job: MatchResult) => void;
  onSelect?: (job: MatchResult) => void;
};

export default function JobCard({
  job, index = 0, saved = false, cachedCoverLetter = "", token,
  onSave, onUnsave, onDismiss, onTailor, onCoverLetter, onQueue, onSelect,
}: Props) {
  const [isSaved, setIsSaved] = useState(saved);
  const [dismissed, setDismissed] = useState(false);
  const [coverLetter, setCoverLetter] = useState(cachedCoverLetter);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showToneSelector, setShowToneSelector] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);

  const workType = job.work_type || (job.remote ? "Remote" : "Onsite");

  if (dismissed) return null;

  const handleCardClick = () => {
    if (onSelect) onSelect(job);
  };

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) { onUnsave?.(job.job_id); setIsSaved(false); }
    else { onSave?.(job.job_id); setIsSaved(true); }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    onDismiss?.(job.job_id);
  };

  const handleCoverLetterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (coverLetter) { setShowCoverLetter(!showCoverLetter); return; }
    setShowToneSelector(true);
  };

  const handleGenerateWithTone = async (tone: "formal" | "creative") => {
    setShowToneSelector(false);
    if (!onCoverLetter) return;
    setCoverLetterLoading(true);
    try {
      const text = await onCoverLetter(job, tone);
      setCoverLetter(text);
      setShowCoverLetter(true);
    } catch (err) { console.error("Cover letter generation failed:", err); }
    finally { setCoverLetterLoading(false); }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const plain = coverLetter.replace(/\*\*/g, "");
    await navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = (e: React.MouseEvent) => {
    e.stopPropagation();
    const plain = coverLetter.replace(/\*\*/g, "");
    const lines = plain.split("\n");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.6; max-width: 700px; margin: 40px auto; padding: 40px; color: #222; }
      p { margin: 0 0 12px; }
    </style></head><body>${lines.map(l => l.trim() ? `<p>${l}</p>` : "").join("")}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const pw = window.open(url, "_blank");
    if (pw) { pw.onload = () => { pw.print(); URL.revokeObjectURL(url); }; }
  };

  const handleDownloadDocx = (e: React.MouseEvent) => {
    e.stopPropagation();
    const plain = coverLetter.replace(/\*\*/g, "");
    const lines = plain.split("\n");
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><style>body{font-family:Calibri,sans-serif;font-size:11pt;line-height:1.5;color:#222}p{margin:0 0 8pt}</style></head>
<body>${lines.map(l => l.trim() ? `<p>${l}</p>` : "").join("")}</body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `Cover_Letter_${job.company.replace(/\s+/g, "_")}.doc`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div
      onClick={handleCardClick}
      className="rounded-[16px] cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)]"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        animation: `fadeInUp 0.35s ease both`,
        animationDelay: `${index * 0.05}s`,
      }}
    >
      <div className="p-5 sm:p-6 flex gap-5">
        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-center gap-2 mb-1.5">
            {job.posted_at && (
              <span className="flex items-center gap-1 text-[0.6rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                {freshnessDotColor(job.posted_at) && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: freshnessDotColor(job.posted_at)! }} />
                )}
                {formatPostedAt(job.posted_at)}
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded text-[0.55rem] font-medium uppercase tracking-wide"
              style={{
                background: workType === "Remote" ? "rgba(0,153,153,0.12)" : workType === "Hybrid" ? "rgba(245,158,11,0.12)" : "rgba(99,102,241,0.1)",
                color: workType === "Remote" ? "#009999" : workType === "Hybrid" ? "#f59e0b" : "var(--teal)",
                fontFamily: "var(--font-dm-sans)",
              }}>
              {workType}
            </span>
            <div className="ml-auto flex items-center gap-1">
              {(onSave || onUnsave) && (
                <button onClick={handleSaveToggle} className="p-1 rounded-md hover:bg-[var(--surface)] transition-colors">
                  {isSaved ? <IconBookmarkFilled size={16} style={{ color: "var(--teal)" }} /> : <IconBookmark size={16} style={{ color: "var(--muted)" }} />}
                </button>
              )}
              {onDismiss && (
                <button onClick={handleDismiss} className="p-1 rounded-md hover:bg-[var(--surface)] transition-colors" title="Not interested">
                  <IconX size={16} style={{ color: "var(--muted)" }} />
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-[var(--text)] text-[1.05rem] font-semibold leading-tight mb-1"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            {job.title}
          </h3>

          {/* Company + location */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
            <span className="flex items-center gap-1"><IconBuilding size={12} style={{ color: "var(--muted)" }} />{job.company}</span>
            {job.city && <span className="flex items-center gap-1"><IconMapPin size={12} style={{ color: "var(--muted)" }} />{job.city}</span>}
            <span className="flex items-center gap-1"><IconBriefcase size={12} style={{ color: "var(--muted)" }} />Full-time</span>
          </div>

          {/* Skills (max 5) */}
          {job.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {job.skills.slice(0, 5).map((skill) => (
                <span key={skill} className="px-2 py-0.5 rounded-full text-[0.65rem]"
                  style={{ background: "var(--surface)", color: "var(--muted2)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                  {skill}
                </span>
              ))}
              {job.skills.length > 5 && (
                <span className="px-2 py-0.5 rounded-full text-[0.65rem]"
                  style={{ background: "var(--surface)", color: "var(--teal)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                  +{job.skills.length - 5} more
                </span>
              )}
            </div>
          )}

          {/* Sub-scores */}
          {job.sub_scores && (
            <div className="space-y-2 mb-3">
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Skills", value: job.sub_scores.skill_match, color: "#14b8a6" },
                  { label: "Experience", value: job.sub_scores.experience_match, color: "#6366f1" },
                  { label: "Location", value: job.sub_scores.location_match, color: "#f59e0b" },
                ].map((s) => (
                  <div key={s.label} className="flex-1 min-w-[80px]">
                    <div className="flex justify-between text-[0.6rem] mb-0.5" style={{ fontFamily: "var(--font-dm-sans)", color: "var(--muted2)" }}>
                      <span>{s.label}</span>
                      <span style={{ color: s.color }}>{Math.round(s.value)}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--surface)" }}>
                      <div className="h-full rounded-full transition-all duration-600 ease-out"
                        style={{ background: s.color, width: `${s.value}%`, animation: "scaleXGrow 0.6s ease both 0.2s", transformOrigin: "left" }} />
                    </div>
                  </div>
                ))}
              </div>
              {/* Gap analysis with learning resources */}
              {job.match_score < 75 && job.sub_scores.skill_match < 70 && job.skills.length > 0 && (
                <SkillGapHint skills={job.skills} />
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {job.apply_url && (
              <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (token) createApplicationFromApply(token, job.job_id).catch(() => {});
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-xs font-semibold text-white transition-all hover:brightness-110"
                style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)", boxShadow: "0 0 12px rgba(0,153,153,0.2)" }}>
                APPLY NOW <IconExternalLink size={12} />
              </a>
            )}
            {onTailor && (
              <button onClick={(e) => { e.stopPropagation(); onTailor(job); }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-[10px] text-xs font-medium transition-colors hover:text-[var(--teal)]"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted2)", fontFamily: "var(--font-dm-sans)" }}>
                <IconFileText size={12} /> Tailor Resume
              </button>
            )}
            {onCoverLetter && (
              <div className="relative">
                <button onClick={handleCoverLetterClick} disabled={coverLetterLoading}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-[10px] text-xs font-medium transition-colors hover:text-[var(--teal)]"
                  style={{ background: coverLetter ? "rgba(99,102,241,0.1)" : "var(--surface)", border: `1px solid ${coverLetter ? "rgba(99,102,241,0.2)" : "var(--border)"}`, color: coverLetter ? "var(--teal)" : "var(--muted2)", fontFamily: "var(--font-dm-sans)" }}>
                  {coverLetterLoading ? <IconLoader2 size={12} className="animate-spin" /> : <IconFileText size={12} />}
                  {coverLetter ? "View Letter" : "Cover Letter"}
                </button>
                {showToneSelector && (
                  <div
                    className="absolute left-0 top-full mt-1 z-50 rounded-[10px] p-1.5 min-w-[160px] dropdown-enter"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
                    onClick={(e) => e.stopPropagation()}>
                    <p className="text-[0.55rem] text-[var(--muted)] uppercase tracking-wider px-2 py-1" style={{ fontFamily: "var(--font-dm-mono)" }}>Tone</p>
                    <button onClick={() => handleGenerateWithTone("formal")} className="w-full text-left px-2.5 py-2 rounded-[6px] text-xs text-[var(--text)] hover:bg-[var(--surface)] transition-colors" style={{ fontFamily: "var(--font-dm-sans)" }}>Professional</button>
                    <button onClick={() => handleGenerateWithTone("creative")} className="w-full text-left px-2.5 py-2 rounded-[6px] text-xs text-[var(--text)] hover:bg-[var(--surface)] transition-colors" style={{ fontFamily: "var(--font-dm-sans)" }}>Creative</button>
                  </div>
                )}
              </div>
            )}
            {onQueue && (
              <button onClick={(e) => { e.stopPropagation(); onQueue(job); }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-[10px] text-xs font-medium transition-colors hover:text-[var(--teal)]"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted2)", fontFamily: "var(--font-dm-sans)" }}>
                <IconPlayerPlay size={12} /> Add to Queue
              </button>
            )}
          </div>
        </div>

        {/* Score ring */}
        <div className="flex-shrink-0 hidden sm:flex items-start pt-4"><ScoreRing score={job.match_score} /></div>
        <div className="flex-shrink-0 sm:hidden flex items-start pt-1"><ScoreRing score={job.match_score} size={56} /></div>
      </div>

      {/* Cover letter inline */}
      <div className="accordion-content" style={coverLetter && showCoverLetter ? { gridTemplateRows: "1fr" } : undefined}>
        <div className="overflow-hidden">
          <div className="px-6 pb-5 pt-3" style={{ borderTop: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>Cover Letter</span>
              <div className="flex items-center gap-2">
                <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-[0.65rem] hover:bg-[var(--surface)] transition-colors" style={{ color: "var(--teal)", fontFamily: "var(--font-dm-sans)", border: "1px solid var(--border)" }}>
                  {copied ? <><IconCheck size={11} /> Copied</> : <><IconCopy size={11} /> Copy</>}
                </button>
                <button onClick={handleDownloadPdf} className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-[0.65rem] hover:bg-[var(--surface)] transition-colors" style={{ color: "var(--muted2)", fontFamily: "var(--font-dm-sans)", border: "1px solid var(--border)" }}>
                  <IconDownload size={11} /> PDF
                </button>
                <button onClick={handleDownloadDocx} className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-[0.65rem] hover:bg-[var(--surface)] transition-colors" style={{ color: "var(--muted2)", fontFamily: "var(--font-dm-sans)", border: "1px solid var(--border)" }}>
                  <IconDownload size={11} /> Word
                </button>
              </div>
            </div>
            <div className="text-sm text-[var(--muted2)] whitespace-pre-line leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
              <RichText text={coverLetter} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillGapHint({ skills }: { skills: string[] }) {
  const resources = getResourcesForSkills(skills.slice(0, 3));
  if (resources.length === 0) return null;

  return (
    <div className="p-2 rounded-[8px] text-[0.6rem]" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.1)" }}>
      <p className="font-medium mb-1" style={{ color: "#f59e0b", fontFamily: "var(--font-dm-sans)" }}>
        Bridge the gap — learn these skills:
      </p>
      <div className="flex flex-wrap gap-1.5">
        {resources.slice(0, 3).map(({ skill, resources: res }) => (
          <a key={skill} href={res[0].url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] hover:text-[var(--teal)] transition-colors"
            style={{ background: "var(--surface)", color: "var(--muted2)", fontFamily: "var(--font-dm-sans)" }}
            onClick={(e) => e.stopPropagation()}>
            {skill}
            <svg width="8" height="8" viewBox="0 0 16 16" fill="none"><path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        ))}
      </div>
    </div>
  );
}

function freshnessDotColor(dateStr: string): string | null {
  try {
    const posted = new Date(dateStr);
    if (isNaN(posted.getTime())) return null;
    const diffMs = Date.now() - posted.getTime();
    if (diffMs < 0) return null;
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 24) return "#009999"; // green
    if (diffHours < 72) return "#14b8a6"; // teal
    if (diffHours < 168) return "#f59e0b"; // amber
    return null;
  } catch { return null; }
}

function formatPostedAt(dateStr: string): string {
  try {
    const posted = new Date(dateStr);
    if (isNaN(posted.getTime())) return "";
    const now = new Date();
    const diffMs = now.getTime() - posted.getTime();
    if (diffMs < 0) return posted.toLocaleDateString();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 30) return `${diffDays} days ago`;
    return posted.toLocaleDateString();
  } catch { return ""; }
}
