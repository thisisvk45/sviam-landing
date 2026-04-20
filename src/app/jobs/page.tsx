import Link from "next/link";
import type { Metadata } from "next";
import { IconMapPin, IconBuilding, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import JobFilters from "./JobFilters";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type JobListItem = {
  _id: string;
  role: { title: string; level: string; type: string };
  company: { name: string; city: string; industry: string };
  location: { city: string; state: string; remote: boolean; hybrid: boolean };
  requirements: { skills: string[]; exp_years_min: number; exp_years_max: number };
  compensation: { salary_min: number; salary_max: number; currency: string; disclosed: boolean };
  posted_at: string;
  apply_url: string;
};

async function fetchJobs(params: {
  city?: string;
  level?: string;
  remote?: string;
  page?: string;
}): Promise<{ jobs: JobListItem[]; total: number }> {
  try {
    const qs = new URLSearchParams();
    if (params.city) qs.set("city", params.city);
    if (params.level) qs.set("level", params.level);
    if (params.remote === "true") qs.set("remote", "true");
    const page = parseInt(params.page || "1", 10);
    qs.set("limit", "20");
    qs.set("skip", String((page - 1) * 20));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_URL}/jobs?${qs}`, { next: { revalidate: 600 }, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return { jobs: [], total: 0 };
    const data = await res.json();
    return { jobs: data.jobs || [], total: data.total || data.count || 0 };
  } catch {
    return { jobs: [], total: 0 };
  }
}

function formatSalary(comp: JobListItem["compensation"]): string | null {
  if (!comp?.disclosed || (!comp.salary_min && !comp.salary_max)) return null;
  const fmt = (n: number) => {
    if (comp.currency === "INR") {
      if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
      if (n >= 100000) return `₹${(n / 100000).toFixed(0)}L`;
      return `₹${(n / 1000).toFixed(0)}K`;
    }
    return `${comp.currency} ${n.toLocaleString()}`;
  };
  if (comp.salary_min && comp.salary_max) return `${fmt(comp.salary_min)} – ${fmt(comp.salary_max)}`;
  if (comp.salary_min) return fmt(comp.salary_min);
  return `Up to ${fmt(comp.salary_max)}`;
}

function workType(loc: JobListItem["location"]): string {
  if (loc?.remote) return "Remote";
  if (loc?.hybrid) return "Hybrid";
  return "Onsite";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const city = typeof sp.city === "string" ? sp.city : undefined;
  const title = city ? `Tech Jobs in ${city} | SViam` : "Tech Jobs in India | SViam";
  const description = city
    ? `Browse tech jobs in ${city}. AI-powered matching, resume tailoring, and interview prep.`
    : "Browse hundreds of tech jobs across India. AI-powered matching, resume tailoring, and interview prep on SViam.";
  return { title, description };
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const city = typeof sp.city === "string" ? sp.city : undefined;
  const level = typeof sp.level === "string" ? sp.level : undefined;
  const remote = typeof sp.remote === "string" ? sp.remote : undefined;
  const pageStr = typeof sp.page === "string" ? sp.page : "1";
  const currentPage = parseInt(pageStr, 10) || 1;

  const { jobs, total } = await fetchJobs({ city, level, remote, page: pageStr });
  const totalPages = Math.ceil(total / 20);

  return (
    <main className="min-h-screen pt-14" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 py-2.5 flex items-center justify-between"
        style={{ background: "rgba(10,10,14,0.88)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" className="text-sm font-semibold text-[var(--text)]" style={{ fontFamily: "var(--font-display)" }}>
          SViam
        </Link>
        <Link href="/dashboard"
          className="px-4 py-1.5 rounded-[8px] text-xs font-semibold text-white"
          style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)" }}>
          Dashboard
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-[var(--text)] mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
          {city ? `Tech Jobs in ${city}` : "Tech Jobs in India"}
        </h1>
        <p className="text-sm text-[var(--muted)] mb-6" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
          {total} {total === 1 ? "job" : "jobs"} found
        </p>

        {/* Filters */}
        <JobFilters currentCity={city} currentLevel={level} currentRemote={remote} />

        {/* Job list */}
        <div className="space-y-3 mt-6">
          {jobs.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>No jobs match your filters.</p>
              <Link href="/jobs" className="text-sm mt-2 inline-block" style={{ color: "var(--teal)", fontFamily: "var(--font-dm-sans)" }}>
                Clear filters
              </Link>
            </div>
          )}
          {jobs.map((job) => {
            const wt = workType(job.location);
            const salary = formatSalary(job.compensation);
            return (
              <Link key={job._id} href={`/jobs/${job._id}`}
                className="block p-5 rounded-[14px] transition-all hover:translate-y-[-1px]"
                style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 rounded text-[0.55rem] font-medium uppercase tracking-wide"
                        style={{
                          background: wt === "Remote" ? "rgba(0,153,153,0.12)" : wt === "Hybrid" ? "rgba(245,158,11,0.12)" : "rgba(99,102,241,0.1)",
                          color: wt === "Remote" ? "#009999" : wt === "Hybrid" ? "#f59e0b" : "var(--teal)",
                          fontFamily: "var(--font-dm-sans)",
                        }}>
                        {wt}
                      </span>
                      {job.role.level && (
                        <span className="text-[0.55rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>{job.role.level}</span>
                      )}
                      {job.posted_at && (
                        <span className="text-[0.55rem] text-[var(--muted)] ml-auto" style={{ fontFamily: "var(--font-dm-mono)" }}>
                          {new Date(job.posted_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h2 className="text-[var(--text)] font-semibold mb-1" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                      {job.role.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted2)] mb-2" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      <span className="flex items-center gap-1"><IconBuilding size={12} style={{ color: "var(--muted)" }} />{job.company.name}</span>
                      {job.location.city && <span className="flex items-center gap-1"><IconMapPin size={12} style={{ color: "var(--muted)" }} />{job.location.city}</span>}
                      {salary && <span className="flex items-center gap-1 text-[var(--teal)]">{salary}</span>}
                    </div>
                    {job.requirements?.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {job.requirements.skills.slice(0, 4).map((skill) => (
                          <span key={skill} className="px-2 py-0.5 rounded-full text-[0.6rem]"
                            style={{ background: "var(--surface)", color: "var(--muted2)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                            {skill}
                          </span>
                        ))}
                        {job.requirements.skills.length > 4 && (
                          <span className="px-2 py-0.5 rounded-full text-[0.6rem]"
                            style={{ color: "var(--teal)", fontFamily: "var(--font-dm-sans)" }}>
                            +{job.requirements.skills.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {currentPage > 1 && (
              <Link href={`/jobs?${new URLSearchParams({ ...(city && { city }), ...(level && { level }), ...(remote && { remote }), page: String(currentPage - 1) })}`}
                className="flex items-center gap-1 px-3 py-2 rounded-[8px] text-xs"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted2)", fontFamily: "var(--font-dm-sans)" }}>
                <IconChevronLeft size={14} /> Prev
              </Link>
            )}
            <span className="text-xs text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link href={`/jobs?${new URLSearchParams({ ...(city && { city }), ...(level && { level }), ...(remote && { remote }), page: String(currentPage + 1) })}`}
                className="flex items-center gap-1 px-3 py-2 rounded-[8px] text-xs"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted2)", fontFamily: "var(--font-dm-sans)" }}>
                Next <IconChevronRight size={14} />
              </Link>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center p-6 rounded-[16px]"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))", border: "1px solid rgba(99,102,241,0.15)" }}>
          <p className="text-lg font-semibold text-[var(--text)] mb-1" style={{ fontFamily: "var(--font-display)" }}>
            See how you match these jobs
          </p>
          <p className="text-sm text-[var(--muted2)] mb-4" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            Upload your resume and get AI-powered match scores for every role
          </p>
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-sm font-semibold text-white"
            style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)" }}>
            Get Started Free
          </Link>
        </div>
      </div>
    </main>
  );
}
