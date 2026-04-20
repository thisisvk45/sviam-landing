"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type TickerJob = {
  job_id: string;
  title: string;
  company: string;
  city: string;
  posted_at: string;
  apply_url: string;
  logo_domain: string;
};

const COMPANY_DOMAINS: Record<string, string> = {
  Zerodha: "zerodha.com",
  CRED: "cred.club",
  Meesho: "meesho.com",
  PhonePe: "phonepe.com",
  Groww: "groww.in",
  Razorpay: "razorpay.com",
  Flipkart: "flipkart.com",
  Swiggy: "swiggy.com",
  Zomato: "zomato.com",
  Paytm: "paytm.com",
  Ola: "olacabs.com",
  Byju: "byjus.com",
  Freshworks: "freshworks.com",
  Zoho: "zoho.com",
  Infosys: "infosys.com",
  Wipro: "wipro.com",
  TCS: "tcs.com",
  Google: "google.com",
  Microsoft: "microsoft.com",
  Amazon: "amazon.com",
};

const FALLBACK_JOBS: TickerJob[] = [
  { job_id: "1", title: "Backend Engineer", company: "Zerodha", city: "Bengaluru", posted_at: new Date(Date.now() - 3600000).toISOString(), apply_url: "#", logo_domain: "zerodha.com" },
  { job_id: "2", title: "Product Manager", company: "CRED", city: "Bengaluru", posted_at: new Date(Date.now() - 7200000).toISOString(), apply_url: "#", logo_domain: "cred.club" },
  { job_id: "3", title: "Data Scientist", company: "Meesho", city: "Bengaluru", posted_at: new Date(Date.now() - 10800000).toISOString(), apply_url: "#", logo_domain: "meesho.com" },
  { job_id: "4", title: "Full Stack Developer", company: "PhonePe", city: "Bengaluru", posted_at: new Date(Date.now() - 14400000).toISOString(), apply_url: "#", logo_domain: "phonepe.com" },
  { job_id: "5", title: "ML Engineer", company: "Groww", city: "Bengaluru", posted_at: new Date(Date.now() - 18000000).toISOString(), apply_url: "#", logo_domain: "groww.in" },
  { job_id: "6", title: "Senior SWE", company: "Razorpay", city: "Bengaluru", posted_at: new Date(Date.now() - 5400000).toISOString(), apply_url: "#", logo_domain: "razorpay.com" },
  { job_id: "7", title: "DevOps Engineer", company: "Flipkart", city: "Bengaluru", posted_at: new Date(Date.now() - 9000000).toISOString(), apply_url: "#", logo_domain: "flipkart.com" },
  { job_id: "8", title: "Frontend Engineer", company: "Swiggy", city: "Bengaluru", posted_at: new Date(Date.now() - 12600000).toISOString(), apply_url: "#", logo_domain: "swiggy.com" },
];

function guessDomain(companyName: string): string {
  const known = COMPANY_DOMAINS[companyName];
  if (known) return known;
  // Try common patterns
  const cleaned = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${cleaned}.com`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function CompanyLogo({ domain, company }: { domain: string; company: string }) {
  const [errored, setErrored] = useState(false);
  const initial = company.charAt(0).toUpperCase();
  const colors = ["#6366f1", "#009999", "#f97316", "#ec4899", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444"];
  const color = colors[initial.charCodeAt(0) % colors.length];

  if (errored) {
    return (
      <span
        className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
        style={{ background: color }}
      >
        {initial}
      </span>
    );
  }

  return (
    <Image
      src={`https://logo.clearbit.com/${domain}`}
      alt={company}
      width={24}
      height={24}
      className="w-6 h-6 rounded-md object-contain shrink-0"
      style={{ background: "#fff" }}
      onError={() => setErrored(true)}
      loading="lazy"
      unoptimized
    />
  );
}

export default function JobTicker() {
  const [jobs, setJobs] = useState<TickerJob[]>(FALLBACK_JOBS);

  useEffect(() => {
    fetch(`${API_URL}/jobs?limit=20&sort=newest`, { mode: "cors" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const results = data?.jobs || data?.results;
        if (results && results.length > 0) {
          setJobs(
            results.map((j: Record<string, unknown>) => {
              const companyObj = j.company as Record<string, unknown> | undefined;
              const companyName = (companyObj?.name || j.company || "") as string;
              const companyDomain = (companyObj?.domain || "") as string;
              const roleObj = j.role as Record<string, unknown> | undefined;
              const locationObj = j.location as Record<string, unknown> | undefined;
              return {
                job_id: (j._id || j.job_id || "") as string,
                title: (roleObj?.title || j.title || "") as string,
                company: companyName,
                city: (locationObj?.city || j.city || "") as string,
                posted_at: (j.posted_at || new Date().toISOString()) as string,
                apply_url: (j.apply_url || j.source_url || "#") as string,
                logo_domain: companyDomain || guessDomain(companyName),
              };
            })
          );
        }
      })
      .catch(() => {});
  }, []);

  const doubled = [...jobs, ...jobs];

  return (
    <div
      className="relative z-10 w-full overflow-hidden select-none"
      style={{
        background: "var(--surface)",
        height: 56,
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Marquee track */}
      <div className="h-full flex items-center">
        <div className="ticker-track">
          {doubled.map((job, i) => (
            <a
              key={`${job.job_id}-${i}`}
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-5 h-full shrink-0 hover:bg-[var(--card)] transition-colors"
              style={{ borderRight: "1px solid var(--border)" }}
            >
              <CompanyLogo domain={job.logo_domain} company={job.company} />
              <span className="text-[12px] text-[var(--text)] whitespace-nowrap font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {job.title}
              </span>
              <span className="text-[12px] text-[var(--muted)] whitespace-nowrap" style={{ fontFamily: "var(--font-dm-sans)" }}>
                &middot; {job.company} &middot; {job.city} &middot; {timeAgo(job.posted_at)}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Edge fades */}
      <div
        className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none z-10"
        style={{ background: "linear-gradient(90deg, var(--surface), transparent)" }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none z-10"
        style={{ background: "linear-gradient(270deg, var(--surface), transparent)" }}
      />
    </div>
  );
}
