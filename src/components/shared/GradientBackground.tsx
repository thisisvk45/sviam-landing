"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function GradientBackground() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Primary orb — large, vivid indigo */}
      <motion.div
        className="absolute w-[1000px] h-[1000px] rounded-full"
        style={{
          top: "-25%",
          right: "-20%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.06) 40%, transparent 65%)",
          filter: "blur(60px)",
        }}
        animate={
          reducedMotion
            ? {}
            : {
                x: [0, 40, -20, 0],
                y: [0, -30, 20, 0],
                scale: [1, 1.1, 0.95, 1],
              }
        }
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Secondary orb — teal, bottom-left */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full"
        style={{
          bottom: "-15%",
          left: "-15%",
          background:
            "radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.04) 40%, transparent 65%)",
          filter: "blur(80px)",
        }}
        animate={
          reducedMotion
            ? {}
            : {
                x: [0, -30, 20, 0],
                y: [0, 25, -15, 0],
                scale: [1, 0.95, 1.1, 1],
              }
        }
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Center accent — purple, mid-page */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          top: "35%",
          left: "25%",
          background:
            "radial-gradient(circle, rgba(129,140,248,0.12) 0%, rgba(99,102,241,0.04) 40%, transparent 65%)",
          filter: "blur(100px)",
        }}
        animate={
          reducedMotion
            ? {}
            : {
                x: [0, 50, -30, 0],
                y: [0, -40, 30, 0],
              }
        }
        transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Hot spot — small, bright, moves faster */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{
          top: "20%",
          left: "50%",
          background:
            "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 50%)",
          filter: "blur(40px)",
        }}
        animate={
          reducedMotion
            ? {}
            : {
                x: [0, 100, -80, 0],
                y: [0, -60, 40, 0],
              }
        }
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Grid overlay — slightly more visible */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial vignette — pulls focus to center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 30%, var(--bg) 100%)",
        }}
      />
    </div>
  );
}
