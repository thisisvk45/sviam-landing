import Link from "next/link";
import type { Metadata } from "next";
import { IconMapPin, IconBuilding } from "@tabler/icons-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CITY_MAP: Record<string, string> = {
  bangalore: "Bangalore",
  mumbai: "Mumbai",
  "delhi-ncr": "Delhi NCR",
  hyderabad: "Hyderabad",
  chennai: "Chennai",
  pune: "Pune",
  kolkata: "Kolkata",
  ahmedabad: "Ahmedabad",
  noida: "Noida",
  gurgaon: "Gurgaon",
  remote: "Remote",
};

const ALL_CITIES = Object.entries(CITY_MAP);

// Render on-demand with ISR, not at build time
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const cityName = CITY_MAP[slug] || slug;
  const isRemote = slug === "remote";
  return {
    title: isRemote ? "Remote Tech Jobs in India | SViam" : `Tech Jobs in ${cityName} | SViam`,
    description: isRemote
      ? "Browse remote tech jobs across India. AI-powered matching and resume tailoring on SViam."
      : `Find the best tech jobs in ${cityName}. AI-powered matching, resume tailoring, and interview prep on SViam.`,
  };
}

type CityJob = {
  _id: string;
  role: { title: string; level: string };
  company: { name: string };
  location: { city: string; remote: boolean; hybrid: boolean };
  requirements: { skills: string[] };
  compensation: { salary_min: number; salary_max: number; currency: string; disclosed: boolean };
  posted_at: string;
};

export default async function CityJobsPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const cityName = CITY_MAP[slug] || slug;
  const isRemote = slug === "remote";

  let jobs: CityJob[] = [];
  let total = 0;
  try {
    const qs = new URLSearchParams();
    if (isRemote) {
      qs.set("remote", "true");
    } else {
      qs.set("city", cityName);
    }
    qs.set("limit", "50");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_URL}/jobs?${qs}`, { next: { revalidate: 600 }, signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      jobs = data.jobs || [];
      total = data.total || data.count || 0;
    }
  } catch {}

  return (
    <main className="min-h-screen pt-14" style={{ background: "var(--bg)" }}>
      <div className="fixed top-0 left-0 right-0 z-50 px-6 py-2.5 flex items-center justify-between"
        style={{ background: "rgba(10,10,14,0.88)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <Link href="/jobs" className="text-sm text-[var(--muted2)] hover:text-[var(--text)] transition-colors" style={{ fontFamily: "var(--font-dm-sans)" }}>
          All Jobs
        </Link>
        <Link href="/dashboard"
          className="px-4 py-1.5 rounded-[8px] text-xs font-semibold text-white"
          style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)" }}>
          Dashboard
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-[var(--text)] mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
          {isRemote ? "Remote Tech Jobs" : `Tech Jobs in ${cityName}`}
        </h1>
        <p className="text-sm text-[var(--muted)] mb-8" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
          {total} open {total === 1 ? "position" : "positions"}
        </p>

        <div className="space-y-3">
          {jobs.map((job) => (
            <Link key={job._id} href={`/jobs/${job._id}`}
              className="block p-4 rounded-[12px] transition-all hover:translate-y-[-1px]"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="text-[var(--text)] font-semibold mb-1" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                {job.role.title}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                <span className="flex items-center gap-1"><IconBuilding size={12} style={{ color: "var(--muted)" }} />{job.company.name}</span>
                <span className="flex items-center gap-1"><IconMapPin size={12} style={{ color: "var(--muted)" }} />{job.location.city}</span>
                {job.compensation?.disclosed && job.compensation.salary_min > 0 && job.compensation.currency === "INR" && (
                  <span className="text-[var(--teal)]">
                    ₹{(job.compensation.salary_min / 100000).toFixed(0)}-{(job.compensation.salary_max / 100000).toFixed(0)} LPA
                  </span>
                )}
              </div>
              {job.requirements?.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {job.requirements.skills.slice(0, 4).map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-full text-[0.6rem]"
                      style={{ background: "var(--surface)", color: "var(--muted2)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>

        {jobs.length === 0 && (
          <p className="text-center py-16 text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
            No jobs found in {cityName} right now. Check back soon!
          </p>
        )}

        {/* Other cities */}
        <div className="mt-12 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold text-[var(--text)] mb-4" style={{ fontFamily: "var(--font-dm-sans)" }}>
            Browse jobs in other cities
          </h2>
          <div className="flex flex-wrap gap-2">
            {ALL_CITIES.filter(([s]) => s !== slug).map(([s, name]) => (
              <Link key={s} href={`/jobs/in/${s}`}
                className="px-3 py-1.5 rounded-[8px] text-xs transition-colors hover:text-[var(--teal)]"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted2)", fontFamily: "var(--font-dm-sans)" }}>
                {name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
