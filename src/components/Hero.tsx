"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useFork } from "./fork/ForkContext";

// Beam network nodes — candidates on left, companies on right, SViam in center
const nodes = [
  // Left — candidates
  { x: 60, y: 70, color: "#6c63ff", size: 5 },
  { x: 40, y: 140, color: "#9b8fff", size: 4 },
  { x: 70, y: 210, color: "#6c63ff", size: 6 },
  { x: 35, y: 275, color: "#9b8fff", size: 3 },
  { x: 80, y: 320, color: "#6c63ff", size: 4 },
  // Center — SViam
  { x: 300, y: 190, color: "#00d4aa", size: 14 },
  // Right — companies
  { x: 530, y: 70, color: "#00d4aa", size: 5 },
  { x: 550, y: 140, color: "#06d6a0", size: 4 },
  { x: 520, y: 210, color: "#00d4aa", size: 6 },
  { x: 555, y: 275, color: "#06d6a0", size: 3 },
  { x: 525, y: 320, color: "#00d4aa", size: 4 },
];

const beams = [
  { from: 0, to: 5 }, { from: 1, to: 5 }, { from: 2, to: 5 },
  { from: 3, to: 5 }, { from: 4, to: 5 },
  { from: 5, to: 6 }, { from: 5, to: 7 }, { from: 5, to: 8 },
  { from: 5, to: 9 }, { from: 5, to: 10 },
];

