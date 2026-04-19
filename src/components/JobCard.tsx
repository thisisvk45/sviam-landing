"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

function scoreColor(score: number) {
  if (score >= 75) return "#10b981";
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
  onSave?: (jobId: string) => void;
  onUnsave?: (jobId: string) => void;
  onDismiss?: (jobId: string) => void;
  onTailor?: (job: MatchResult) => void;
  onCoverLetter?: (job: MatchResult, tone: "formal" | "creative") => Promise<string>;
  onQueue?: (job: MatchResult) => void;
  onSelect?: (job: MatchResult) => void;
};

export default function JobCard({
  job, index = 0, saved = false, cachedCoverLetter = "",
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      whileHover={{ y: -2, boxShadow: "0 12px 40px rgba(0,0,0,0.2)" }}
      onClick={handleCardClick}
      className="rounded-[16px] cursor-pointer overflow-hidden"
      style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}
    >
      <div className="p-5 sm:p-6 flex gap-5">
        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-center gap-2 mb-1.5">
            {job.posted_at && (
              <span className="text-[0.6rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                {formatPostedAt(job.posted_at)}
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded text-[0.55rem] font-medium uppercase tracking-wide"
              style={{
                background: workType === "Remote" ? "rgba(16,185,129,0.12)" : workType === "Hybrid" ? "rgba(245,158,11,0.12)" : "rgba(99,102,241,0.1)",
                color: workType === "Remote" ? "#10b981" : workType === "Hybrid" ? "#f59e0b" : "var(--accent)",
                fontFamily: "var(--font-dm-sans)",
              }}>
              {workType}
            </span>
            <div className="ml-auto flex items-center gap-1">
              {(onSave || onUnsave) && (
                <button onClick={handleSaveToggle} className="p-1 rounded-md hover:bg-[var(--surface)] transition-colors">
                  {isSaved ? <IconBookmarkFilled size={16} style={{ color: "var(--accent)" }} /> : <IconBookmark size={16} style={{ color: "var(--muted)" }} />}
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
                  style={{ background: "var(--surface)", color: "var(--accent)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                  +{job.skills.length - 5} more
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {job.apply_url && (
              <a href={job.apply_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-xs font-semibold text-white transition-all hover:brightness-110"
                style={{ background: "var(--accent)", fontFamily: "var(--font-dm-sans)", boxShadow: "0 0 12px rgba(108,99,255,0.2)" }}>
                APPLY NOW <IconExternalLink size={12} />
              </a>
            )}
            {onTailor && (
              <button onClick={(e) => { e.stopPropagation(); onTailor(job); }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-[10px] text-xs font-medium transition-colors hover:text-[var(--accent)]"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted2)", fontFamily: "var(--font-dm-sans)" }}>
                <IconFileText size={12} /> Tailor Resume
              </button>
            )}
            {onCoverLetter && (
              <div className="relative">
                <button onClick={handleCoverLetterClick} disabled={coverLetterLoading}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-[10px] text-xs font-medium transition-colors hover:text-[var(--accent)]"
                  style={{ background: coverLetter ? "rgba(99,102,241,0.1)" : "var(--surface)", border: `1px solid ${coverLetter ? "rgba(99,102,241,0.2)" : "var(--border)"}`, color: coverLetter ? "var(--accent)" : "var(--muted2)", fontFamily: "var(--font-dm-sans)" }}>
                  {coverLetterLoading ? <IconLoader2 size={12} className="animate-spin" /> : <IconFileText size={12} />}
                  {coverLetter ? "View Letter" : "Cover Letter"}
                </button>
                <AnimatePresence>
                  {showToneSelector && (
                    <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      className="absolute left-0 top-full mt-1 z-50 rounded-[10px] p-1.5 min-w-[160px]"
                      style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
                      onClick={(e) => e.stopPropagation()}>
                      <p className="text-[0.55rem] text-[var(--muted)] uppercase tracking-wider px-2 py-1" style={{ fontFamily: "var(--font-dm-mono)" }}>Tone</p>
                      <button onClick={() => handleGenerateWithTone("formal")} className="w-full text-left px-2.5 py-2 rounded-[6px] text-xs text-[var(--text)] hover:bg-[var(--surface)] transition-colors" style={{ fontFamily: "var(--font-dm-sans)" }}>Professional</button>
                      <button onClick={() => handleGenerateWithTone("creative")} className="w-full text-left px-2.5 py-2 rounded-[6px] text-xs text-[var(--text)] hover:bg-[var(--surface)] transition-colors" style={{ fontFamily: "var(--font-dm-sans)" }}>Creative</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {onQueue && (
              <button onClick={(e) => { e.stopPropagation(); onQueue(job); }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-[10px] text-xs font-medium transition-colors hover:text-[var(--accent)]"
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
      <AnimatePresence>
        {coverLetter && showCoverLetter && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-6 pb-5 pt-3" style={{ borderTop: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>Cover Letter</span>
                <div className="flex items-center gap-2">
                  <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-[0.65rem] hover:bg-[var(--surface)] transition-colors" style={{ color: "var(--accent)", fontFamily: "var(--font-dm-sans)", border: "1px solid var(--border)" }}>
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
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
