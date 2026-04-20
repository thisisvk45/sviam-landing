"use client";

import { useEffect, useRef, useState } from "react";
import { useFork } from "./fork/ForkContext";
import { usePrefersReducedMotion } from "@/hooks/useInView";

// Beam network nodes — candidates on left, companies on right, SViam in center
const nodes = [
  // Left — candidates
  { x: 60, y: 70, color: "#6c63ff", size: 5 },
  { x: 40, y: 140, color: "#9b8fff", size: 4 },
  { x: 70, y: 210, color: "#6c63ff", size: 6 },
  { x: 35, y: 275, color: "#9b8fff", size: 3 },
  { x: 80, y: 320, color: "#6c63ff", size: 4 },
  // Center — SViam
  { x: 300, y: 190, color: "#009999", size: 14 },
  // Right — companies
  { x: 530, y: 70, color: "#009999", size: 5 },
  { x: 550, y: 140, color: "#33b3b3", size: 4 },
  { x: 520, y: 210, color: "#009999", size: 6 },
  { x: 555, y: 275, color: "#33b3b3", size: 3 },
  { x: 525, y: 320, color: "#009999", size: 4 },
];

const beams = [
  { from: 0, to: 5 }, { from: 1, to: 5 }, { from: 2, to: 5 },
  { from: 3, to: 5 }, { from: 4, to: 5 },
  { from: 5, to: 6 }, { from: 5, to: 7 }, { from: 5, to: 8 },
  { from: 5, to: 9 }, { from: 5, to: 10 },
];

