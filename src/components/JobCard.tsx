"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IconBookmark, IconBookmarkFilled } from "@tabler/icons-react";
import type { MatchResult } from "@/lib/api";

function scoreBadgeColor(score: number) {
  if (score >= 70) return { bg: "rgba(16,185,129,0.15)", text: "#10b981", border: "rgba(16,185,129,0.3)" };
  if (score >= 50) return { bg: "rgba(245,158,11,0.15)", text: "#f59e0b", border: "rgba(245,158,11,0.3)" };
  return { bg: "rgba(239,68,68,0.15)", text: "#ef4444", border: "rgba(239,68,68,0.3)" };
}

type Props = {
  job: MatchResult;
  index?: number;
  saved?: boolean;
  onSave?: (jobId: string) => void;
  onUnsave?: (jobId: string) => void;
};

export default function JobCard({ job, index = 0, saved = false, onSave, onUnsave }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(saved);
  const colors = scoreBadgeColor(job.match_score);
  const displaySkills = expanded ? job.skills : job.skills.slice(0, 5);
  const extraCount = job.skills.length - 5;

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      onUnsave?.(job.job_id);
      setIsSaved(false);
    } else {
      onSave?.(job.job_id);
      setIsSaved(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -3, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}
      onClick={() => setExpanded(!expanded)}
      className="p-5 rounded-[16px] cursor-pointer flex gap-4"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}
    >
      {/* Score badge */}
      <div
        className="flex-shrink-0 w-14 h-14 rounded-[12px] flex items-center justify-center text-lg font-semibold"
        style={{
          background: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        {job.match_score}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="text-[var(--text)] text-base font-medium truncate"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            {job.title}
          </h3>
          {(onSave || onUnsave) && (
            <button
              onClick={handleSaveToggle}
              className="flex-shrink-0 p-1 rounded-md hover:bg-[var(--surface)] transition-colors"
            >
              {isSaved ? (
                <IconBookmarkFilled size={18} style={{ color: "var(--accent)" }} />
              ) : (
                <IconBookmark size={18} style={{ color: "var(--muted)" }} />
              )}
            </button>
          )}
        </div>
        <p
          className="text-[var(--muted2)] text-sm mt-0.5"
          style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
        >
          {job.company} &middot; {job.city}
          {job.remote && (
            <span
              className="ml-2 px-2 py-0.5 rounded-full text-[0.65rem] font-medium"
              style={{
                background: "rgba(16,185,129,0.15)",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.3)",
              }}
            >
              Remote
            </span>
          )}
        </p>

        {/* Skills */}
        {job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {displaySkills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded-full text-[0.65rem]"
                style={{
                  background: "var(--surface)",
                  color: "var(--muted2)",
                  border: "1px solid var(--border)",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                {skill}
              </span>
            ))}
            {!expanded && extraCount > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-[0.65rem]"
                style={{
                  background: "var(--surface)",
                  color: "var(--accent)",
                  border: "1px solid var(--border)",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                +{extraCount} more
              </span>
            )}
          </div>
        )}

        {/* Apply button */}
        {job.apply_url && (
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-block mt-3 px-4 py-1.5 rounded-[8px] text-xs font-medium text-white"
            style={{
              background: "var(--accent)",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            Apply Now
          </a>
        )}
      </div>
    </motion.div>
  );
}
