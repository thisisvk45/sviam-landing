"use client";

import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";

const faqs = [
  {
    q: "Is SViam free to use?",
    a: "For candidates, yes. Job matching, AI interview practice, and visa prep are completely free. Companies pay per successful hire, and it costs a fraction of what traditional recruiters charge.",
  },
  {
    q: "How does the AI interview work?",
    a: "You join a live session where our AI asks you real technical and behavioral questions, follows up based on your answers, and scores you on multiple dimensions. It is not a chatbot. It listens, challenges, and evaluates like a real interviewer.",
  },
  {
    q: "What about my data and privacy?",
    a: "Your data stays yours. We never sell it to third parties. Companies only see your profile and scores if you apply to their roles. You can delete your account and all data at any time.",
  },
  {
    q: "When will I get access?",
    a: "We are onboarding in waves. Join the waitlist and we will email you exactly once when your spot opens. No spam, no newsletters, just your access notification.",
  },
  {
    q: "Does SViam work for non-tech roles?",
    a: "We are starting with software engineering and tech roles. Product, design, and data science are coming next. If your role is not supported yet, join the waitlist and we will notify you when it is.",
  },
  {
    q: "How is this different from Naukri or LinkedIn?",
    a: "Naukri and LinkedIn are job boards. You apply and hope. SViam matches you to roles based on your actual skill level, pre-screens you through AI interviews, and gives companies real signal instead of a resume pile. Both sides save time.",
  },
];

export default function FAQ() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="relative z-10 py-24 px-6" ref={ref}>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <motion.span
            className="text-xs tracking-[0.2em] text-[var(--muted)] mb-4 block"
            style={{
              fontFamily: "var(--font-dm-mono)",
              textTransform: "uppercase",
            }}
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4 }}
          >
            FAQ
          </motion.span>
          <div className="overflow-hidden">
            <motion.h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.025em",
                fontWeight: 700,
              }}
              initial={reducedMotion ? false : { y: "100%", rotateX: -15 }}
              animate={inView ? { y: 0, rotateX: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
            >
              Questions you probably have.
            </motion.h2>
          </div>
        </motion.div>

        <div className="space-y-2">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={reducedMotion ? false : { opacity: 0, y: 15 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.4,
                  delay: 0.1 + i * 0.06,
                  ease: [0.33, 1, 0.68, 1] as const,
                }}
                className="rounded-[14px] overflow-hidden"
                style={{
                  background: isOpen ? "var(--card)" : "transparent",
                  border: `1px solid ${isOpen ? "var(--border2)" : "var(--border)"}`,
                  transition: "background 0.3s, border-color 0.3s",
                }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span
                    className="text-sm font-medium text-[var(--text)] pr-4"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {faq.q}
                  </span>
                  <motion.span
                    className="text-[var(--muted)] shrink-0"
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M9 4v10M4 9h10" />
                    </svg>
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
                      className="overflow-hidden"
                    >
                      <p
                        className="px-5 pb-5 text-sm text-[var(--muted2)] leading-relaxed"
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontWeight: 300,
                        }}
                      >
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
