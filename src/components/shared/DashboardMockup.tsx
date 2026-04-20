"use client";

import { ReactNode, useRef, useState, useCallback } from "react";
import { usePrefersReducedMotion } from "@/hooks/useInView";

interface Props {
  url: string;
  children: ReactNode;
  glowColor?: string;
}

export default function DashboardMockup({
  url,
  children,
  glowColor = "108,99,255",
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!cardRef.current || reducedMotion) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setTilt({
        x: (y - 0.5) * -8,
        y: (x - 0.5) * 8,
      });
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [reducedMotion]
  );

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      className="rounded-[16px] overflow-hidden"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        boxShadow: isHovered
          ? `0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(${glowColor},0.08)`
          : "0 10px 40px rgba(0,0,0,0.2)",
        transition: "transform 0.15s ease-out, box-shadow 0.3s ease",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Mouse-following spotlight */}
      {isHovered && !reducedMotion && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: mousePos.x - 100,
            top: mousePos.y - 100,
            width: 200,
            height: 200,
            background: `radial-gradient(circle, rgba(${glowColor},0.06) 0%, transparent 60%)`,
            opacity: 1,
            transition: "opacity 0.2s ease",
          }}
        />
      )}

      {/* Chrome bar */}
      <div
        className="flex items-center gap-2 px-4 py-3 relative"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] transition-transform hover:scale-[1.4]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] transition-transform hover:scale-[1.4]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] transition-transform hover:scale-[1.4]" />
        <span
          className="ml-3 text-[10px] text-[var(--muted)]"
          style={{ fontFamily: "var(--font-dm-mono)" }}
        >
          {url}
        </span>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
