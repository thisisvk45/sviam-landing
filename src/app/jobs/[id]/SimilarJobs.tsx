"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSimilarJobs } from "@/lib/api";
import type { MatchResult } from "@/lib/api";

export default function SimilarJobs({ jobId }: { jobId: string }) {
  const [jobs, setJobs] = useState<MatchResult[]>([]);

  useEffect(() => {
    getSimilarJobs(jobId)
      .then((data) => setJobs(data.similar_jobs || []))
      .catch(() => {});
  }, [jobId]);

  if (jobs.length === 0) return null;

  return (
    <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
      <h2 className="text-sm font-semibold text-[var(--text)] mb-4" style={{ fontFamily: "var(--font-dm-sans)" }}>
        Similar Jobs
      </h2>
      <div className="space-y-2">
        {jobs.map((j) => (
          <Link key={j.job_id} href={`/jobs/${j.job_id}`}
            className="flex items-center gap-3 p-3 rounded-[10px] transition-colors hover:bg-[rgba(255,255,255,0.02)]"
            style={{ border: "1px solid var(--border)" }}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text)] truncate" style={{ fontFamily: "var(--font-dm-sans)" }}>{j.title}</p>
              <p className="text-xs text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{j.company}{j.city ? ` · ${j.city}` : ""}</p>
            </div>
            {j.match_score > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-[6px]" style={{ color: "#009999", background: "rgba(0,153,153,0.1)", fontFamily: "var(--font-dm-mono)" }}>
                {j.match_score}% similar
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