export default function Hero() {
  const reducedMotion = useReducedMotion();
  const { setPath } = useFork();
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
      {/* Beam network */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.svg
          viewBox="0 0 600 380"
          className="w-full max-w-3xl"
          style={{ filter: "blur(0.5px)" }}
          initial={reducedMotion ? { opacity: 0.2 } : { opacity: 0 }}
          animate={{ opacity: 0.25 }}
          transition={{ duration: 2, delay: 1.2 }}
        >
          {beams.map((beam, i) => {
            const from = nodes[beam.from];
            const to = nodes[beam.to];
            const isLeft = beam.from < 5;
            return (
              <g key={i}>
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={isLeft ? "#6c63ff" : "#00d4aa"}
                  strokeWidth="1" strokeOpacity="0.2"
                />
                {!reducedMotion && (
                  <motion.circle
                    r="2.5"
                    fill={isLeft ? "#9b8fff" : "#00f5c4"}
                    filter="url(#glow)"
                    initial={{ cx: from.x, cy: from.y, opacity: 0 }}
                    animate={{
                      cx: [from.x, to.x],
                      cy: [from.y, to.y],
                      opacity: [0, 0.9, 0.9, 0],
                    }}
                    transition={{
                      duration: 1.8,
                      delay: 1.5 + i * 0.35,
                      repeat: Infinity,
                      repeatDelay: 2.5 + Math.random() * 2,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </g>
            );
          })}
          {nodes.map((node, i) => (
            <g key={`n-${i}`}>
              {i === 5 && !reducedMotion && (
                <motion.circle
                  cx={node.x} cy={node.y} r={node.size + 10}
                  fill="none" stroke="#00d4aa" strokeWidth="1"
                  animate={{ r: [node.size + 10, node.size + 25, node.size + 10], strokeOpacity: [0.3, 0.05, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <motion.circle
                cx={node.x} cy={node.y} r={node.size}
                fill={node.color} fillOpacity={i === 5 ? 0.9 : 0.4}
                initial={reducedMotion ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.3 + i * 0.08, type: "spring", stiffness: 200, damping: 15 }}
              />
            </g>
          ))}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
        </motion.svg>
      </div>

      <motion.div
        className="max-w-5xl mx-auto text-center relative"
        style={{ y: reducedMotion ? 0 : heroY, opacity: reducedMotion ? 1 : heroOpacity }}
      >
        {/* Badge */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 200 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
          style={{
            background: "rgba(0,212,170,0.08)",
            border: "1px solid rgba(0,212,170,0.2)",
            backdropFilter: "blur(10px)",
          }}
          whileHover={reducedMotion ? {} : { scale: 1.05 }}
        >
          <span className="live-dot" />
          <span className="text-xs text-[var(--teal)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
            Early access — 200+ on the waitlist
          </span>
        </motion.div>

        {/* Headline — aspirational, premium */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3rem, 7.5vw, 5.5rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            fontWeight: 700,
          }}
          className="mb-6"
        >
          <span className="block overflow-hidden">
            <motion.span
              className="inline-block"
              initial={reducedMotion ? false : { y: "110%", rotateX: -40, opacity: 0 }}
              animate={{ y: 0, rotateX: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.33, 1, 0.68, 1] }}
              style={{ transformOrigin: "bottom" }}
            >
              Talent is everywhere.
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span
              className="inline-block gradient-text"
              initial={reducedMotion ? false : { y: "110%", rotateX: -40, opacity: 0 }}
              animate={{ y: 0, rotateX: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.35, ease: [0.33, 1, 0.68, 1] }}
              style={{ transformOrigin: "bottom" }}
            >
              Opportunity shouldn&apos;t be.
            </motion.span>
          </span>
        </h1>

        {/* Sub — explains the product */}
        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-[1.1rem] text-[var(--muted2)] mb-4 max-w-2xl mx-auto"
          style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300, lineHeight: 1.6 }}
        >
          SViam connects India&apos;s best candidates to the companies that need
          them — with AI interviews that test real skill, job matching that
          actually works, and F-1 visa prep that gets you through the window.
        </motion.p>

        {/* Proof line */}
        <motion.p
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="text-xs text-[var(--muted)] mb-10"
          style={{ fontFamily: "var(--font-dm-mono)" }}
        >
          AI interviews &middot; Job matching &middot; F-1 visa prep &middot; Hiring pipeline
        </motion.p>

        {/* Dual CTA */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
        >
          <motion.button
            onClick={() => {
              setPath("seeker");
              document.getElementById("fork")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group relative px-8 py-4 rounded-[14px] text-white font-medium overflow-hidden min-w-[220px]"
            style={{
              background: "linear-gradient(135deg, var(--accent), #8b7fff)",
              boxShadow: "0 0 40px rgba(108,99,255,0.3), 0 4px 20px rgba(0,0,0,0.3)",
              fontFamily: "var(--font-dm-sans)", fontSize: "0.95rem",
            }}
            whileHover={reducedMotion ? {} : {
              scale: 1.05,
              boxShadow: "0 0 60px rgba(108,99,255,0.5), 0 8px 30px rgba(0,0,0,0.4)",
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {!reducedMotion && (
              <motion.span
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)" }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              Find me a job
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </motion.button>

          <motion.button
            onClick={() => {
              setPath("hirer");
              document.getElementById("fork")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group relative px-8 py-4 rounded-[14px] font-medium overflow-hidden min-w-[220px]"
            style={{
              background: "rgba(0,212,170,0.06)",
              border: "1px solid rgba(0,212,170,0.25)",
              color: "var(--teal)",
              fontFamily: "var(--font-dm-sans)", fontSize: "0.95rem",
              backdropFilter: "blur(10px)",
            }}
            whileHover={reducedMotion ? {} : {
              scale: 1.05,
              borderColor: "rgba(0,212,170,0.5)",
              boxShadow: "0 0 40px rgba(0,212,170,0.15)",
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              I need to hire
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </motion.button>
        </motion.div>

        {/* Floating dashboard preview */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 50, rotateX: 15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, delay: 1.4, ease: [0.33, 1, 0.68, 1] }}
          className="relative mx-auto max-w-2xl"
          style={{ perspective: "1200px" }}
        >
          <motion.div
            className="rounded-[16px] overflow-hidden relative"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "0 25px 80px rgba(0,0,0,0.4), 0 0 60px rgba(108,99,255,0.08)",
            }}
            whileHover={reducedMotion ? {} : { y: -5, boxShadow: "0 30px 90px rgba(0,0,0,0.5), 0 0 80px rgba(108,99,255,0.12)" }}
            transition={{ duration: 0.3 }}
          >
            {/* Chrome bar */}
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
              <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
              <span className="w-2 h-2 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-[9px] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                sviam.in/dashboard
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="live-dot" style={{ width: 5, height: 5 }} />
                <span className="text-[8px] text-[var(--green)]" style={{ fontFamily: "var(--font-dm-mono)" }}>LIVE</span>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-4 space-y-2.5">
              {[
                { letter: "R", name: "Senior SWE", company: "Razorpay", score: "94%", color: "#6c63ff", sc: "#06d6a0", tag: "Strong match" },
                { letter: "Z", name: "Full Stack Dev", company: "Zerodha", score: "87%", color: "#00d4aa", sc: "#ffd166", tag: "Good fit" },
                { letter: "F", name: "Backend Engineer", company: "Flipkart", score: "82%", color: "#ff6b35", sc: "#ffd166", tag: "Potential" },
              ].map((row, i) => (
                <motion.div
                  key={row.letter}
                  className="flex items-center gap-3 p-2.5 rounded-[10px] transition-colors duration-200 hover:bg-[rgba(255,255,255,0.02)]"
                  style={{ border: "1px solid var(--border)" }}
                  initial={reducedMotion ? false : { opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.8 + i * 0.15, duration: 0.5 }}
                >
                  <div className="w-9 h-9 rounded-[8px] flex items-center justify-center text-white text-xs font-bold" style={{ background: row.color }}>
                    {row.letter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{row.name}</div>
                    <div className="text-[10px] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{row.company}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-[5px]" style={{ color: row.sc, background: `${row.sc}15`, fontFamily: "var(--font-dm-mono)" }}>
                    {row.score}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-[4px] text-[var(--muted2)] hidden sm:inline" style={{ background: "var(--surface)", fontFamily: "var(--font-dm-sans)" }}>
                    {row.tag}
                  </span>
                </motion.div>
              ))}

              {/* Bottom bar with interview CTA */}
              <motion.div
                className="flex items-center justify-between pt-2 mt-1"
                style={{ borderTop: "1px solid var(--border)" }}
                initial={reducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.3 }}
              >
                <span className="text-[10px] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                  3 matches found in 4.2s
                </span>
                <span className="text-[10px] font-medium px-3 py-1 rounded-[6px] text-white" style={{ background: "var(--accent)", fontFamily: "var(--font-dm-sans)" }}>
                  Start Interview →
                </span>
              </motion.div>
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none" style={{ background: "linear-gradient(to top, var(--card), transparent)" }} />
          </motion.div>

          {/* Reflection */}
          <div className="absolute -bottom-6 left-[10%] right-[10%] h-12 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(108,99,255,0.15) 0%, transparent 70%)", filter: "blur(15px)" }} />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.5 }}
          className="flex flex-col items-center gap-2 mt-10"
        >
          <a href="#fork" className="flex flex-col items-center gap-2 text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
            <span className="text-[0.65rem] tracking-[0.15em] uppercase" style={{ fontFamily: "var(--font-dm-mono)" }}>
              See how it works
            </span>
            <div className="relative w-px h-8 overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 w-full"
                style={{ background: "linear-gradient(180deg, var(--accent), transparent)", height: "50%" }}
                animate={reducedMotion ? {} : { y: ["-100%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="absolute inset-0" style={{ background: "var(--border)" }} />
            </div>
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
