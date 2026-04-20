"use client";

import { useRef, useEffect, useState } from "react";
import { useInView, usePrefersReducedMotion } from "@/hooks/useInView";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const reportTopics = [
  { name: "Data Structures", score: 88, color: "#06d6a0" },
  { name: "System Design", score: 72, color: "#ffd166" },
  { name: "API Design", score: 91, color: "#06d6a0" },
  { name: "Communication", score: 85, color: "#06d6a0" },
];

export default function HirerResults() {
  const sectionRef = useRef<HTMLElement>(null);
  const { ref, inView } = useInView<HTMLElement>({ once: true, margin: "-80px" });
  const reducedMotion = usePrefersReducedMotion();
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [animated, setAnimated] = useState(false);

  // Merge refs: assign both ref and sectionRef to the section element
  const setRefs = (el: HTMLElement | null) => {
    sectionRef.current = el;
    // Manually assign the useInView ref
    (ref as React.MutableRefObject<HTMLElement | null>).current = el;
  };

  useEffect(() => {
    if (animated || reducedMotion || !sectionRef.current) return;
    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 80%",
      once: true,
      onEnter: () => {
        setAnimated(true);
        barRefs.current.forEach((el, i) => {
          if (!el) return;
          gsap.fromTo(
            el,
            { width: "0%" },
            {
              width: `${reportTopics[i].score}%`,
              duration: 1.2,
              delay: 0.3 + i * 0.15,
              ease: "power2.out",
            }
          );
        });
      },
    });
    return () => trigger.kill();
  }, [animated, reducedMotion]);

  const animBase = reducedMotion ? "" : "anim-base";
  const show = inView ? "in-view" : "";

  return (
    <section className="relative z-10 py-20 px-6" ref={setRefs}>
      <div className="max-w-7xl mx-auto">
        <div className={`mb-12 ${animBase} anim-fade-up ${show}`}>
          <span
            className={`text-xs tracking-[0.2em] text-[var(--muted)] mb-4 block ${animBase} anim-fade-left ${show}`}
            style={{
              fontFamily: "var(--font-dm-mono)",
              textTransform: "uppercase",
              transitionDelay: "0s",
            }}
          >
            KILL THE GUESSWORK
          </span>
          <div className="overflow-hidden">
            <h2
              className={`${animBase} anim-reveal-up ${show}`}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.025em",
                transitionDelay: "0.1s",
              }}
            >
              Every hire backed by data.
              <br />
              <span className="text-[var(--muted2)]">Not a 45-minute vibe check.</span>
            </h2>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Report mockup — spans 3 cols */}
          <div
            className={`lg:col-span-3 p-6 rounded-[16px] relative overflow-hidden hover-lift ${animBase} anim-fade-up ${show}`}
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              transitionDelay: "0.1s",
            }}
          >
            {/* Subtle gradient accent */}
            <div
              className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(6,214,160,0.06) 0%, transparent 70%)",
              }}
            />

            {/* Candidate header */}
            <div
              className={`flex items-center gap-3 mb-8 relative ${animBase} anim-fade-left ${show}`}
              style={{ transitionDelay: "0.2s" }}
            >
              <div
                className="w-11 h-11 rounded-[10px] flex items-center justify-center text-white font-bold text-sm transition-transform hover:scale-110 hover:rotate-[5deg]"
                style={{
                  background:
                    "linear-gradient(135deg, #6c63ff, #8b7fff)",
                }}
              >
                PK
              </div>
              <div>
                <div
                  className="text-sm font-medium text-[var(--text)]"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Priya Krishnan
                </div>
                <div
                  className="text-xs text-[var(--muted)]"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Senior Frontend Engineer
                </div>
              </div>
              <div className="ml-auto text-right">
                <span
                  className="text-2xl font-normal text-[var(--green)]"
                  style={{
                    fontFamily: "var(--font-display)",
                    animation: animated && !reducedMotion ? "glow-pulse 2s infinite" : "none",
                  }}
                >
                  92
                </span>
                <span
                  className="text-xs text-[var(--muted)] block"
                  style={{ fontFamily: "var(--font-dm-mono)" }}
                >
                  /100
                </span>
              </div>
            </div>

            {/* Topic bars */}
            <div className="space-y-5 relative">
              {reportTopics.map((topic, i) => (
                <div
                  key={topic.name}
                  className={`${animBase} anim-fade-left ${show}`}
                  style={{ transitionDelay: `${0.3 + i * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs text-[var(--muted2)]"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      {topic.name}
                    </span>
                    <span
                      className={`text-sm font-medium ${animBase} anim-fade-up ${show}`}
                      style={{
                        color: topic.color,
                        fontFamily: "var(--font-dm-mono)",
                        transitionDelay: `${0.5 + i * 0.15}s`,
                      }}
                    >
                      {topic.score}
                    </span>
                  </div>
                  <div
                    className="h-2.5 rounded-full overflow-hidden"
                    style={{ background: "var(--surface)" }}
                  >
                    <div
                      ref={(el) => {
                        barRefs.current[i] = el;
                      }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${topic.color}, ${topic.color}88)`,
                        width: reducedMotion ? `${topic.score}%` : "0%",
                        boxShadow: `0 0 10px ${topic.color}40`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Verdict */}
            <div
              className={`mt-8 pt-5 flex items-center justify-between ${animBase} anim-fade-up ${show}`}
              style={{
                borderTop: "1px solid var(--border)",
                transitionDelay: "0.8s",
              }}
            >
              <span
                className="text-xs text-[var(--muted)]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                AI Recommendation
              </span>
              <span
                className="text-sm font-medium px-3 py-1 rounded-[6px] transition-all duration-200 hover:scale-110"
                style={{
                  color: "var(--green)",
                  background: "rgba(6,214,160,0.1)",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                Strong Hire
              </span>
            </div>
          </div>

          {/* Cost savings — spans 2 cols */}
          <div
            className={`lg:col-span-2 flex flex-col gap-6 ${animBase} anim-fade-up ${show}`}
            style={{ transitionDelay: "0.25s" }}
          >
            {/* Comparison card */}
            <div
              className="p-6 rounded-[16px] flex-1 hover-lift transition-shadow duration-300"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <span
                className="text-[0.65rem] text-[var(--muted)] block mb-6 tracking-[0.15em]"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  textTransform: "uppercase",
                }}
              >
                Time to hire
              </span>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span
                      className="text-xs text-[var(--muted2)]"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      Industry avg
                    </span>
                    <span
                      className="text-xs text-[var(--muted)]"
                      style={{ fontFamily: "var(--font-dm-mono)" }}
                    >
                      47 days
                    </span>
                  </div>
                  <div
                    className="h-3 rounded-full overflow-hidden"
                    style={{ background: "var(--surface)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: "var(--muted)",
                        width: inView ? "100%" : "0%",
                        transition: "width 1.5s ease-out 0.5s",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1.5">
                    <span
                      className="text-xs text-[var(--text)]"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      With SViam
                    </span>
                    <span
                      className="text-xs text-[var(--teal)] font-medium"
                      style={{ fontFamily: "var(--font-dm-mono)" }}
                    >
                      ~10 days
                    </span>
                  </div>
                  <div
                    className="h-3 rounded-full overflow-hidden"
                    style={{ background: "var(--surface)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        background:
                          "linear-gradient(90deg, var(--teal), var(--green))",
                        boxShadow: "0 0 12px rgba(0,212,170,0.3)",
                        width: inView ? "21%" : "0%",
                        transition: "width 1.2s ease-out 0.8s",
                      }}
                    />
                  </div>
                </div>
              </div>

              <p
                className="text-[0.6rem] text-[var(--muted)] mt-4"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                Quantalent India, 2026
              </p>
            </div>

            {/* Cost card */}
            <div
              className="p-6 rounded-[16px] hover-lift transition-shadow duration-300"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <span
                className="text-[0.65rem] text-[var(--muted)] block mb-3 tracking-[0.15em]"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  textTransform: "uppercase",
                }}
              >
                Cost per hire
              </span>
              <div className="flex items-baseline gap-3">
                <span
                  className={`line-through text-[var(--muted)] ${animBase} anim-fade-left ${show}`}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.4rem",
                    transitionDelay: "0.4s",
                  }}
                >
                  &#8377;1.5L
                </span>
                <span
                  className={`text-[var(--muted)] ${animBase} anim-fade-up ${show}`}
                  style={{ transitionDelay: "0.6s" }}
                >
                  &rarr;
                </span>
                <span
                  className={`text-[var(--teal)] ${animBase} anim-fade-up ${show}`}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.8rem",
                    transitionDelay: "0.8s",
                  }}
                >
                  &#8377;62K
                </span>
              </div>
              <p
                className="text-[0.6rem] text-[var(--muted)] mt-2"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                SheWork + CutShort India, 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
