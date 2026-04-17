"use client";

import { motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
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

// No standalone variants — inline animation used instead

export default function SeekerVisaPrep() {
  const ref = useRef(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const reducedMotion = useReducedMotion();
  const [counted, setCounted] = useState(false);

  // Scroll-driven opacity for the huge number
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });
  const numScale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const numOpacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);
  const numRotate = useTransform(scrollYProgress, [0, 0.5], [5, 0]);

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
        {/* Full-viewport stat — the emotional climax */}
        <div className="relative min-h-[70vh] flex flex-col items-center justify-center mb-16">
          {/* Giant background number */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            style={{
              scale: reducedMotion ? 1 : numScale,
              opacity: reducedMotion ? 0.04 : numOpacity,
              rotateX: reducedMotion ? 0 : numRotate,
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
          </motion.div>

          {/* Decorative rings around the stat */}
          {!reducedMotion && (
            <>
              <motion.div
                className="absolute w-[300px] h-[300px] rounded-full border pointer-events-none"
                style={{ borderColor: "rgba(0,212,170,0.05)" }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute w-[500px] h-[500px] rounded-full border pointer-events-none"
                style={{ borderColor: "rgba(0,212,170,0.03)" }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.05, 0.2], rotate: [0, 180, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
            </>
          )}

          {/* Foreground content */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 50, scale: 0.95 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
            className="relative text-center"
          >
            <div className="flex items-baseline justify-center gap-3 mb-6">
              <motion.span
                ref={numRef}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(7rem, 18vw, 14rem)",
                  lineHeight: 0.85,
                  letterSpacing: "-0.05em",
                  color: "var(--teal)",
                }}
                animate={
                  reducedMotion || !counted
                    ? {}
                    : { textShadow: ["0 0 30px rgba(0,212,170,0.3)", "0 0 60px rgba(0,212,170,0.5)", "0 0 30px rgba(0,212,170,0.3)"] }
                }
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                {reducedMotion ? "74" : "0"}
              </motion.span>
              <motion.span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(3rem, 8vw, 6rem)",
                  color: "var(--teal)",
                  opacity: 0.5,
                }}
                initial={reducedMotion ? false : { opacity: 0, x: -20 }}
                animate={inView ? { opacity: 0.5, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                %
              </motion.span>
            </div>

            <motion.h2
              className="mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
                lineHeight: 1.2,
                color: "var(--text)",
              }}
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              of Indian students get rejected
              <br />
              at the F-1 interview.
            </motion.h2>

            <motion.p
              className="text-[var(--muted2)] max-w-md mx-auto mb-2"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontWeight: 300,
                lineHeight: 1.6,
                fontSize: "0.95rem",
              }}
              initial={reducedMotion ? false : { opacity: 0, y: 15 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              You&apos;ve already paid &#8377;65,000 in fees before you walk
              in.
              <br />
              SViam lets you practice until your answers are airtight.
            </motion.p>
          </motion.div>
        </div>

        {/* Chat UI mockup — with scanline effect */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 40, scale: 0.95 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.33, 1, 0.68, 1] }}
          className="max-w-xl mx-auto"
        >
          <motion.div
            className="rounded-[16px] overflow-hidden scanlines"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow:
                "0 0 60px rgba(0,212,170,0.06), 0 20px 60px rgba(0,0,0,0.3)",
            }}
            whileHover={reducedMotion ? {} : { boxShadow: "0 0 80px rgba(0,212,170,0.1), 0 25px 70px rgba(0,0,0,0.4)" }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <motion.div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.4 }}
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
            </motion.div>

            {/* Messages */}
            <div className="p-5 space-y-4">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={reducedMotion ? false : {
                    opacity: 0,
                    x: msg.role === "user" ? 40 : -40,
                    scale: 0.9,
                    filter: "blur(4px)",
                  }}
                  animate={inView ? { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" } : {}}
                  transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.6 + i * 0.25 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <motion.div
                    className="max-w-[85%] p-3 rounded-[10px]"
                    style={{
                      background:
                        msg.role === "vo"
                          ? "var(--surface)"
                          : "rgba(108,99,255,0.12)",
                      border: "1px solid var(--border)",
                    }}
                    whileHover={reducedMotion ? {} : { scale: 1.02, y: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
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
                  </motion.div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 1.4, type: "spring" }}
                className="flex justify-start"
              >
                <div
                  className="px-4 py-3 rounded-[10px] flex items-center gap-1.5"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      className="w-1.5 h-1.5 rounded-full bg-[var(--muted)]"
                      animate={
                        reducedMotion
                          ? {}
                          : {
                              opacity: [0.3, 1, 0.3],
                              scale: [0.8, 1.2, 0.8],
                              y: [0, -3, 0],
                            }
                      }
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: dot * 0.15,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Source */}
          <motion.p
            className="mt-5 text-center text-[var(--muted)]"
            style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.6rem" }}
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 1.6 }}
          >
            GradPilot India Visa Data, Aug 2025 — SEVIS + MRV + Visa
            Integrity Fee, 2026
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
