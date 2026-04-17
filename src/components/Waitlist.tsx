"use client";

import {
  motion,
  useInView,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import { useRef, useState, FormEvent } from "react";
import confetti from "canvas-confetti";

export default function Waitlist() {
  const ref = useRef(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reducedMotion = useReducedMotion();
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    if (btnRef.current && !reducedMotion) {
      const rect = btnRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      confetti({ particleCount: 150, spread: 80, origin: { x, y } });
      setTimeout(() => {
        confetti({ particleCount: 50, spread: 100, origin: { x: x - 0.1, y } });
        confetti({ particleCount: 50, spread: 100, origin: { x: x + 0.1, y } });
      }, 200);
    }
  };

  return (
    <section
      id="waitlist"
      className="relative z-10 py-32 px-6 overflow-hidden"
      ref={ref}
    >
      {/* Aurora background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(108,99,255,0.1), rgba(0,212,170,0.08), rgba(155,143,255,0.06), rgba(108,99,255,0.1))",
            borderRadius: "50%",
            filter: "blur(80px)",
            animation: reducedMotion ? "none" : "aurora 15s linear infinite",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px]"
          style={{
            background:
              "conic-gradient(from 180deg, rgba(0,212,170,0.08), rgba(108,99,255,0.1), rgba(0,212,170,0.06), rgba(0,212,170,0.08))",
            borderRadius: "50%",
            filter: "blur(60px)",
            animation: reducedMotion
              ? "none"
              : "aurora 12s linear infinite reverse",
          }}
        />
      </div>

      <div className="max-w-xl mx-auto text-center relative">
        {/* Headline — staggered line reveals */}
        <div className="overflow-hidden mb-2">
          <motion.h2
            initial={
              reducedMotion ? false : { y: "100%", rotateX: -30, filter: "blur(6px)" }
            }
            animate={
              inView ? { y: 0, rotateX: 0, filter: "blur(0px)" } : {}
            }
            transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              transformOrigin: "bottom",
            }}
          >
            SViam is in private beta.
          </motion.h2>
        </div>
        <div className="overflow-hidden mb-8">
          <motion.h2
            initial={
              reducedMotion ? false : { y: "100%", rotateX: -30, filter: "blur(6px)" }
            }
            animate={
              inView ? { y: 0, rotateX: 0, filter: "blur(0px)" } : {}
            }
            transition={{
              duration: 0.7,
              delay: 0.15,
              ease: [0.33, 1, 0.68, 1],
            }}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              transformOrigin: "bottom",
            }}
          >
            Get early access.
          </motion.h2>
        </div>

        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-[var(--muted2)] mb-10"
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontWeight: 300,
            lineHeight: 1.6,
          }}
        >
          We&apos;re onboarding candidates and companies in batches.
          <br />
          Drop your email — one message when your spot is ready.
        </motion.p>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20, scale: 0.95 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5, type: "spring", stiffness: 200 }}
        >
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="relative max-w-md mx-auto"
                exit={reducedMotion ? {} : { opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Glow ring when focused */}
                <motion.div
                  className="absolute -inset-1 rounded-[14px] pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--accent), var(--teal))",
                    opacity: 0,
                  }}
                  animate={{ opacity: focused ? 0.2 : 0, scale: focused ? 1.01 : 1 }}
                  transition={{ duration: 0.3 }}
                />
                <div
                  className="relative flex gap-2 p-1.5 rounded-[12px]"
                  style={{
                    background: "var(--card)",
                    border: `1px solid ${focused ? "var(--accent)" : "var(--border)"}`,
                    transition: "border-color 0.3s",
                  }}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="you@email.com"
                    required
                    className="flex-1 px-4 py-3 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  />
                  <motion.button
                    ref={btnRef}
                    type="submit"
                    className="px-6 py-3 rounded-[8px] text-sm font-medium text-white shrink-0 relative overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--accent), #8b7fff)",
                      boxShadow: "0 0 30px rgba(108,99,255,0.4)",
                      fontFamily: "var(--font-dm-sans)",
                    }}
                    whileHover={
                      reducedMotion
                        ? {}
                        : {
                            scale: 1.05,
                            boxShadow: "0 0 50px rgba(108,99,255,0.6)",
                          }
                    }
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {/* Shine sweep */}
                    <motion.span
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)",
                      }}
                      animate={reducedMotion ? {} : { x: ["-100%", "200%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
                    />
                    <span className="relative z-10">Get Access</span>
                  </motion.button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={reducedMotion ? false : { opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
                className="flex items-center justify-center gap-3 py-6"
              >
                <motion.div
                  className="w-10 h-10 rounded-full bg-[var(--green)] flex items-center justify-center"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    delay: 0.1,
                  }}
                >
                  <motion.svg
                    width="18"
                    height="18"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <motion.path
                      d="M3 8.5l3 3 7-7"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    />
                  </motion.svg>
                </motion.div>
                <motion.span
                  className="text-[var(--text)] font-medium"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                  initial={reducedMotion ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  You&apos;re on the list!
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.p
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-8 text-[var(--muted)]"
          style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.7rem" }}
        >
          No spam. One email when you&apos;re in.
        </motion.p>
      </div>
    </section>
  );
}
