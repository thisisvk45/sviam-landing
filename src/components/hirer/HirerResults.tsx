"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
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

const barVariants = {
  hidden: { opacity: 0, x: -15 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      delay: 0.3 + i * 0.1,
      ease: [0.33, 1, 0.68, 1] as const,
    },
  }),
};

export default function HirerResults() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reducedMotion = useReducedMotion();
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (animated || reducedMotion || !ref.current) return;
    const trigger = ScrollTrigger.create({
      trigger: ref.current,
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

  return (
    <section className="relative z-10 py-20 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12"
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
            WHAT YOU GET BACK
          </motion.span>
          <div className="overflow-hidden">
            <motion.h2
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
              Structured signal.
              <br />
              <span className="text-[var(--muted2)]">Not a gut feeling.</span>
            </motion.h2>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Report mockup — spans 3 cols */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 30, scale: 0.97 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.33, 1, 0.68, 1] }}
            className="lg:col-span-3 p-6 rounded-[16px] relative overflow-hidden"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
            whileHover={reducedMotion ? {} : { boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}
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
            <motion.div
              className="flex items-center gap-3 mb-8 relative"
              initial={reducedMotion ? false : { opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div
                className="w-11 h-11 rounded-[10px] flex items-center justify-center text-white font-bold text-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #6c63ff, #8b7fff)",
                }}
                whileHover={reducedMotion ? {} : { scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                PK
              </motion.div>
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
                <motion.span
                  className="text-2xl font-normal text-[var(--green)]"
                  style={{
                    fontFamily: "var(--font-display)",
                  }}
                  animate={
                    reducedMotion || !animated
                      ? {}
                      : { textShadow: ["0 0 10px rgba(6,214,160,0.3)", "0 0 25px rgba(6,214,160,0.5)", "0 0 10px rgba(6,214,160,0.3)"] }
                  }
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  92
                </motion.span>
                <span
                  className="text-xs text-[var(--muted)] block"
                  style={{ fontFamily: "var(--font-dm-mono)" }}
                >
                  /100
                </span>
              </div>
            </motion.div>

            {/* Topic bars */}
            <div className="space-y-5 relative">
              {reportTopics.map((topic, i) => (
                <motion.div
                  key={topic.name}
                  custom={i}
                  variants={reducedMotion ? undefined : barVariants}
                  initial="hidden"
                  animate={inView ? "visible" : "hidden"}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs text-[var(--muted2)]"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      {topic.name}
                    </span>
                    <motion.span
                      className="text-sm font-medium"
                      style={{
                        color: topic.color,
                        fontFamily: "var(--font-dm-mono)",
                      }}
                      initial={reducedMotion ? false : { opacity: 0 }}
                      animate={inView ? { opacity: 1 } : {}}
                      transition={{ delay: 0.5 + i * 0.15 }}
                    >
                      {topic.score}
                    </motion.span>
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
                </motion.div>
              ))}
            </div>

            {/* Verdict */}
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 15, scale: 0.95 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.8, type: "spring", stiffness: 200 }}
              className="mt-8 pt-5 flex items-center justify-between"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <span
                className="text-xs text-[var(--muted)]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                AI Recommendation
              </span>
              <motion.span
                className="text-sm font-medium px-3 py-1 rounded-[6px]"
                style={{
                  color: "var(--green)",
                  background: "rgba(6,214,160,0.1)",
                  fontFamily: "var(--font-dm-sans)",
                }}
                whileHover={reducedMotion ? {} : { scale: 1.1, boxShadow: "0 0 20px rgba(6,214,160,0.3)" }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                Strong Hire
              </motion.span>
            </motion.div>
          </motion.div>

          {/* Cost savings — spans 2 cols */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 30, scale: 0.97 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.33, 1, 0.68, 1] }}
            className="lg:col-span-2 flex flex-col gap-6"
          >
            {/* Comparison card */}
            <motion.div
              className="p-6 rounded-[16px] flex-1"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
              whileHover={reducedMotion ? {} : { y: -4, boxShadow: "0 15px 40px rgba(0,0,0,0.25)" }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "var(--muted)" }}
                      initial={{ width: 0 }}
                      animate={
                        inView ? { width: "100%" } : { width: 0 }
                      }
                      transition={{
                        duration: 1.5,
                        delay: 0.5,
                        ease: "easeOut",
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
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background:
                          "linear-gradient(90deg, var(--teal), var(--green))",
                        boxShadow: "0 0 12px rgba(0,212,170,0.3)",
                      }}
                      initial={{ width: 0 }}
                      animate={
                        inView ? { width: "21%" } : { width: 0 }
                      }
                      transition={{
                        duration: 1.2,
                        delay: 0.8,
                        ease: "easeOut",
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
            </motion.div>

            {/* Cost card */}
            <motion.div
              className="p-6 rounded-[16px]"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
              whileHover={reducedMotion ? {} : { y: -4, boxShadow: "0 15px 40px rgba(0,0,0,0.25)" }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
                <motion.span
                  className="line-through text-[var(--muted)]"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.4rem",
                  }}
                  initial={reducedMotion ? false : { opacity: 0, x: -10 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  &#8377;1.5L
                </motion.span>
                <motion.span
                  className="text-[var(--muted)]"
                  initial={reducedMotion ? false : { opacity: 0, scale: 0 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.3, delay: 0.6 }}
                >
                  &rarr;
                </motion.span>
                <motion.span
                  className="text-[var(--teal)]"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.8rem",
                  }}
                  initial={reducedMotion ? false : { opacity: 0, x: 10, scale: 0.8 }}
                  animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.8, type: "spring", stiffness: 200 }}
                >
                  &#8377;62K
                </motion.span>
              </div>
              <p
                className="text-[0.6rem] text-[var(--muted)] mt-2"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                SheWork + CutShort India, 2025
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
