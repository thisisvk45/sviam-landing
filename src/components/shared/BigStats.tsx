"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  source: string;
  format?: "rupee" | "plain";
  accent?: string;
}

const stats: StatItem[] = [
  {
    value: 160,
    suffix: " hrs",
    label: "burned per job search — gone",
    source: "LinkedIn Hiring Posts, 2025",
    accent: "var(--accent)",
  },
  {
    value: 150000,
    suffix: "",
    label: "flushed per bad hire",
    source: "SheWork India, 2025",
    format: "rupee",
    accent: "var(--orange)",
  },
  {
    value: 74,
    suffix: "%",
    label: "crushed at the visa window",
    source: "GradPilot, Aug 2025",
    accent: "var(--teal)",
  },
  {
    value: 47,
    suffix: " days",
    label: "to fill one damn role",
    source: "Quantalent India, 2026",
    accent: "var(--gold)",
  },
];

function CountUpStat({ stat, delay }: { stat: StatItem; delay: number }) {
  const numRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const reducedMotion = useReducedMotion();

  const formatValue = (v: number) => {
    if (stat.format === "rupee")
      return "\u20B9" + v.toLocaleString("en-IN");
    return v.toString();
  };

  useEffect(() => {
    if (!containerRef.current || hasAnimated) return;
    if (reducedMotion) {
      setHasAnimated(true);
      if (numRef.current) numRef.current.textContent = formatValue(stat.value);
      return;
    }
    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top 85%",
      once: true,
      onEnter: () => {
        if (hasAnimated || !numRef.current) return;
        setHasAnimated(true);
        const obj = { val: 0 };
        gsap.to(obj, {
          val: stat.value,
          duration: 2.5,
          delay,
          ease: "power2.out",
          onUpdate: () => {
            if (numRef.current)
              numRef.current.textContent = formatValue(Math.round(obj.val));
          },
        });
      },
    });
    return () => trigger.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnimated, stat.value, reducedMotion]);

  return (
    <div ref={containerRef}>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
          color: "var(--text)",
          lineHeight: 1,
          letterSpacing: "-0.03em",
        }}
      >
        <span ref={numRef}>
          {reducedMotion ? formatValue(stat.value) : "0"}
        </span>
        <span>{stat.suffix}</span>
      </div>
    </div>
  );
}

const statVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      delay: 0.2 + i * 0.12,
      ease: [0.33, 1, 0.68, 1] as const,
    },
  }),
};

const lineVariants = {
  hidden: { scaleX: 0 },
  visible: (i: number) => ({
    scaleX: 1,
    transition: {
      duration: 0.6,
      delay: 0.15 + i * 0.12,
      ease: [0.33, 1, 0.68, 1] as const,
    },
  }),
};

export default function BigStats() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reducedMotion = useReducedMotion();

  return (
    <section
      className="relative z-10 py-28 px-6 overflow-hidden"
      ref={ref}
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Subtle gradient accent */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--accent), var(--teal), transparent)",
          opacity: 0.3,
          transformOrigin: "center",
        }}
        initial={reducedMotion ? false : { scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
      />

      <div className="max-w-6xl mx-auto">
        {/* Editorial headline */}
        <div className="overflow-hidden mb-20">
          <motion.h2
            initial={
              reducedMotion
                ? false
                : { y: "100%", rotateX: -20, filter: "blur(8px)" }
            }
            animate={
              inView ? { y: 0, rotateX: 0, filter: "blur(0px)" } : {}
            }
            transition={{
              duration: 0.8,
              ease: [0.33, 1, 0.68, 1],
            }}
            className="text-center"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              fontWeight: 600,
              color: "var(--muted2)",
              transformOrigin: "bottom",
            }}
          >
            Everyone knows the system is rigged. Here are the receipts.
          </motion.h2>
        </div>

        {/* Stats — horizontal on desktop, each staggered */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              variants={reducedMotion ? undefined : statVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              className="relative group"
              whileHover={reducedMotion ? {} : { y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Accent line top — animated grow */}
              <motion.div
                className="w-8 h-[2px] mb-5"
                style={{ background: stat.accent, transformOrigin: "left" }}
                custom={i}
                variants={reducedMotion ? undefined : lineVariants}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
              />
              <CountUpStat stat={stat} delay={i * 0.15} />
              <p
                className="text-sm text-[var(--muted2)] mt-2"
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontWeight: 300,
                }}
              >
                {stat.label}
              </p>
              <p
                className="text-[0.6rem] text-[var(--muted)] mt-1"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                {stat.source}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
