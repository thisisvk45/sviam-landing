"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

const companies = [
  "Flipkart",
  "BCG",
  "McKinsey",
  "Aditya Birla",
  "Airtel",
  "Indamani",
];

export default function TrustedBy() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative z-10 py-12 px-6" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 text-[var(--muted)]"
          style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Trusted by talent from
        </motion.p>

        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {companies.map((company, i) => (
            <motion.span
              key={company}
              initial={reducedMotion ? false : { opacity: 0, y: 15 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: 0.1 + i * 0.08,
                ease: [0.33, 1, 0.68, 1] as const,
              }}
              whileHover={reducedMotion ? {} : { scale: 1.05, color: "var(--text)" }}
              className="text-[var(--muted)] cursor-default select-none"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1rem, 2vw, 1.3rem)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                opacity: 0.5,
                transition: "opacity 0.3s",
              }}
            >
              {company}
            </motion.span>
          ))}
        </div>

        {/* Subtle divider */}
        <motion.div
          className="mt-12 mx-auto h-px max-w-xs"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--border2), transparent)",
          }}
          initial={reducedMotion ? false : { scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
      </div>
    </section>
  );
}
