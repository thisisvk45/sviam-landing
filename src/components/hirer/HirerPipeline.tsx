"use client";

import { useRef, useState } from "react";
import { useInView, usePrefersReducedMotion } from "@/hooks/useInView";
import DashboardMockup from "../shared/DashboardMockup";

const points = [
  {
    label: "Pre-screened",
    desc: "No more unqualified resumes flooding your inbox. Every name you see has already proved they can do the job.",
  },
  {
    label: "Your spec",
    desc: "React + system design + senior-level follow-ups? Done. You define the bar, SViam enforces it.",
  },
  {
    label: "Scored reports",
    desc: "Topic-by-topic breakdown with scores, AI reasoning, and a clear hire/no-hire recommendation. No more gut feelings.",
  },
];

const candidates = [
  {
    initials: "PK",
    color: "#6c63ff",
    name: "Priya Krishnan",
    role: "Senior Frontend Engineer",
    score: 92,
    status: "Strong Hire",
    statusColor: "var(--green)",
  },
  {
    initials: "AR",
    color: "#00d4aa",
    name: "Arjun Reddy",
    role: "Backend Developer",
    score: 87,
    status: "Shortlisted",
    statusColor: "var(--accent2)",
  },
  {
    initials: "SM",
    color: "#ff6b35",
    name: "Sneha Mehta",
    role: "Full Stack Engineer",
    score: 79,
    status: "Under Review",
    statusColor: "var(--gold)",
  },
];

