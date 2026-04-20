"use client";

import { useRef, useEffect, useState } from "react";
import { useInView, usePrefersReducedMotion } from "@/hooks/useInView";
import gsap from "gsap";
import CodeEditor from "../shared/CodeEditor";
import DashboardMockup from "../shared/DashboardMockup";

const jobMatches = [
  {
    letter: "R",
    color: "#6c63ff",
    title: "Senior Software Engineer",
    company: "Razorpay",
    score: 94,
    scoreColor: "var(--green)",
  },
  {
    letter: "Z",
    color: "#00d4aa",
    title: "Full Stack Developer",
    company: "Zerodha",
    score: 87,
    scoreColor: "var(--gold)",
  },
  {
    letter: "F",
    color: "#ff6b35",
    title: "Backend Engineer",
    company: "Flipkart",
    score: 82,
    scoreColor: "var(--gold)",
  },
];

export default function SeekerMatchInterview() {
  const { ref, inView } = useInView<HTMLElement>({ once: true, margin: "-80px" });
  const reducedMotion = usePrefersReducedMotion();
  const scoreRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    if (reducedMotion || !inView) return;
    scoreRefs.current.forEach((el, i) => {
      if (!el) return;
      const target = jobMatches[i].score;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1.5,
        delay: 0.3 + i * 0.15,
        ease: "power2.out",
        onUpdate: () => {
          if (el) el.textContent = Math.round(obj.val) + "%";
        },
      });
    });
  }, [inView, reducedMotion]);

  return (
    <section className="relative z-10 py-20 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div
          className={`mb-14 anim-base anim-fade-up ${inView ? "in-view" : ""}`}
        >
          <span
            className={`text-xs tracking-[0.2em] text-[var(--muted)] mb-4 block anim-base anim-fade-left ${inView ? "in-view" : ""}`}
            style={{
              fontFamily: "var(--font-dm-mono)",
              textTransform: "uppercase",
            }}
          >
            STOP APPLYING BLIND
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
            }}
          >
            {"You deserve to know your odds before you apply.".split(" ").map((word, i) => (
              <span
                key={i}
                className={`inline-block mr-[0.2em] anim-base anim-reveal-up stagger-${Math.min(i + 1, 10)} ${inView ? "in-view" : ""}`}
                style={{ transformOrigin: "bottom" }}
              >
                {word}
              </span>
            ))}
            <br />
            <span className="text-[var(--muted2)]">
              {"SViam shows you.".split(" ").map((word, i) => (
                <span
                  key={i}
                  className={`inline-block mr-[0.2em] anim-base anim-reveal-up stagger-${Math.min(i + 4, 10)} ${inView ? "in-view" : ""}`}
                  style={{ transformOrigin: "bottom" }}
                >
                  {word}
                </span>
              ))}
            </span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Job matches */}
          <div
            className={`anim-base anim-fade-up stagger-2 ${inView ? "in-view" : ""}`}
          >
            <p
              className={`text-sm text-[var(--muted2)] mb-4 anim-base anim-fade-up stagger-3 ${inView ? "in-view" : ""}`}
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontWeight: 300,
              }}
            >
              Every role you see comes with a fit score. No more guessing,
              no more praying. You know exactly where you stand before applying.
            </p>
            <DashboardMockup url="sviam.in/dashboard">
              <div className="p-4 space-y-3">
                {jobMatches.map((job, i) => (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredCard(i)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className={`flex items-center gap-3 p-3 rounded-[8px] relative overflow-hidden hover-lift anim-base anim-fade-left stagger-${i + 3} ${inView ? "in-view" : ""}`}
                    style={{
                      border: "1px solid var(--border)",
                      background: hoveredCard === i ? "rgba(255,255,255,0.03)" : "transparent",
                      transition: "background 0.2s ease, transform 0.2s ease",
                    }}
                  >
                    {/* Shine effect on hover */}
                    {hoveredCard === i && !reducedMotion && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)",
                          animation: "shineSweep 0.8s ease-in-out forwards",
                        }}
                      />
                    )}
                    <div
                      className="w-10 h-10 rounded-[8px] flex items-center justify-center text-white font-bold text-sm hover-scale"
                      style={{ background: job.color }}
                    >
                      {job.letter}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-medium text-[var(--text)]"
                        style={{ fontFamily: "var(--font-dm-sans)" }}
                      >
                        {job.title}
                      </div>
                      <div
                        className="text-xs text-[var(--muted)]"
                        style={{ fontFamily: "var(--font-dm-sans)" }}
                      >
                        {job.company}
                      </div>
                    </div>
                    <span
                      ref={(el) => {
                        scoreRefs.current[i] = el;
                      }}
                      className="text-xs font-medium px-2 py-1 rounded-[8px]"
                      style={{
                        color: job.scoreColor,
                        background: `color-mix(in srgb, ${job.scoreColor} 12%, transparent)`,
                        fontFamily: "var(--font-dm-mono)",
                        transition: "transform 0.3s ease",
                        transform: hoveredCard === i && !reducedMotion ? "scale(1.15)" : "scale(1)",
                      }}
                    >
                      {reducedMotion ? `${job.score}%` : "0%"}
                    </span>
                  </div>
                ))}
              </div>
            </DashboardMockup>
          </div>

          {/* Interview demo */}
          <div
            className={`anim-base anim-fade-up stagger-4 ${inView ? "in-view" : ""}`}
            style={{ perspective: "1000px" }}
          >
            <p
              className={`text-sm text-[var(--muted2)] mb-4 anim-base anim-fade-up stagger-5 ${inView ? "in-view" : ""}`}
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontWeight: 300,
              }}
            >
              No more recording yourself and hoping for the best. Our AI
              interviews you live, asks follow-ups, and actually listens.
            </p>
            <CodeEditor interactive showCameraFeeds />
          </div>
        </div>
      </div>
    </section>
  );
}
