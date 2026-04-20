"use client";

import { useFork } from "./ForkContext";
import { useState, useRef, useCallback } from "react";
import { usePrefersReducedMotion } from "@/hooks/useInView";

const paths = [
  {
    id: "seeker" as const,
    title: "Land the\nrole",
    sub: "AI matches you to jobs you'll actually get. Practice interviews that fight back. No more 200 applications into silence.",
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
    accent: "#009999",
    accentRgb: "0,153,153",
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

export default function ForkSelector() {
  const { setPath } = useFork();
  const reducedMotion = usePrefersReducedMotion();
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
    <section
      className="relative z-10 px-6 pb-24"
      style={{ animation: reducedMotion ? "none" : "fadeInScale 0.5s ease forwards" }}
    >
      <div className="max-w-5xl mx-auto">
        <p
          className="text-center text-[var(--muted)] mb-8"
          style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: "0.8rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            animation: reducedMotion ? "none" : "fadeInUp 0.5s ease 0.1s both",
          }}
        >
          Which side of the table?
        </p>

        {/* Split-screen container */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
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
            <div
              className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, var(--teal), var(--teal))",
                boxShadow:
                  "0 0 20px rgba(0,153,153,0.5), 0 0 40px rgba(0,212,170,0.3)",
                animation: reducedMotion ? "none" : "dividerDotFloat 4s ease-in-out infinite",
              }}
            />
            {/* Pulse ring on divider dot */}
            {!reducedMotion && (
              <div
                className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full"
                style={{
                  border: "1px solid rgba(0,153,153,0.3)",
                  animation: "dividerDotFloat 4s ease-in-out infinite, pulseRing 4s ease-in-out infinite",
                }}
              />
            )}
          </div>

          {paths.map((p, idx) => {
            const isHovered = hovered === p.id;
            const otherHovered = hovered !== null && hovered !== p.id;

            return (
              <button
                key={p.id}
                onClick={() => setPath(p.id)}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                className="relative text-left p-10 md:p-12 flex flex-col justify-between overflow-hidden"
                style={{
                  background: "var(--card)",
                  opacity: otherHovered ? 0.5 : 1,
                  borderTop: idx === 1 ? "1px solid var(--border)" : "none",
                  transition: "opacity 0.4s ease, flex 0.4s cubic-bezier(0.25,1,0.5,1), transform 0.2s ease",
                  flex: isHovered ? 1.15 : otherHovered ? 0.85 : 1,
                  transform: isHovered && !reducedMotion ? "scale(1.01)" : "scale(1)",
                  animation: reducedMotion ? "none" : `fadeInUp 0.6s cubic-bezier(0.33,1,0.68,1) ${0.2 + idx * 0.15}s both`,
                }}
              >
                {/* Mouse-following glow */}
                {isHovered && !reducedMotion && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: mousePos.x - 150,
                      top: mousePos.y - 150,
                      width: 300,
                      height: 300,
                      background: `radial-gradient(circle, rgba(${p.accentRgb},0.12) 0%, transparent 60%)`,
                      transition: "left 0.1s, top 0.1s",
                      opacity: 1,
                    }}
                  />
                )}

                {/* Content */}
                <div className="relative z-10">
                  <div
                    className="mb-8"
                    style={{
                      color: p.accent,
                      transition: "transform 0.3s ease",
                      transform: isHovered && !reducedMotion ? "scale(1.15) rotate(5deg)" : "scale(1) rotate(0deg)",
                    }}
                  >
                    {p.icon}
                  </div>

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

                  <p
                    className="text-[var(--muted2)] mb-4"
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontWeight: 300,
                      fontSize: "0.95rem",
                      lineHeight: 1.5,
                      opacity: isHovered ? 1 : 0.7,
                      transition: "opacity 0.3s ease",
                    }}
                  >
                    {p.sub}
                  </p>

                  {/* Stats pill */}
                  <span
                    className="inline-block text-[0.7rem] px-3 py-1.5 rounded-full"
                    style={{
                      background: `rgba(${p.accentRgb}, 0.08)`,
                      color: p.accent,
                      border: `1px solid rgba(${p.accentRgb}, 0.15)`,
                      fontFamily: "var(--font-dm-mono)",
                      transition: "transform 0.2s ease",
                      transform: isHovered && !reducedMotion ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    {p.stats}
                  </span>
                </div>

                {/* CTA Arrow */}
                <div
                  className="relative z-10 mt-8 flex items-center"
                  style={{
                    color: p.accent,
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    gap: isHovered ? "12px" : "8px",
                    transform: isHovered && !reducedMotion ? "translateX(8px)" : "translateX(0)",
                    transition: "transform 0.3s ease, gap 0.3s ease",
                  }}
                >
                  <span>{p.cta}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{
                      transform: isHovered && !reducedMotion ? "translateX(4px)" : "translateX(0)",
                      transition: "transform 0.3s ease",
                    }}
                  >
                    <path
                      d="M3 8h10m0 0l-4-4m4 4l-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{
                    background: p.accent,
                    transform: isHovered ? "scaleX(1)" : "scaleX(0)",
                    transformOrigin: "left",
                    transition: "transform 0.4s cubic-bezier(0.33,1,0.68,1)",
                  }}
                />

                {/* Top accent glow on hover */}
                <div
                  className="absolute top-0 left-0 right-0 h-20 pointer-events-none"
                  style={{
                    background: `linear-gradient(180deg, rgba(${p.accentRgb},0.06) 0%, transparent 100%)`,
                    opacity: isHovered ? 1 : 0,
                    transition: "opacity 0.3s ease",
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
