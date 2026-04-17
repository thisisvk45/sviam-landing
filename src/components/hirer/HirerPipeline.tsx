"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
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

const pointsVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const pointVariant = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.33, 1, 0.68, 1] as const },
  },
};

const candidateVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const candidateVariant = {
  hidden: { opacity: 0, y: 15, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.33, 1, 0.68, 1] as const },
  },
};

export default function HirerPipeline() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reducedMotion = useReducedMotion();
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <section className="relative z-10 py-20 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left — copy */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 25 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <motion.span
              className="text-xs tracking-[0.2em] text-[var(--muted)] mb-4 block"
              style={{
                fontFamily: "var(--font-dm-mono)",
                textTransform: "uppercase",
              }}
              initial={reducedMotion ? false : { opacity: 0, x: -15 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4 }}
            >
              YOUR PIPELINE
            </motion.span>
            <div className="overflow-hidden">
              <motion.h2
                className="mb-6"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
                  lineHeight: 1.08,
                  letterSpacing: "-0.025em",
                }}
                initial={reducedMotion ? false : { y: "100%", rotateX: -15 }}
                animate={inView ? { y: 0, rotateX: 0 } : {}}
                transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
              >
                Stop burning ₹1.5L per hire.
                <br />
                <span className="text-[var(--muted2)]">
                  Start seeing who&apos;s actually good.
                </span>
              </motion.h2>
            </div>
            <motion.p
              className="text-[var(--muted2)] mb-8 max-w-lg"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontWeight: 300,
                lineHeight: 1.6,
              }}
              initial={reducedMotion ? false : { opacity: 0, y: 15 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Your engineers are wasting 300+ hours a year on interviews that go
              nowhere. SViam pre-screens every candidate with an AI interview
              built to your exact spec. The only people who reach your
              calendar are worth the meeting.
            </motion.p>

            <motion.div
              className="space-y-4 mb-8"
              variants={reducedMotion ? undefined : pointsVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
            >
              {points.map((p) => (
                <motion.div
                  key={p.label}
                  variants={reducedMotion ? undefined : pointVariant}
                  whileHover={reducedMotion ? {} : { x: 6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
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
                </motion.div>
              ))}
            </motion.div>

            <motion.a
              href="#waitlist"
              className="inline-flex items-center gap-3"
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.6 }}
              whileHover={reducedMotion ? {} : { x: 4 }}
            >
              <span
                className="live-dot"
                style={{ background: "var(--accent)" }}
              />
              <span
                className="text-sm font-medium text-[var(--accent2)]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Join the Waitlist
              </span>
            </motion.a>
          </motion.div>

          {/* Right — dashboard */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: 40, rotateY: -5 }}
            animate={inView ? { opacity: 1, x: 0, rotateY: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.33, 1, 0.68, 1] }}
            style={{ perspective: "1200px" }}
          >
            <DashboardMockup url="sviam.in/company/pipeline">
              {/* Candidate rows */}
              <motion.div
                className="p-4 space-y-3"
                variants={reducedMotion ? undefined : candidateVariants}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
              >
                {candidates.map((c, i) => (
                  <motion.div
                    key={c.name}
                    variants={reducedMotion ? undefined : candidateVariant}
                    onMouseEnter={() => setHoveredRow(i)}
                    onMouseLeave={() => setHoveredRow(null)}
                    whileHover={reducedMotion ? {} : { x: 4, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center gap-3 p-3 rounded-[8px] relative overflow-hidden"
                    style={{
                      border: "1px solid var(--border)",
                      background: hoveredRow === i ? "rgba(255,255,255,0.02)" : "transparent",
                    }}
                  >
                    {/* Shine on hover */}
                    {hoveredRow === i && !reducedMotion && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)",
                        }}
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                      />
                    )}
                    <motion.div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs"
                      style={{ background: c.color }}
                      whileHover={reducedMotion ? {} : { scale: 1.1, rotate: 5 }}
                    >
                      {c.initials}
                    </motion.div>
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
                    <motion.span
                      className="text-[10px] font-medium px-2 py-1 rounded-[6px]"
                      style={{
                        color: c.statusColor,
                        background: `color-mix(in srgb, ${c.statusColor} 10%, transparent)`,
                        fontFamily: "var(--font-dm-sans)",
                      }}
                      animate={
                        reducedMotion || hoveredRow !== i
                          ? {}
                          : { scale: [1, 1.1, 1] }
                      }
                      transition={{ duration: 0.3 }}
                    >
                      {c.status}
                    </motion.span>
                  </motion.div>
                ))}
              </motion.div>

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
                      <motion.div
                        className="h-full rounded-[4px]"
                        style={{
                          background: "linear-gradient(90deg, var(--green), var(--teal))",
                          boxShadow: "0 0 10px rgba(6,214,160,0.3)",
                        }}
                        initial={{ width: 0 }}
                        animate={inView ? { width: "21%" } : { width: 0 }}
                        transition={{
                          duration: 1.2,
                          delay: 0.8,
                          ease: "easeOut",
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
                      <motion.div
                        className="h-full rounded-[4px]"
                        style={{ background: "var(--muted)" }}
                        initial={{ width: 0 }}
                        animate={inView ? { width: "100%" } : { width: 0 }}
                        transition={{
                          duration: 1.5,
                          delay: 1,
                          ease: "easeOut",
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}
