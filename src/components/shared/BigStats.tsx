"use client";

import { useInView, usePrefersReducedMotion } from "@/hooks/useInView";
import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  source: string;
  format?: "rupee" | "plain";
  accent?: string;
}

const stats: StatItem[] = [
  {
    value: 160,
    suffix: " hrs",
    label: "burned per job search. Gone.",
    source: "LinkedIn Hiring Posts, 2025",
    accent: "var(--teal)",
  },
  {
    value: 150000,
    suffix: "",
    label: "flushed per bad hire",
    source: "SheWork India, 2025",
    format: "rupee",
    accent: "var(--orange)",
  },
  {
    value: 85,
    suffix: "%",
    label: "of resumes never seen by a human",
    source: "Harvard Business School, 2025",
    accent: "var(--teal)",
  },
  {
    value: 47,
    suffix: " days",
    label: "to fill one damn role",
    source: "Quantalent India, 2026",
    accent: "var(--gold)",
  },
];

function CountUpStat({ stat, delay }: { stat: StatItem; delay: number }) {
  const numRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const formatValue = (v: number) => {
    if (stat.format === "rupee")
      return "\u20B9" + v.toLocaleString("en-IN");
    return v.toString();
  };

  useEffect(() => {
    if (!containerRef.current || hasAnimated) return;
    if (reducedMotion) {
      setHasAnimated(true);
      if (numRef.current) numRef.current.textContent = formatValue(stat.value);
      return;
    }
    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top 85%",
      once: true,
      onEnter: () => {
        if (hasAnimated || !numRef.current) return;
        setHasAnimated(true);
        const obj = { val: 0 };
        gsap.to(obj, {
          val: stat.value,
          duration: 2.5,
          delay,
          ease: "power2.out",
          onUpdate: () => {
            if (numRef.current)
              numRef.current.textContent = formatValue(Math.round(obj.val));
          },
        });
      },
    });
    return () => trigger.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnimated, stat.value, reducedMotion]);

  return (
    <div ref={containerRef}>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
          color: "var(--text)",
          lineHeight: 1,
          letterSpacing: "-0.03em",
        }}
      >
        <span ref={numRef}>
          {reducedMotion ? formatValue(stat.value) : "0"}
        </span>
        <span>{stat.suffix}</span>
      </div>
    </div>
  );
}

export default function BigStats() {
  const { ref, inView } = useInView<HTMLElement>({ margin: "-80px" });

  return (
    <section
      className="relative z-10 py-28 px-6 overflow-hidden cv-auto"
      ref={ref}
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Subtle gradient accent */}
      <div
        className={`absolute top-0 left-0 right-0 h-px anim-base anim-scale-x ${inView ? "in-view" : ""}`}
        style={{
          background: "linear-gradient(90deg, transparent, var(--teal), var(--teal), transparent)",
          opacity: 0.3,
          transformOrigin: "center",
          animationDuration: "1.2s",
        }}
      />

      <div className="max-w-6xl mx-auto">
        {/* Editorial headline */}
        <div className="overflow-hidden mb-20">
          <h2
            className={`text-center anim-base anim-reveal-up ${inView ? "in-view" : ""}`}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              fontWeight: 600,
              color: "var(--muted2)",
              transformOrigin: "bottom",
              animationDuration: "0.8s",
            }}
          >
            Everyone knows the system is rigged. Here are the receipts.
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`relative group hover-lift anim-base anim-fade-up ${inView ? "in-view" : ""}`}
              style={{ animationDelay: `${0.2 + i * 0.12}s` }}
            >
              {/* Accent line top */}
              <div
                className={`w-8 h-[2px] mb-5 anim-base anim-scale-x ${inView ? "in-view" : ""}`}
                style={{
                  background: stat.accent,
                  transformOrigin: "left",
                  animationDelay: `${0.15 + i * 0.12}s`,
                }}
              />
              <CountUpStat stat={stat} delay={i * 0.15} />
              <p
                className="text-sm text-[var(--muted2)] mt-2"
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontWeight: 300,
                }}
              >
                {stat.label}
              </p>
              <p
                className="text-[0.6rem] text-[var(--muted)] mt-1"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                {stat.source}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
