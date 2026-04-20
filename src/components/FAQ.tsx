"use client";

import { useInView } from "@/hooks/useInView";
import { useState } from "react";

const faqs = [
  {
    q: "Is SViam free to use?",
    a: "Yes. Job matching, resume tailoring, cover letter generation, and AI interview practice are all free right now. We will introduce a Pro tier with higher usage limits in the future, but the core features will always have a free option.",
  },
  {
    q: "How does SViam match me to jobs?",
    a: "Upload your resume and our AI analyzes your skills, experience, and preferences. We compare you against hundreds of live job openings and give you a match score for each one, so you know your odds before you apply.",
  },
  {
    q: "Can SViam auto-apply for me?",
    a: "Not yet. Auto-apply is in active development. Today, SViam helps you find the right jobs faster, tailor your resume, generate cover letters, and practice interviews. One-click apply tracking is available so you can manage your pipeline.",
  },
  {
    q: "What about my data and privacy?",
    a: "Your data stays yours. We never sell it to third parties. Companies only see your profile and scores if you apply to their roles. You can delete your account and all data at any time from your profile settings.",
  },
  {
    q: "Does SViam work for non-tech roles?",
    a: "We are starting with software engineering and tech roles. Product, design, and data science are coming next. If your role is not supported yet, join the waitlist and we will notify you when it is.",
  },
  {
    q: "How is this different from Naukri or LinkedIn?",
    a: "Job boards show you everything and let you figure it out. SViam matches you to roles based on your actual skills, shows you exactly where you are strong or weak for each job, tailors your resume, and helps you prepare for interviews. Both sides save time.",
  },
];

export default function FAQ() {
  const { ref, inView } = useInView<HTMLElement>({ margin: "-80px" });
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="relative z-10 py-24 px-6" ref={ref}>
      <div className="max-w-2xl mx-auto">
        <div className={`text-center mb-14 anim-base anim-fade-up ${inView ? "in-view" : ""}`}>
          <span
            className="text-xs tracking-[0.2em] text-[var(--muted)] mb-4 block"
            style={{
              fontFamily: "var(--font-dm-mono)",
              textTransform: "uppercase",
            }}
          >
            FAQ
          </span>
          <div className="overflow-hidden">
            <h2
              className={`anim-base anim-reveal-up ${inView ? "in-view" : ""}`}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.025em",
                fontWeight: 700,
              }}
            >
              Questions you probably have.
            </h2>
          </div>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`rounded-[14px] overflow-hidden anim-base anim-fade-up ${inView ? "in-view" : ""}`}
                style={{
                  background: isOpen ? "var(--card)" : "transparent",
                  border: `1px solid ${isOpen ? "var(--border2)" : "var(--border)"}`,
                  transition: "background 0.3s, border-color 0.3s",
                  animationDelay: `${0.1 + i * 0.06}s`,
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
                  <span className={`text-[var(--muted)] shrink-0 faq-icon ${isOpen ? "open" : ""}`}>
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
                  </span>
                </button>

                <div className={`accordion-content ${isOpen ? "open" : ""}`}>
                  <div>
                    <p
                      className="px-5 pb-5 text-sm text-[var(--muted2)] leading-relaxed"
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontWeight: 300,
                      }}
                    >
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
