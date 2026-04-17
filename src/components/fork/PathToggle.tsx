"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useFork, ForkPath } from "./ForkContext";

const options: { id: ForkPath; label: string }[] = [
  { id: "seeker", label: "For job seekers" },
  { id: "hirer", label: "For companies" },
];

export default function PathToggle() {
  const { path, setPath } = useFork();
  const reducedMotion = useReducedMotion();

  if (!path) return null;

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="sticky top-[64px] z-[90] flex justify-center py-4"
    >
      <motion.div
        className="inline-flex items-center rounded-full p-1"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          backdropFilter: "blur(20px)",
        }}
        whileHover={reducedMotion ? {} : { boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
        transition={{ duration: 0.3 }}
      >
        {options.map((opt) => (
          <motion.button
            key={opt.id}
            onClick={() => {
              if (opt.id && opt.id !== path) setPath(opt.id);
            }}
            className="relative px-5 py-2 rounded-full text-xs font-medium transition-colors duration-200"
            style={{
              fontFamily: "var(--font-dm-sans)",
              color:
                path === opt.id ? "white" : "var(--muted2)",
            }}
            whileHover={
              reducedMotion || path === opt.id
                ? {}
                : { scale: 1.05, color: "var(--text)" }
            }
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {path === opt.id && (
              <motion.div
                layoutId="toggle-active"
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    opt.id === "seeker"
                      ? "var(--accent)"
                      : "var(--teal)",
                  boxShadow:
                    opt.id === "seeker"
                      ? "0 0 20px rgba(108,99,255,0.4)"
                      : "0 0 20px rgba(0,212,170,0.4)",
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}
