"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useFork } from "./ForkContext";
import { useState, useRef, useCallback } from "react";

const paths = [
  {
    id: "seeker" as const,
    title: "I need\na job",
    sub: "Stop applying into the void. Get matched, interviewed, and hired. Faster than Naukri ever could.",
    accent: "#6c63ff",
    accentRgb: "108,99,255",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="18" r="12" />
        <path d="M35 35l-8-8" />
        <path d="M18 12v12" opacity="0.4" />
        <path d="M12 18h12" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: "hirer" as const,
    title: "I need\ntalent",
    sub: "Stop wasting 300 engineering hours on bad interviews. Get pre-screened candidates with real signal.",
    accent: "#00d4aa",
    accentRgb: "0,212,170",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="8" width="32" height="24" rx="4" />
        <path d="M4 16h32" />
        <circle cx="14" cy="24" r="3" />
        <circle cx="26" cy="24" r="3" />
        <path d="M17 24h6" strokeDasharray="2 2" />
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
          Choose your side
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
                    className="text-[var(--muted2)]"
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontWeight: 300,
                      fontSize: "0.95rem",
                    }}
                    animate={reducedMotion ? {} : { opacity: isHovered ? 1 : 0.7 }}
                    transition={{ duration: 0.3 }}
                  >
                    {p.sub}
                  </motion.p>
                </div>

                {/* Arrow */}
                <motion.div
                  className="relative z-10 mt-8 flex items-center gap-2"
                  style={{
                    color: p.accent,
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: "0.75rem",
                  }}
                  animate={
                    reducedMotion
                      ? {}
                      : { x: isHovered ? 8 : 0, gap: isHovered ? "12px" : "8px" }
                  }
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <span>Enter</span>
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
