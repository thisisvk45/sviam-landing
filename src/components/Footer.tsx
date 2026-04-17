"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

const centerLinks = [
  "Jobs",
  "Interviews",
  "Pricing",
  "For Companies",
  "About",
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const linkVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] as const },
  },
};

export default function Footer() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const reducedMotion = useReducedMotion();

  return (
    <footer
      className="relative z-10 py-20 px-6"
      ref={ref}
      style={{ borderTop: "1px solid var(--border)" }}
    >
      {/* Gradient line at top */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 10%, var(--accent) 30%, var(--teal) 70%, transparent 90%)",
          opacity: 0.2,
          transformOrigin: "center",
        }}
        initial={reducedMotion ? false : { scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 1, ease: [0.33, 1, 0.68, 1] }}
      />

      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Left */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
          >
            <motion.span
              className="gradient-text block mb-3"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.8rem",
                fontWeight: 700,
                letterSpacing: "-0.03em",
              }}
              whileHover={reducedMotion ? {} : { scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              SViam
            </motion.span>
            <span
              className="text-xs text-[var(--muted)]"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              sviam.in
            </span>
          </motion.div>

          {/* Center */}
          <motion.div
            variants={reducedMotion ? undefined : containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="flex flex-wrap gap-x-6 gap-y-3 md:justify-center"
          >
            {centerLinks.map((link) => (
              <motion.a
                key={link}
                href={`#${link.toLowerCase().replace(/\s/g, "-")}`}
                className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors duration-200 relative"
                style={{ fontFamily: "var(--font-dm-sans)" }}
                variants={reducedMotion ? undefined : linkVariants}
                whileHover={reducedMotion ? {} : { y: -2, color: "var(--text)" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {link}
                {/* Underline on hover */}
                <motion.span
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: "var(--accent)", transformOrigin: "left" }}
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.a>
            ))}
          </motion.div>

          {/* Right */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.33, 1, 0.68, 1] }}
            className="md:text-right"
          >
            <p
              className="text-sm text-[var(--muted2)] leading-relaxed"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontWeight: 300,
              }}
            >
              Built by someone who got ghosted 200 times,
              <br />
              got rejected more times than he can count,
              <br />
              and decided the system needed to burn and rebuild.
            </p>
          </motion.div>
        </div>

        <motion.div
          className="pt-6"
          style={{ borderTop: "1px solid var(--border)" }}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p
            className="text-[0.7rem] text-[var(--muted)] text-center"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            &copy; 2026 SViam &middot; Privacy &middot; Terms &middot; Made
            with Claude Code
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