export default function HirerPipeline() {
  const { ref, inView } = useInView<HTMLElement>({ once: true, margin: "-80px" });
  const reducedMotion = usePrefersReducedMotion();
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const animBase = reducedMotion ? "" : "anim-base";
  const show = inView ? "in-view" : "";

  return (
    <section className="relative z-10 py-20 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left — copy */}
          <div className={`${animBase} anim-fade-up ${show}`}>
            <span
              className={`text-xs tracking-[0.2em] text-[var(--muted)] mb-4 block ${animBase} anim-fade-left ${show}`}
              style={{
                fontFamily: "var(--font-dm-mono)",
                textTransform: "uppercase",
                transitionDelay: "0s",
              }}
            >
              YOUR PIPELINE
            </span>
            <div className="overflow-hidden">
              <h2
                className={`mb-6 ${animBase} anim-reveal-up ${show}`}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
                  lineHeight: 1.08,
                  letterSpacing: "-0.025em",
                  transitionDelay: "0.1s",
                }}
              >
                Stop burning ₹1.5L per hire.
                <br />
                <span className="text-[var(--muted2)]">
                  Start seeing who&apos;s actually good.
                </span>
              </h2>
            </div>
            <p
              className={`text-[var(--muted2)] mb-8 max-w-lg ${animBase} anim-fade-up ${show}`}
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontWeight: 300,
                lineHeight: 1.6,
                transitionDelay: "0.2s",
              }}
            >
              Your engineers are wasting 300+ hours a year on interviews that go
              nowhere. SViam pre-screens every candidate with an AI interview
              built to your exact spec. The only people who reach your
              calendar are worth the meeting.
            </p>

            <div className="space-y-4 mb-8">
              {points.map((p, i) => (
                <div
                  key={p.label}
                  className={`${animBase} anim-fade-left ${show} hover-lift`}
                  style={{ transitionDelay: `${0.15 + i * 0.1}s` }}
                >
                  <p
                    className="text-sm"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    <span className="font-medium text-[var(--text)]">
                      {p.label}
                    </span>
                    {" · "}
                    <span
                      className="text-[var(--muted2)]"
                      style={{ fontWeight: 300 }}
                    >
                      {p.desc}
                    </span>
                  </p>
                </div>
              ))}
            </div>

            <a
              href="#waitlist"
              className={`inline-flex items-center gap-3 hover-lift ${animBase} anim-fade-up ${show}`}
              style={{ transitionDelay: "0.6s" }}
            >
              <span
                className="live-dot"
                style={{ background: "var(--teal)" }}
              />
              <span
                className="text-sm font-medium text-[var(--accent2)]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Join the Waitlist
              </span>
            </a>
          </div>

          {/* Right — dashboard */}
          <div
            className={`${animBase} anim-fade-up ${show}`}
            style={{
              perspective: "1200px",
              transitionDelay: "0.2s",
            }}
          >
            <DashboardMockup url="sviam.in/company/pipeline">
              {/* Candidate rows */}
              <div className="p-4 space-y-3">
                {candidates.map((c, i) => (
                  <div
                    key={c.name}
                    onMouseEnter={() => setHoveredRow(i)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`flex items-center gap-3 p-3 rounded-[8px] relative overflow-hidden hover-lift ${animBase} anim-fade-up ${show}`}
                    style={{
                      border: "1px solid var(--border)",
                      background: hoveredRow === i ? "rgba(255,255,255,0.02)" : "transparent",
                      transitionDelay: `${0.3 + i * 0.12}s`,
                    }}
                  >
                    {/* Shine on hover */}
                    {hoveredRow === i && !reducedMotion && (
                      <div
                        className="absolute inset-0 pointer-events-none btn-shimmer"
                        style={{
                          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)",
                        }}
                      />
                    )}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs transition-transform hover:scale-110"
                      style={{ background: c.color }}
                    >
                      {c.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-medium text-[var(--text)]"
                        style={{ fontFamily: "var(--font-dm-sans)" }}
                      >
                        {c.name}
                      </div>
                      <div
                        className="text-xs text-[var(--muted)]"
                        style={{ fontFamily: "var(--font-dm-sans)" }}
                      >
                        {c.role}
                      </div>
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-[8px]"
                      style={{
                        color: "var(--green)",
                        background: "rgba(6,214,160,0.1)",
                        fontFamily: "var(--font-dm-mono)",
                      }}
                    >
                      {c.score}/100
                    </span>
                    <span
                      className="text-[10px] font-medium px-2 py-1 rounded-[6px] transition-transform"
                      style={{
                        color: c.statusColor,
                        background: `color-mix(in srgb, ${c.statusColor} 10%, transparent)`,
                        fontFamily: "var(--font-dm-sans)",
                        transform: hoveredRow === i && !reducedMotion ? "scale(1.1)" : "scale(1)",
                      }}
                    >
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div
                className="px-4 pb-4 pt-2"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <div
                  className="text-[11px] text-[var(--muted)] mb-3"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Time to hire comparison
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[10px] text-[var(--text)] w-16 shrink-0"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      SViam
                    </span>
                    <div
                      className="flex-1 h-5 rounded-[4px] overflow-hidden"
                      style={{ background: "var(--surface)" }}
                    >
                      <div
                        className="h-full rounded-[4px]"
                        style={{
                          background: "linear-gradient(90deg, var(--green), var(--teal))",
                          boxShadow: "0 0 10px rgba(6,214,160,0.3)",
                          width: inView ? "21%" : "0%",
                          transition: "width 1.2s ease-out 0.8s",
                        }}
                      />
                    </div>
                    <span
                      className="text-[10px] font-medium text-[var(--green)] w-16 text-right"
                      style={{ fontFamily: "var(--font-dm-mono)" }}
                    >
                      ~10 days
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[10px] text-[var(--muted)] w-16 shrink-0"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      Industry
                    </span>
                    <div
                      className="flex-1 h-5 rounded-[4px] overflow-hidden"
                      style={{ background: "var(--surface)" }}
                    >
                      <div
                        className="h-full rounded-[4px]"
                        style={{
                          background: "var(--muted)",
                          width: inView ? "100%" : "0%",
                          transition: "width 1.5s ease-out 1s",
                        }}
                      />
                    </div>
                    <span
                      className="text-[10px] font-medium text-[var(--muted)] w-16 text-right"
                      style={{ fontFamily: "var(--font-dm-mono)" }}
                    >
                      47 days
                    </span>
                  </div>
                </div>
                <div
                  className="text-[0.6rem] text-[var(--muted)] mt-2"
                  style={{ fontFamily: "var(--font-dm-mono)" }}
                >
                  Quantalent India, 2026
                </div>
              </div>
            </DashboardMockup>
          </div>
        </div>
      </div>
    </section>
  );
}
