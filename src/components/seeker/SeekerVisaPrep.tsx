"use client";

import { useRef, useEffect, useState } from "react";
import { useInView, usePrefersReducedMotion } from "@/hooks/useInView";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const chatMessages = [
  { role: "vo", text: "Why did you choose this university specifically?" },
  {
    role: "user",
    text: "I was accepted to the MS in Computer Science program at\u2026",
  },
  {
    role: "vo",
    text: "How will you fund your education? Show me your financial documents.",
  },
];

export default function SeekerVisaPrep() {
  const numRef = useRef<HTMLSpanElement>(null);
  const { ref, inView } = useInView<HTMLElement>({ once: true, margin: "-50px" });
  const reducedMotion = usePrefersReducedMotion();
  const [counted, setCounted] = useState(false);

  useEffect(() => {
    if (!numRef.current || counted || reducedMotion) {
      if (numRef.current && reducedMotion) numRef.current.textContent = "74";
      return;
    }
    const trigger = ScrollTrigger.create({
      trigger: numRef.current,
      start: "top 85%",
      once: true,
      onEnter: () => {
        if (counted || !numRef.current) return;
        setCounted(true);
        const obj = { val: 0 };
        gsap.to(obj, {
          val: 74,
          duration: 2.5,
          ease: "power2.out",
          onUpdate: () => {
            if (numRef.current)
              numRef.current.textContent = String(Math.round(obj.val));
          },
        });
      },
    });
    return () => trigger.kill();
  }, [counted, reducedMotion]);

  return (
    <section className="relative z-10 py-8 px-6 overflow-hidden" ref={ref}>
      <div className="max-w-7xl mx-auto">
        {/* Full-viewport stat */}
        <div className="relative min-h-[70vh] flex flex-col items-center justify-center mb-16">
          {/* Giant background number */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            style={{
              animation: reducedMotion ? "none" : "bgNumReveal 1s ease forwards",
              opacity: reducedMotion ? 0.04 : undefined,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(20rem, 40vw, 40rem)",
                lineHeight: 0.8,
                color: "var(--teal)",
                opacity: 0.04,
              }}
            >
              74
            </span>
          </div>

          {/* Decorative rings around the stat */}
          {!reducedMotion && (
            <>
              <div
                className="absolute w-[300px] h-[300px] rounded-full border pointer-events-none"
                style={{
                  borderColor: "rgba(0,212,170,0.05)",
                  animation: "pulseRing 4s ease-in-out infinite",
                }}
              />
              <div
                className="absolute w-[500px] h-[500px] rounded-full border pointer-events-none"
                style={{
                  borderColor: "rgba(0,212,170,0.03)",
                  animation: "pulseRing 8s linear infinite",
                }}
              />
            </>
          )}

          {/* Foreground content */}
          <div
            className={`relative text-center anim-base anim-fade-up ${inView ? "in-view" : ""}`}
          >
            <div className="flex items-baseline justify-center gap-3 mb-6">
              <span
                ref={numRef}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(7rem, 18vw, 14rem)",
                  lineHeight: 0.85,
                  letterSpacing: "-0.05em",
                  color: "var(--teal)",
                  animation: !reducedMotion && counted ? "glowPulse 3s ease-in-out infinite" : "none",
                }}
              >
                {reducedMotion ? "74" : "0"}
              </span>
              <span
                className={`anim-base anim-fade-left stagger-5 ${inView ? "in-view" : ""}`}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(3rem, 8vw, 6rem)",
                  color: "var(--teal)",
                  opacity: 0.5,
                }}
              >
                %
              </span>
            </div>

            <h2
              className={`mb-4 anim-base anim-fade-up stagger-3 ${inView ? "in-view" : ""}`}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
                lineHeight: 1.2,
                color: "var(--text)",
              }}
            >
              of Indian students get rejected
              <br />
              at the F-1 interview.
            </h2>

            <p
              className={`text-[var(--muted2)] max-w-md mx-auto mb-2 anim-base anim-fade-up stagger-5 ${inView ? "in-view" : ""}`}
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontWeight: 300,
                lineHeight: 1.6,
                fontSize: "0.95rem",
              }}
            >
              You&apos;ve paid &#8377;65,000 in fees before you even walk into
              the consulate. One wrong answer and it&apos;s gone.
              <br />
              SViam drills you until your story is bulletproof.
            </p>
          </div>
        </div>

        {/* Chat UI mockup */}
        <div
          className={`max-w-xl mx-auto anim-base anim-fade-up stagger-3 ${inView ? "in-view" : ""}`}
        >
          <div
            className="rounded-[16px] overflow-hidden scanlines hover-glow"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow:
                "0 0 60px rgba(0,212,170,0.06), 0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between px-5 py-4 anim-base anim-fade-up stagger-4 ${inView ? "in-view" : ""}`}
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <span className="live-dot" />
                <span
                  className="text-sm font-medium text-[var(--text)]"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  F-1 Mock Interview
                </span>
              </div>
              <span
                className="text-[10px] text-[var(--muted)]"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                Chennai Consulate
              </span>
            </div>

            {/* Messages */}
            <div className="p-5 space-y-4">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} anim-base ${msg.role === "user" ? "anim-fade-right" : "anim-fade-left"} stagger-${i + 5} ${inView ? "in-view" : ""}`}
                >
                  <div
                    className="max-w-[85%] p-3 rounded-[10px] hover-lift"
                    style={{
                      background:
                        msg.role === "vo"
                          ? "var(--surface)"
                          : "rgba(0,153,153,0.12)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <span
                      className="text-[10px] font-medium block mb-1"
                      style={{
                        color:
                          msg.role === "vo"
                            ? "var(--orange)"
                            : "var(--accent2)",
                        fontFamily: "var(--font-dm-sans)",
                      }}
                    >
                      {msg.role === "vo" ? "Visa Officer (AI)" : "You"}
                    </span>
                    <p
                      className="text-sm text-[var(--text)] leading-relaxed"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              <div
                className={`flex justify-start anim-base anim-fade-up stagger-9 ${inView ? "in-view" : ""}`}
              >
                <div
                  className="px-4 py-3 rounded-[10px] flex items-center gap-1.5"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="w-1.5 h-1.5 rounded-full bg-[var(--muted)]"
                      style={{
                        animation: reducedMotion
                          ? "none"
                          : `dotBounce 0.8s ease infinite ${dot * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Source */}
          <p
            className={`mt-5 text-center text-[var(--muted)] anim-base anim-fade-up stagger-10 ${inView ? "in-view" : ""}`}
            style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.6rem" }}
          >
            GradPilot India Visa Data, Aug 2025 · SEVIS + MRV + Visa
            Integrity Fee, 2026
          </p>
        </div>
      </div>
    </section>
  );
}
