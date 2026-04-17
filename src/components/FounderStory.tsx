"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

export default function FounderStory() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative z-10 py-24 px-6" ref={ref}>
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
          className="p-8 sm:p-12 rounded-[24px] relative overflow-hidden"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Accent glow */}
          <div
            className="absolute top-0 left-0 w-60 h-60 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
            }}
          />

          {/* Quote mark */}
          <motion.span
            className="block mb-6 text-[var(--accent)]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "4rem",
              lineHeight: 0.8,
              fontWeight: 700,
              opacity: 0.15,
            }}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.5 }}
            animate={inView ? { opacity: 0.15, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            &ldquo;
          </motion.span>

          {/* Story */}
          <motion.blockquote
            className="relative"
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <p
              className="text-[var(--text)] mb-6"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "clamp(1rem, 2vw, 1.15rem)",
                lineHeight: 1.75,
                fontWeight: 300,
              }}
            >
              I sent 200+ applications. Got ghosted by most. Failed three F-1
              visa interviews back to back. Watched friends with better resumes
              get rejected because they froze for 30 seconds in front of a
              consulate officer.
            </p>
            <p
              className="text-[var(--text)] mb-6"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "clamp(1rem, 2vw, 1.15rem)",
                lineHeight: 1.75,
                fontWeight: 300,
              }}
            >
              On the other side, I saw companies burn months and lakhs on hiring
              pipelines that still ended with bad hires. Engineers wasting
              hundreds of hours interviewing people who couldn&apos;t write a for
              loop.
            </p>
            <p
              className="text-[var(--muted2)] mb-8"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "clamp(1rem, 2vw, 1.15rem)",
                lineHeight: 1.75,
                fontWeight: 400,
              }}
            >
              SViam exists because I decided the system doesn&apos;t need a
              patch. It needs a replacement. This is that replacement.
            </p>

            {/* Attribution */}
            <motion.div
              className="flex items-center gap-4"
              initial={reducedMotion ? false : { opacity: 0, x: -15 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent), var(--teal))",
                  fontFamily: "var(--font-display)",
                  fontSize: "0.9rem",
                }}
              >
                VK
              </div>
              <div>
                <p
                  className="text-sm font-medium text-[var(--text)]"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Vikas
                </p>
                <p
                  className="text-xs text-[var(--muted)]"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Founder, SViam
                </p>
              </div>
            </motion.div>
          </motion.blockquote>
        </motion.div>
      </div>
    </section>
  );
}
