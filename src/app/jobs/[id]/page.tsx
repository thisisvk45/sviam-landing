"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  IconArrowLeft,
  IconExternalLink,
  IconMapPin,
  IconBuilding,
  IconBriefcase,
  IconCoin,
  IconSchool,
  IconClock,
} from "@tabler/icons-react";
import { getJob } from "@/lib/api";
import type { JobDetail } from "@/lib/api";

function formatSalary(min: number, max: number, currency: string): string {
  if (!min && !max) return "Not disclosed";
  const fmt = (n: number) => {
    if (!n || n <= 0) return "0";
    if (currency === "INR") {
      if (n >= 10000000) return `${(n / 10000000).toFixed(1)} Cr`;
      if (n >= 100000) return `${(n / 100000).toFixed(1)} LPA`;
      return `${(n / 1000).toFixed(0)}K`;
    }
    return `${currency} ${n.toLocaleString()}`;
  };
  if (min && !max) return fmt(min);
  if (!min && max) return `Up to ${fmt(max)}`;
  return `${fmt(min)} - ${fmt(max)}`;
}

function workTypeLabel(loc: JobDetail["location"] | undefined): string {
  if (!loc) return "Onsite";
  if (loc.remote) return "Remote";
  if (loc.hybrid) return "Hybrid";
  return "Onsite";
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getJob(jobId);
        setJob(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load job");
      }
      finally { setLoading(false); }
    };
    load();
  }, [jobId]);

  if (loading) {
    return (
      <main className="min-h-screen pt-20" style={{ background: "var(--bg)" }}>
        <div className="max-w-3xl mx-auto px-6 py-8 animate-pulse space-y-4">
          <div className="h-6 rounded w-32" style={{ background: "var(--surface)" }} />
          <div className="h-10 rounded w-3/4" style={{ background: "var(--surface)" }} />
          <div className="h-64 rounded-[16px]" style={{ background: "var(--surface)" }} />
        </div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="min-h-screen pt-20" style={{ background: "var(--bg)" }}>
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-lg text-[var(--text)] mb-2" style={{ fontFamily: "var(--font-display)" }}>Job not found</p>
          <p className="text-sm text-[var(--muted2)] mb-4" style={{ fontFamily: "var(--font-dm-sans)" }}>{error}</p>
          <Link href="/dashboard" className="text-sm font-medium" style={{ color: "var(--accent)", fontFamily: "var(--font-dm-sans)" }}>
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const wt = workTypeLabel(job.location);

  return (
    <main className="min-h-screen pt-14" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 py-2.5 flex items-center justify-between"
        style={{ background: "rgba(10,10,14,0.88)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <Link href="/dashboard" className="flex items-center gap-1 text-sm text-[var(--muted2)] hover:text-[var(--text)] transition-colors"
          style={{ fontFamily: "var(--font-dm-sans)" }}>
          <IconArrowLeft size={14} /> Back
        </Link>
        {job.apply_url && (
          <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
            className="px-4 py-1.5 rounded-[8px] text-xs font-semibold text-white flex items-center gap-1"
            style={{ background: "var(--accent)", fontFamily: "var(--font-dm-sans)" }}>
            Apply Now <IconExternalLink size={12} />
          </a>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[0.6rem] font-medium uppercase tracking-wide"
              style={{
                background: wt === "Remote" ? "rgba(16,185,129,0.12)" : wt === "Hybrid" ? "rgba(245,158,11,0.12)" : "rgba(99,102,241,0.1)",
                color: wt === "Remote" ? "#10b981" : wt === "Hybrid" ? "#f59e0b" : "var(--accent)",
                fontFamily: "var(--font-dm-sans)",
              }}>
              {wt}
            </span>
            {job.role.level && (
              <span className="px-2 py-0.5 rounded text-[0.6rem] font-medium uppercase tracking-wide"
                style={{ background: "var(--surface)", color: "var(--muted2)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                {job.role.level}
              </span>
            )}
            {job.posted_at && !isNaN(new Date(job.posted_at).getTime()) && (
              <span className="text-[0.6rem] text-[var(--muted)] ml-auto" style={{ fontFamily: "var(--font-dm-mono)" }}>
                Posted {new Date(job.posted_at).toLocaleDateString()}
              </span>
            )}
          </div>

          <h1 className="text-[var(--text)] mb-1" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            {job.role.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-6 text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
            <span className="flex items-center gap-1"><IconBuilding size={14} style={{ color: "var(--muted)" }} />{job.company.name}</span>
            <span className="flex items-center gap-1"><IconMapPin size={14} style={{ color: "var(--muted)" }} />{job.location.city}{job.location.state ? `, ${job.location.state}` : ""}</span>
            {job.role.department && <span className="flex items-center gap-1"><IconBriefcase size={14} style={{ color: "var(--muted)" }} />{job.role.department}</span>}
          </div>
        </motion.div>

        {/* Info cards */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid sm:grid-cols-3 gap-3 mb-6">
          {job.compensation?.disclosed && (
            <InfoCard icon={<IconCoin size={16} />} label="Salary" value={formatSalary(job.compensation.salary_min, job.compensation.salary_max, job.compensation.currency)} />
          )}
          {((job.requirements?.exp_years_min ?? 0) > 0 || (job.requirements?.exp_years_max ?? 0) > 0) && (
            <InfoCard icon={<IconClock size={16} />} label="Experience" value={`${job.requirements.exp_years_min || 0}-${job.requirements.exp_years_max || 0} years`} />
          )}
          {job.requirements?.education && (
            <InfoCard icon={<IconSchool size={16} />} label="Education" value={job.requirements.education} />
          )}
        </motion.div>

        {/* Skills */}
        {(job.requirements?.skills?.length ?? 0) > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="p-5 rounded-[16px] mb-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold text-[var(--text)] mb-3" style={{ fontFamily: "var(--font-dm-sans)" }}>Required Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {job.requirements.skills.map((skill) => (
                <span key={skill} className="px-2.5 py-1 rounded-full text-xs"
                  style={{ background: "rgba(99,102,241,0.1)", color: "var(--accent)", border: "1px solid rgba(99,102,241,0.2)", fontFamily: "var(--font-dm-sans)" }}>
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Job Description */}
        {job.raw_jd && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-5 rounded-[16px] mb-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold text-[var(--text)] mb-3" style={{ fontFamily: "var(--font-dm-sans)" }}>Job Description</h2>
            <div className="text-sm text-[var(--muted2)] whitespace-pre-line leading-relaxed"
              style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
              {job.raw_jd}
            </div>
          </motion.div>
        )}

        {/* Company info + Research */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="p-5 rounded-[16px] mb-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3" style={{ fontFamily: "var(--font-dm-sans)" }}>About {job.company.name}</h2>
          <div className="grid grid-cols-2 gap-3 text-xs text-[var(--muted2)] mb-4" style={{ fontFamily: "var(--font-dm-sans)" }}>
            {job.company.industry && <div><span className="text-[var(--muted)] text-[0.6rem] uppercase tracking-wider block mb-0.5" style={{ fontFamily: "var(--font-dm-mono)" }}>Industry</span>{job.company.industry}</div>}
            {job.company.size && <div><span className="text-[var(--muted)] text-[0.6rem] uppercase tracking-wider block mb-0.5" style={{ fontFamily: "var(--font-dm-mono)" }}>Size</span>{job.company.size} employees</div>}
            {job.company.city && <div><span className="text-[var(--muted)] text-[0.6rem] uppercase tracking-wider block mb-0.5" style={{ fontFamily: "var(--font-dm-mono)" }}>HQ</span>{job.company.city}</div>}
            {job.company.domain && <div><span className="text-[var(--muted)] text-[0.6rem] uppercase tracking-wider block mb-0.5" style={{ fontFamily: "var(--font-dm-mono)" }}>Website</span>{job.company.domain}</div>}
          </div>

          {/* Research links */}
          <div className="pt-3 flex flex-wrap gap-2" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="w-full text-[0.6rem] text-[var(--muted)] uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-dm-mono)" }}>Research</p>
            {[
              { label: "Glassdoor Reviews", url: `https://www.glassdoor.co.in/Reviews/${encodeURIComponent(job.company.name)}-Reviews` },
              { label: "LinkedIn", url: `https://www.linkedin.com/company/${encodeURIComponent(job.company.name.toLowerCase().replace(/\s+/g, "-"))}` },
              { label: "AmbitionBox", url: `https://www.ambitionbox.com/overview/${encodeURIComponent(job.company.name.toLowerCase().replace(/\s+/g, "-"))}-overview` },
            ].map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[0.65rem] font-medium transition-colors hover:text-[var(--accent)]"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted2)", fontFamily: "var(--font-dm-sans)" }}>
                {link.label} <IconExternalLink size={10} />
              </a>
            ))}
          </div>
        </motion.div>

        {/* Prepare for interview */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="p-4 rounded-[14px] mb-5 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(99,102,241,0.04))", border: "1px solid rgba(99,102,241,0.15)" }}>
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>Prepare for this interview</p>
            <p className="text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>Get AI-generated practice questions for this role</p>
          </div>
          <Link href="/interview-prep"
            className="px-4 py-2 rounded-[8px] text-xs font-medium text-white flex-shrink-0"
            style={{ background: "var(--accent)", fontFamily: "var(--font-dm-sans)" }}>
            Practice
          </Link>
        </motion.div>

        {/* Bottom CTA */}
        {job.apply_url && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-center py-6">
            <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-[12px] text-sm font-semibold text-white transition-all hover:brightness-110"
              style={{ background: "linear-gradient(135deg, var(--accent), #7c3aed)", fontFamily: "var(--font-dm-sans)", boxShadow: "0 4px 20px rgba(108,99,255,0.3)" }}>
              Apply for this Role <IconExternalLink size={14} />
            </a>
          </motion.div>
        )}
      </div>
    </main>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-[12px] flex items-center gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(99,102,241,0.1)", color: "var(--accent)" }}>
        {icon}
      </div>
      <div>
        <p className="text-[0.55rem] uppercase tracking-wider text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>{label}</p>
        <p className="text-xs font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{value}</p>
      </div>
    </div>
  );
}
