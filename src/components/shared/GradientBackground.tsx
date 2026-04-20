"use client";

import { usePrefersReducedMotion } from "@/hooks/useInView";

export default function GradientBackground() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div
        className="absolute w-[1000px] h-[1000px] rounded-full"
        style={{
          top: "-25%",
          right: "-20%",
          background: "radial-gradient(circle, rgba(0,153,153,0.14) 0%, rgba(0,153,153,0.04) 40%, transparent 65%)",
          filter: "blur(60px)",
          animation: reducedMotion ? "none" : "orbFloat1 25s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <div
        className="absolute w-[800px] h-[800px] rounded-full"
        style={{
          bottom: "-15%",
          left: "-15%",
          background: "radial-gradient(circle, rgba(0,153,153,0.12) 0%, rgba(0,153,153,0.03) 40%, transparent 65%)",
          filter: "blur(80px)",
          animation: reducedMotion ? "none" : "orbFloat2 30s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          top: "35%",
          left: "25%",
          background: "radial-gradient(circle, rgba(0,153,153,0.08) 0%, rgba(0,120,120,0.03) 40%, transparent 65%)",
          filter: "blur(100px)",
          animation: reducedMotion ? "none" : "orbFloat3 35s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <div
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{
          top: "20%",
          left: "50%",
          background: "radial-gradient(circle, rgba(0,153,153,0.1) 0%, transparent 50%)",
          filter: "blur(40px)",
          animation: reducedMotion ? "none" : "orbFloat4 20s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 30%, var(--bg) 100%)",
        }}
      />
    </div>
  );
}
