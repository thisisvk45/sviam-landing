"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
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

const headlineVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.33, 1, 0.68, 1] as const,
      staggerChildren: 0.05,
    },
  },
};

const cardContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.33, 1, 0.68, 1] as const,
    },
  },
};

export default function SeekerMatchInterview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reducedMotion = useReducedMotion();
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
        <motion.div
          variants={reducedMotion ? undefined : headlineVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="mb-14"
        >
          <motion.span
            className="text-xs tracking-[0.2em] text-[var(--muted)] mb-4 block"
            style={{
              fontFamily: "var(--font-dm-mono)",
              textTransform: "uppercase",
            }}
            initial={reducedMotion ? false : { opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            STOP APPLYING BLIND
          </motion.span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
            }}
          >
            {"You deserve to know your odds before you apply.".split(" ").map((word, i) => (
              <motion.span
                key={i}
                className="inline-block mr-[0.2em]"
                initial={reducedMotion ? false : { opacity: 0, y: 20, rotateX: -20 }}
                animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                style={{ transformOrigin: "bottom" }}
              >
                {word}
              </motion.span>
            ))}
            <br />
            <span className="text-[var(--muted2)]">
              {"SViam shows you.".split(" ").map((word, i) => (
                <motion.span
                  key={i}
                  className="inline-block mr-[0.2em]"
                  initial={reducedMotion ? false : { opacity: 0, y: 20, rotateX: -20 }}
                  animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                  style={{ transformOrigin: "bottom" }}
                >
                  {word}
                </motion.span>
              ))}
            </span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Job matches */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <motion.p
              className="text-sm text-[var(--muted2)] mb-4"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontWeight: 300,
              }}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Every role you see comes with a fit score. No more guessing,
              no more praying — you know exactly where you stand before applying.
            </motion.p>
            <DashboardMockup url="sviam.in/dashboard">
              <motion.div
                className="p-4 space-y-3"
                variants={reducedMotion ? undefined : cardContainerVariants}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
              >
                {jobMatches.map((job, i) => (
                  <motion.div
                    key={i}
                    variants={reducedMotion ? undefined : cardVariants}
                    onMouseEnter={() => setHoveredCard(i)}
                    onMouseLeave={() => setHoveredCard(null)}
                    whileHover={reducedMotion ? {} : { x: 6, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center gap-3 p-3 rounded-[8px] transition-colors duration-200 relative overflow-hidden"
                    style={{
                      border: "1px solid var(--border)",
                      background: hoveredCard === i ? "rgba(255,255,255,0.03)" : "transparent",
                    }}
                  >
                    {/* Shine effect on hover */}
                    {hoveredCard === i && !reducedMotion && (
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
                      className="w-10 h-10 rounded-[8px] flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: job.color }}
                      whileHover={reducedMotion ? {} : { rotate: 5, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      {job.letter}
                    </motion.div>
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
                    <motion.span
                      ref={(el) => {
                        scoreRefs.current[i] = el;
                      }}
                      className="text-xs font-medium px-2 py-1 rounded-[8px]"
                      style={{
                        color: job.scoreColor,
                        background: `color-mix(in srgb, ${job.scoreColor} 12%, transparent)`,
                        fontFamily: "var(--font-dm-mono)",
                      }}
                      animate={
                        reducedMotion || hoveredCard !== i
                          ? {}
                          : { scale: [1, 1.15, 1] }
                      }
                      transition={{ duration: 0.4 }}
                    >
                      {reducedMotion ? `${job.score}%` : "0%"}
                    </motion.span>
                  </motion.div>
                ))}
              </motion.div>
            </DashboardMockup>
          </motion.div>

          {/* Interview demo */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 30, rotateY: 5 }}
            animate={inView ? { opacity: 1, y: 0, rotateY: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.33, 1, 0.68, 1] }}
            style={{ perspective: "1000px" }}
          >
            <motion.p
              className="text-sm text-[var(--muted2)] mb-4"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontWeight: 300,
              }}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              No more recording yourself and hoping for the best. Our AI
              interviews you live, asks follow-ups, and actually listens.
            </motion.p>
            <CodeEditor interactive showCameraFeeds />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