export default function Hero() {
  const reducedMotion = usePrefersReducedMotion();
  const { setPath } = useFork();
  const heroRef = useRef<HTMLDivElement>(null);

  // Vanilla scroll-driven parallax
  useEffect(() => {
    if (reducedMotion) return;
    const el = heroRef.current;
    if (!el) return;

    let rafId: number;
    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const maxScroll = window.innerHeight * 0.3;
        const progress = Math.min(scrollY / maxScroll, 1);
        el.style.transform = `translateY(${-progress * 80}px)`;
        el.style.opacity = String(1 - progress);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
      {/* Beam network */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          viewBox="0 0 600 380"
          className="w-full max-w-3xl"
          role="img"
          aria-label="AI matching network visualization"
          style={{
            filter: "blur(0.5px)",
            opacity: 0,
            animation: reducedMotion ? "none" : "fadeInUp 2s ease 1.2s forwards",
          }}
        >
          {beams.map((beam, i) => {
            const from = nodes[beam.from];
            const to = nodes[beam.to];
            const isLeft = beam.from < 5;
            const dur = `${1.8 + Math.random() * 0.5}s`;
            const beginTime = `${1.5 + i * 0.35}s`;
            return (
              <g key={i}>
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={isLeft ? "#6c63ff" : "#009999"}
                  strokeWidth="1" strokeOpacity="0.2"
                />
                {!reducedMotion && (
                  <circle
                    r="2.5"
                    fill={isLeft ? "#9b8fff" : "#33cccc"}
                    filter="url(#glow)"
                  >
                    <animateMotion
                      dur={dur}
                      repeatCount="indefinite"
                      begin={beginTime}
                      path={`M${from.x},${from.y} L${to.x},${to.y}`}
                      fill="freeze"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.9;0.9;0"
                      dur={dur}
                      repeatCount="indefinite"
                      begin={beginTime}
                    />
                  </circle>
                )}
              </g>
            );
          })}
          {nodes.map((node, i) => (
            <g key={`n-${i}`}>
              {i === 5 && !reducedMotion && (
                <circle
                  cx={node.x} cy={node.y} r={node.size + 10}
                  fill="none" stroke="#009999" strokeWidth="1"
                >
                  <animate attributeName="r" values={`${node.size + 10};${node.size + 25};${node.size + 10}`} dur="3s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.3;0.05;0.3" dur="3s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={node.x} cy={node.y} r={node.size}
                fill={node.color} fillOpacity={i === 5 ? 0.9 : 0.4}
                style={{
                  opacity: reducedMotion ? 1 : 0,
                  animation: reducedMotion ? "none" : `fadeInScale 0.4s ease ${1.3 + i * 0.08}s forwards`,
                  transformOrigin: `${node.x}px ${node.y}px`,
                }}
              />
            </g>
          ))}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
        </svg>
      </div>

      <div
        ref={heroRef}
        className="max-w-5xl mx-auto text-center relative"
        style={{ willChange: reducedMotion ? "auto" : "transform, opacity" }}
      >
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 hover-scale"
          style={{
            background: "rgba(0,153,153,0.08)",
            border: "1px solid rgba(0,153,153,0.2)",
            backdropFilter: "blur(10px)",
            opacity: 0,
            animation: reducedMotion ? "none" : "fadeInScale 0.6s ease 0.1s forwards",
          }}
        >
          <span className="live-dot" />
          <span className="text-xs text-[var(--teal)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
            Live now. Free for job seekers
          </span>
        </div>

        {/* Headline — aspirational, premium */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3rem, 7.5vw, 5.5rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            fontWeight: 700,
          }}
          className="mb-6"
        >
          <span className="block overflow-hidden">
            <span
              className="inline-block"
              style={{
                opacity: 0,
                animation: reducedMotion ? "none" : "revealUp 0.8s cubic-bezier(0.33,1,0.68,1) 0.15s forwards",
                transformOrigin: "bottom",
              }}
            >
              Jobs that actually fit.
            </span>
          </span>
          <span className="block overflow-hidden">
            <span
              className="inline-block gradient-text"
              style={{
                opacity: 0,
                animation: reducedMotion ? "none" : "revealUp 0.8s cubic-bezier(0.33,1,0.68,1) 0.35s forwards",
                transformOrigin: "bottom",
              }}
            >
              Hires that actually last.
            </span>
          </span>
        </h1>

        {/* Sub */}
        <p
          className="text-[0.95rem] text-[var(--muted)] mb-4 max-w-xl mx-auto"
          style={{
            fontFamily: "var(--font-dm-sans)", fontWeight: 300, lineHeight: 1.6,
            opacity: 0,
            animation: reducedMotion ? "none" : "fadeInUp 0.6s ease 0.85s forwards",
          }}
        >
          AI-powered job matching and interviews.
          One platform for candidates and companies.
        </p>

        {/* Proof line */}
        <p
          className="text-xs text-[var(--muted)] mb-10"
          style={{
            fontFamily: "var(--font-dm-mono)",
            opacity: 0,
            animation: reducedMotion ? "none" : "fadeInUp 0.5s ease 0.9s forwards",
          }}
        >
          Job matching &middot; Resume tailoring &middot; Interview prep &middot; Cover letters
        </p>

        {/* Dual CTA */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          style={{
            opacity: 0,
            animation: reducedMotion ? "none" : "fadeInUp 0.6s ease 1.1s forwards",
          }}
        >
          <button
            onClick={() => {
              setPath("seeker");
              document.getElementById("fork")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group relative px-8 py-4 rounded-[14px] text-white font-medium overflow-hidden min-w-[220px] btn-shimmer hover-scale"
            style={{
              background: "linear-gradient(135deg, var(--teal), #33b3b3)",
              boxShadow: "0 0 40px rgba(0,153,153,0.25), 0 4px 20px rgba(0,0,0,0.08)",
              fontFamily: "var(--font-dm-sans)", fontSize: "0.95rem",
              transition: "transform 0.15s ease, box-shadow 0.2s ease",
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Find me a job
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </button>

          <button
            onClick={() => {
              setPath("hirer");
              document.getElementById("fork")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group relative px-8 py-4 rounded-[14px] font-medium overflow-hidden min-w-[220px] hover-scale"
            style={{
              background: "rgba(0,153,153,0.06)",
              border: "1px solid rgba(0,153,153,0.25)",
              color: "var(--teal)",
              fontFamily: "var(--font-dm-sans)", fontSize: "0.95rem",
              backdropFilter: "blur(10px)",
              transition: "transform 0.15s ease, border-color 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              I need to hire
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </button>
        </div>

        {/* Floating dashboard preview */}
        <div
          className="relative mx-auto max-w-2xl"
          style={{
            perspective: "1200px",
            opacity: 0,
            animation: reducedMotion ? "none" : "fadeInUp 1s cubic-bezier(0.33,1,0.68,1) 1.4s forwards",
          }}
        >
          <div
            className="rounded-[16px] overflow-hidden relative hover-lift"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "0 25px 80px rgba(0,0,0,0.06), 0 0 60px rgba(0,153,153,0.08)",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
          >
            {/* Chrome bar */}
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
              <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
              <span className="w-2 h-2 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-[9px] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                sviam.in/dashboard
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="live-dot" style={{ width: 5, height: 5 }} />
                <span className="text-[8px] text-[var(--green)]" style={{ fontFamily: "var(--font-dm-mono)" }}>LIVE</span>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-4 space-y-2.5">
              {[
                { letter: "R", name: "Senior SWE", company: "Razorpay", score: "94%", color: "#6c63ff", sc: "#33b3b3", tag: "Strong match" },
                { letter: "Z", name: "Full Stack Dev", company: "Zerodha", score: "87%", color: "#009999", sc: "#ffd166", tag: "Good fit" },
                { letter: "F", name: "Backend Engineer", company: "Flipkart", score: "82%", color: "#ff6b35", sc: "#ffd166", tag: "Potential" },
              ].map((row, i) => (
                <div
                  key={row.letter}
                  className="flex items-center gap-3 p-2.5 rounded-[10px] transition-colors duration-200 hover:bg-[rgba(255,255,255,0.02)]"
                  style={{
                    border: "1px solid var(--border)",
                    opacity: 0,
                    animation: reducedMotion ? "none" : `fadeInLeft 0.5s ease ${1.8 + i * 0.15}s forwards`,
                  }}
                >
                  <div className="w-9 h-9 rounded-[8px] flex items-center justify-center text-white text-xs font-bold" style={{ background: row.color }}>
                    {row.letter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{row.name}</div>
                    <div className="text-[10px] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{row.company}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-[5px]" style={{ color: row.sc, background: `${row.sc}15`, fontFamily: "var(--font-dm-mono)" }}>
                    {row.score}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-[4px] text-[var(--muted2)] hidden sm:inline" style={{ background: "var(--surface)", fontFamily: "var(--font-dm-sans)" }}>
                    {row.tag}
                  </span>
                </div>
              ))}

              {/* Bottom bar with interview CTA */}
              <div
                className="flex items-center justify-between pt-2 mt-1"
                style={{
                  borderTop: "1px solid var(--border)",
                  opacity: 0,
                  animation: reducedMotion ? "none" : "fadeInUp 0.5s ease 2.3s forwards",
                }}
              >
                <span className="text-[10px] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                  3 matches found in 4.2s
                </span>
                <span className="text-[10px] font-medium px-3 py-1 rounded-[6px] text-white" style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)" }}>
                  Start Interview →
                </span>
              </div>
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none" style={{ background: "linear-gradient(to top, var(--card), transparent)" }} />
          </div>

          {/* Reflection */}
          <div className="absolute -bottom-6 left-[10%] right-[10%] h-12 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(0,153,153,0.12) 0%, transparent 70%)", filter: "blur(15px)" }} />
        </div>

        {/* Stats Row */}
        <StatsRow reducedMotion={reducedMotion} />

        {/* Scroll indicator */}
        <div
          className="flex flex-col items-center gap-2 mt-10"
          style={{
            opacity: 0,
            animation: reducedMotion ? "none" : "fadeInUp 0.5s ease 2.5s forwards",
          }}
        >
          <a href="#fork" className="flex flex-col items-center gap-2 text-[var(--muted)] hover:text-[var(--teal)] transition-colors">
            <span className="text-[0.65rem] tracking-[0.15em] uppercase" style={{ fontFamily: "var(--font-dm-mono)" }}>
              See how it works
            </span>
            <div className="relative w-px h-8 overflow-hidden">
              <div
                className="absolute top-0 left-0 w-full"
                style={{
                  background: "linear-gradient(180deg, var(--teal), transparent)",
                  height: "50%",
                  animation: reducedMotion ? "none" : "scrollBounce 1.5s ease-in-out infinite",
                }}
              />
              <div className="absolute inset-0" style={{ background: "var(--border)" }} />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---- Stats Row Component ---- */

const STATS = [
  { end: 8000, suffix: "+", label: "Jobs Indexed" },
  { end: 3, suffix: "x", label: "Faster Matching" },
  { end: 80, suffix: "%", label: "Time Saved" },
];

function useCountUp(end: number, duration: number, trigger: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const startTime = performance.now();
    function tick() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * end);
      setValue(start);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [end, duration, trigger]);
  return value;
}

function StatItem({ stat, inView }: { stat: typeof STATS[number]; inView: boolean }) {
  const count = useCountUp(stat.end, 1500, inView);
  const display = `${stat.end >= 1000 ? count.toLocaleString() : count}${stat.suffix}`;
  return (
    <div className="flex flex-col items-center text-center px-4 sm:px-8">
      <span
        className="text-3xl sm:text-4xl text-[var(--text)] mb-1"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {display}
      </span>
      <span
        className="text-xs text-[var(--muted)] whitespace-pre-line leading-snug"
        style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
      >
        {stat.label}
      </span>
    </div>
  );
}

function StatsRow({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`mt-16 flex items-center justify-center anim-base anim-fade-up ${inView ? "in-view" : ""}`}
      style={{ margin: "4rem auto 0", animationDelay: "0.2s" }}
    >
      {STATS.map((stat, i) => (
        <div key={i} className="flex items-center">
          {i > 0 && (
            <div
              className="w-px mx-6 sm:mx-8"
              style={{ background: "var(--border2)", height: 36 }}
            />
          )}
          <StatItem stat={stat} inView={inView} />
        </div>
      ))}
    </div>
  );
}
