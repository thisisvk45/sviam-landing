"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const steps = [
  {
    num: "01",
    title: "Drop your resume",
    desc: "Drop it once. SViam reads your experience, builds your AI profile, and starts matching. No forms. No retyping your resume into 12 fields.",
  },
  {
    num: "02",
    title: "See real matches",
    desc: "Not job board spam. Ranked roles with fit scores you can trust. One-click apply. Referral contacts surface automatically.",
  },
  {
    num: "03",
    title: "Interview and land the offer",
    desc: "Practice with AI that fights back. Take the real interview. Get a score, get feedback, get the offer. Visa prep is baked in.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2, delayChildren: 0.3 },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.33, 1, 0.68, 1] as const,
    },
  },
};

export default function SeekerHowItWorks() {
  const ref = useRef(null);
  const pathRef = useRef<SVGPathElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined" || reducedMotion || !pathRef.current)
      return;

    const length = pathRef.current.getTotalLength();
    pathRef.current.style.strokeDasharray = `${length}`;
    pathRef.current.style.strokeDashoffset = `${length}`;

    const tween = gsap.to(pathRef.current, {
      strokeDashoffset: 0,
      duration: 1.2,
      ease: "power2.inOut",
      scrollTrigger: {
        trigger: ref.current,
        start: "top 70%",
        end: "bottom 50%",
        scrub: 1,
      },
    });

    return () => {
      tween.kill();
    };
  }, [reducedMotion]);

  return (
    <section className="relative z-10 py-24 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="overflow-hidden">
            <motion.h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.025em",
              }}
              initial={reducedMotion ? false : { y: "100%", rotateX: -20 }}
              animate={inView ? { y: 0, rotateX: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
            >
              Three steps. No busywork.
              <br />
              No 45-minute onboarding.
            </motion.h2>
          </div>
        </motion.div>

        <div className="relative">
          {/* SVG connecting line */}
          <svg
            className="absolute top-16 left-0 w-full h-4 hidden lg:block"
            viewBox="0 0 1200 20"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              ref={pathRef}
              d="M100 10 Q400 10 600 10 Q800 10 1100 10"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeDasharray="8 6"
              fill="none"
              opacity="0.4"
            />
          </svg>

          <motion.div
            className="grid md:grid-cols-3 gap-10"
            variants={reducedMotion ? undefined : containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                variants={reducedMotion ? undefined : stepVariants}
                className="text-center group"
                whileHover={reducedMotion ? {} : { y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <motion.div
                  className="w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center relative"
                  style={{
                    background: "var(--card)",
                    border: "2px solid var(--accent)",
                    boxShadow: "0 0 20px rgba(108,99,255,0.2)",
                  }}
                  whileHover={
                    reducedMotion
                      ? {}
                      : {
                          scale: 1.15,
                          boxShadow: "0 0 40px rgba(108,99,255,0.4)",
                          rotate: 10,
                        }
                  }
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  {/* Pulse ring behind circle */}
                  {!reducedMotion && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: "2px solid var(--accent)" }}
                      animate={{
                        scale: [1, 1.6, 1],
                        opacity: [0.4, 0, 0.4],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: "easeOut",
                      }}
                    />
                  )}
                  <span
                    className="gradient-text text-lg relative z-10"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {step.num}
                  </span>
                </motion.div>
                <motion.h3
                  className="text-lg text-[var(--text)] mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                  whileHover={reducedMotion ? {} : { scale: 1.05 }}
                >
                  {step.title}
                </motion.h3>
                <p
                  className="text-sm text-[var(--muted)] leading-relaxed max-w-xs mx-auto"
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontWeight: 300,
                  }}
                >
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
