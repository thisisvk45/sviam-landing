"use client";

import { useRef, useEffect } from "react";
import { useInView, usePrefersReducedMotion } from "@/hooks/useInView";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const steps = [
  {
    num: "01",
    title: "Drop your resume",
    desc: "Drop it once. SViam reads your experience, builds your AI profile, and starts matching. No forms. No retyping your resume into 12 fields.",
  },
  {
    num: "02",
    title: "See real matches",
    desc: "Not job board spam. Ranked roles with fit scores you can trust. Tailor your resume, generate a cover letter, and apply with confidence.",
  },
  {
    num: "03",
    title: "Interview and land the offer",
    desc: "Practice with AI that fights back. Take the real interview. Get a score, get feedback, get the offer.",
  },
];

export default function SeekerHowItWorks() {
  const pathRef = useRef<SVGPathElement>(null);
  const { ref, inView } = useInView<HTMLElement>({ once: true, margin: "-100px" });
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined" || reducedMotion || !pathRef.current)
      return;

    const length = pathRef.current.getTotalLength();
    pathRef.current.style.strokeDasharray = `${length}`;
    pathRef.current.style.strokeDashoffset = `${length}`;

    const tween = gsap.to(pathRef.current, {
      strokeDashoffset: 0,
      duration: 1.2,
      ease: "power2.inOut",
      scrollTrigger: {
        trigger: ref.current,
        start: "top 70%",
        end: "bottom 50%",
        scrub: 1,
      },
    });

    return () => {
      tween.kill();
    };
  }, [reducedMotion, ref]);

  return (
    <section className="relative z-10 py-24 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div
          className={`text-center mb-16 anim-base anim-fade-up ${inView ? "in-view" : ""}`}
        >
          <div className="overflow-hidden">
            <h2
              className={`anim-base anim-reveal-up ${inView ? "in-view" : ""}`}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.025em",
              }}
            >
              Three steps. No busywork.
              <br />
              No 45-minute onboarding.
            </h2>
          </div>
        </div>

        <div className="relative">
          {/* SVG connecting line */}
          <svg
            className="absolute top-16 left-0 w-full h-4 hidden lg:block"
            viewBox="0 0 1200 20"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              ref={pathRef}
              d="M100 10 Q400 10 600 10 Q800 10 1100 10"
              stroke="var(--teal)"
              strokeWidth="2"
              strokeDasharray="8 6"
              fill="none"
              opacity="0.4"
            />
          </svg>

          <div className="grid md:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`text-center group hover-lift anim-base anim-fade-up stagger-${i * 2 + 1} ${inView ? "in-view" : ""}`}
              >
                <div
                  className="w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center relative hover-scale"
                  style={{
                    background: "var(--card)",
                    border: "2px solid var(--teal)",
                    boxShadow: "0 0 20px rgba(0,153,153,0.2)",
                  }}
                >
                  {/* Pulse ring behind circle */}
                  {!reducedMotion && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        border: "2px solid var(--teal)",
                        animation: `pulseRing 2.5s ease-out ${i * 0.5}s infinite`,
                      }}
                    />
                  )}
                  <span
                    className="gradient-text text-lg relative z-10"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {step.num}
                  </span>
                </div>
                <h3
                  className="text-lg text-[var(--text)] mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm text-[var(--muted)] leading-relaxed max-w-xs mx-auto"
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontWeight: 300,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
