"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

const headlineWords = [
  [
    { text: "Get", teal: false },
    { text: "hired", teal: false },
    { text: "faster.", teal: false },
  ],
  [
    { text: "Hire", teal: false },
    { text: "better.", teal: false },
  ],
  [
    { text: "Built", teal: false },
    { text: "for", teal: false },
    { text: "India.", teal: true },
  ],
];

const floatingParticles = [
  { size: 4, x: "15%", y: "20%", delay: 0, duration: 6, color: "var(--accent)" },
  { size: 3, x: "80%", y: "30%", delay: 1, duration: 8, color: "var(--teal)" },
  { size: 5, x: "70%", y: "70%", delay: 2, duration: 7, color: "var(--accent2)" },
  { size: 3, x: "25%", y: "75%", delay: 0.5, duration: 9, color: "var(--teal)" },
  { size: 4, x: "50%", y: "15%", delay: 1.5, duration: 6.5, color: "var(--accent)" },
  { size: 2, x: "90%", y: "55%", delay: 3, duration: 10, color: "var(--green)" },
];

export default function Hero() {
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  let wordIndex = 0;

  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
      {/* Floating particles */}
      {!reducedMotion &&
        floatingParticles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: p.size,
              height: p.size,
              left: p.x,
              top: p.y,
              background: p.color,
              opacity: 0.4,
              filter: "blur(1px)",
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, -10, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}

      {/* Radial glow behind headline — breathing */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(108,99,255,0.08) 0%, rgba(0,212,170,0.03) 40%, transparent 70%)",
          filter: "blur(40px)",
        }}
        animate={
          reducedMotion
            ? {}
            : { scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }
        }
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="max-w-5xl mx-auto text-center relative"
        style={{
          y: reducedMotion ? 0 : heroY,
          opacity: reducedMotion ? 1 : heroOpacity,
        }}
      >
        {/* Badge */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 200 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-10"
          style={{
            background: "rgba(0,212,170,0.08)",
            border: "1px solid rgba(0,212,170,0.2)",
            backdropFilter: "blur(10px)",
          }}
          whileHover={reducedMotion ? {} : { scale: 1.05, borderColor: "rgba(0,212,170,0.4)" }}
        >
          <span className="live-dot" />
          <span
            className="text-xs text-[var(--teal)]"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Launching in India — join the waitlist
          </span>
        </motion.div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3.5rem, 8vw, 6.5rem)",
            lineHeight: 1.0,
            letterSpacing: "-0.035em",
          }}
          className="mb-8"
        >
          {headlineWords.map((line, lineIdx) => (
            <span key={lineIdx} className="block overflow-hidden">
              {line.map((word) => {
                const delay = 0.15 + wordIndex * 0.08;
                wordIndex++;
                return (
                  <motion.span
                    key={word.text}
                    className="inline-block mr-[0.22em]"
                    initial={
                      reducedMotion
                        ? false
                        : { y: "110%", rotateX: -40, opacity: 0, filter: "blur(10px)" }
                    }
                    animate={{ y: 0, rotateX: 0, opacity: 1, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.8,
                      delay,
                      ease: [0.33, 1, 0.68, 1],
                    }}
                    style={{
                      display: "inline-block",
                      transformOrigin: "bottom",
                      ...(word.teal
                        ? { color: "var(--teal)", fontStyle: "italic" }
                        : {}),
                    }}
                  >
                    {word.text}
                  </motion.span>
                );
              })}
            </span>
          ))}
        </h1>

        {/* Sub — word-by-word fade in */}
        <motion.p
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-[1.1rem] text-[var(--muted2)] mb-14 max-w-lg mx-auto"
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontWeight: 300,
            lineHeight: 1.5,
          }}
        >
          {"AI-powered job matching, interviews, and F-1 visa prep — for candidates and companies across India."
            .split(" ")
            .map((word, i) => (
              <motion.span
                key={i}
                className="inline-block mr-[0.3em]"
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.9 + i * 0.03 }}
              >
                {word}
              </motion.span>
            ))}
        </motion.p>

        {/* Scroll indicator — animated line */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.5 }}
          className="flex flex-col items-center gap-3"
        >
          <motion.a
            href="#fork"
            className="group flex flex-col items-center gap-3 text-[var(--muted)] hover:text-[var(--accent)] transition-colors duration-300"
            whileHover={reducedMotion ? {} : { y: -3 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.span
              className="text-[0.7rem] tracking-[0.15em] uppercase"
              style={{ fontFamily: "var(--font-dm-mono)" }}
              animate={reducedMotion ? {} : { opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              Choose your path
            </motion.span>
            <div className="relative w-px h-12 overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 w-full"
                style={{
                  background:
                    "linear-gradient(180deg, var(--accent), transparent)",
                  height: "50%",
                }}
                animate={
                  reducedMotion ? {} : { y: ["-100%", "200%"] }
                }
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div
                className="absolute inset-0"
                style={{ background: "var(--border)" }}
              />
            </div>
          </motion.a>
        </motion.div>
      </motion.div>
    </section>
  );
}
