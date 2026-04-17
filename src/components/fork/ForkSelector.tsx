"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useFork } from "./ForkContext";
import { useState, useRef, useCallback } from "react";

const paths = [
  {
    id: "seeker" as const,
    title: "Land the\nrole",
    sub: "AI matches you to jobs you'll actually get. Practice interviews that fight back. Visa prep that works. No more 200 applications into silence.",
    accent: "#6366f1",
    accentRgb: "99,102,241",
    cta: "Show me how",
    stats: "10x faster than job boards",
    icon: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 6l4 8 9 1.3-6.5 6.3L30 31 22 26.5 14 31l1.5-9.4L9 15.3l9-1.3z" />
        <circle cx="22" cy="22" r="18" opacity="0.2" />
      </svg>
    ),
  },
  {
    id: "hirer" as const,
    title: "Build the\nteam",
    sub: "Every candidate pre-screened by AI before they reach your calendar. Real scores, real signal, real time saved. Your engineers interview only the best.",
    accent: "#10b981",
    accentRgb: "16,185,129",
    cta: "See the pipeline",
    stats: "4x cheaper than Naukri",
    icon: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="16" r="6" />
        <circle cx="30" cy="16" r="6" />
        <path d="M6 36c0-6 4.5-10 10-10" />
        <path d="M38 36c0-6-4.5-10-10-10" />
        <path d="M22 26v10" opacity="0.4" />
        <path d="M17 31h10" opacity="0.4" />
      </svg>
    ),
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.33, 1, 0.68, 1] as const,
    },
  },
};

export default function ForkSelector() {
  const { setPath } = useFork();
  const reducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || reducedMotion) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [reducedMotion]
  );

  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 px-6 pb-24"
    >
      <div className="max-w-5xl mx-auto">
        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center text-[var(--muted)] mb-8"
          style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: "0.8rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Which side of the table?
        </motion.p>

        {/* Split-screen container */}
        <motion.div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          variants={reducedMotion ? undefined : containerVariants}
          initial="hidden"
          animate="visible"
          className="relative grid md:grid-cols-2 gap-0 rounded-[20px] overflow-hidden"
          style={{
            border: "1px solid var(--border)",
            minHeight: "380px",
          }}
        >
          {/* Center divider */}
          <div
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px z-10 hidden md:block"
            style={{
              background:
                "linear-gradient(180deg, transparent, var(--accent2) 30%, var(--teal) 70%, transparent)",
            }}
          >
            {/* Glowing dot on divider */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent), var(--teal))",
                boxShadow:
                  "0 0 20px rgba(108,99,255,0.5), 0 0 40px rgba(0,212,170,0.3)",
              }}
              animate={
                reducedMotion
                  ? {}
                  : { top: ["20%", "80%", "20%"] }
              }
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Pulse ring on divider dot */}
            {!reducedMotion && (
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full"
                style={{
                  border: "1px solid rgba(108,99,255,0.3)",
                }}
                animate={{ top: ["20%", "80%", "20%"], scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </div>

          {paths.map((p, idx) => {
            const isHovered = hovered === p.id;
            const otherHovered = hovered !== null && hovered !== p.id;

            return (
              <motion.button
                key={p.id}
                variants={reducedMotion ? undefined : cardVariants}
                onClick={() => setPath(p.id)}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                whileHover={reducedMotion ? {} : { scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="relative text-left p-10 md:p-12 flex flex-col justify-between overflow-hidden transition-all duration-500"
                style={{
                  background: "var(--card)",
                  opacity: otherHovered ? 0.5 : 1,
                  borderTop: idx === 1 ? "1px solid var(--border)" : "none",
                }}
                animate={{
                  flex: isHovered ? 1.15 : otherHovered ? 0.85 : 1,
                }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
              >
                {/* Mouse-following glow */}
                {isHovered && !reducedMotion && (
                  <motion.div
                    className="absolute pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      left: mousePos.x - 150,
                      top: mousePos.y - 150,
                      width: 300,
                      height: 300,
                      background: `radial-gradient(circle, rgba(${p.accentRgb},0.12) 0%, transparent 60%)`,
                      transition: "left 0.1s, top 0.1s",
                    }}
                  />
                )}

                {/* Content */}
                <div className="relative z-10">
                  <motion.div
                    className="mb-8"
                    style={{ color: p.accent }}
                    animate={
                      reducedMotion
                        ? {}
                        : {
                            scale: isHovered ? 1.15 : 1,
                            rotate: isHovered ? 5 : 0,
                          }
                    }
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {p.icon}
                  </motion.div>

                  <h3
                    className="text-[var(--text)] mb-3 whitespace-pre-line"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
                      lineHeight: 1.05,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {p.title}
                  </h3>

                  <motion.p
                    className="text-[var(--muted2)] mb-4"
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontWeight: 300,
                      fontSize: "0.95rem",
                      lineHeight: 1.5,
                    }}
                    animate={reducedMotion ? {} : { opacity: isHovered ? 1 : 0.7 }}
                    transition={{ duration: 0.3 }}
                  >
                    {p.sub}
                  </motion.p>

                  {/* Stats pill */}
                  <motion.span
                    className="inline-block text-[0.7rem] px-3 py-1.5 rounded-full"
                    style={{
                      background: `rgba(${p.accentRgb}, 0.08)`,
                      color: p.accent,
                      border: `1px solid rgba(${p.accentRgb}, 0.15)`,
                      fontFamily: "var(--font-dm-mono)",
                    }}
                    animate={reducedMotion ? {} : { scale: isHovered ? 1.05 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    {p.stats}
                  </motion.span>
                </div>

                {/* CTA Arrow */}
                <motion.div
                  className="relative z-10 mt-8 flex items-center gap-2"
                  style={{
                    color: p.accent,
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  }}
                  animate={
                    reducedMotion
                      ? {}
                      : { x: isHovered ? 8 : 0, gap: isHovered ? "12px" : "8px" }
                  }
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <span>{p.cta}</span>
                  <motion.svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    animate={reducedMotion ? {} : { x: isHovered ? 4 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <path
                      d="M3 8h10m0 0l-4-4m4 4l-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                </motion.div>

                {/* Bottom accent line */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ background: p.accent }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
                />

                {/* Top accent glow on hover */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-20 pointer-events-none"
                  style={{
                    background: `linear-gradient(180deg, rgba(${p.accentRgb},0.06) 0%, transparent 100%)`,
                  }}
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </motion.section>
  );
}
