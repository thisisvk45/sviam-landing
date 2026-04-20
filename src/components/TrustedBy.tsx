"use client";

import { useInView } from "@/hooks/useInView";

const companies = [
  "Flipkart",
  "BCG",
  "McKinsey",
  "Aditya Birla",
  "Airtel",
  "INDmoney",
];

export default function TrustedBy() {
  const { ref, inView } = useInView<HTMLElement>({ margin: "-40px" });

  return (
    <section className="relative z-10 py-12 px-6" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <p
          className={`text-center mb-8 text-[var(--muted)] anim-base anim-fade-up ${inView ? "in-view" : ""}`}
          style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Trusted by talent from
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {companies.map((company, i) => (
            <span
              key={company}
              className={`text-[var(--muted)] cursor-default select-none hover-scale anim-base anim-fade-up ${inView ? "in-view" : ""}`}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1rem, 2vw, 1.3rem)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                opacity: inView ? 0.5 : 0,
                transition: "opacity 0.3s, transform 0.15s ease",
                animationDelay: `${0.1 + i * 0.08}s`,
              }}
            >
              {company}
            </span>
          ))}
        </div>

        {/* Subtle divider */}
        <div
          className={`mt-12 mx-auto h-px max-w-xs anim-base anim-scale-x ${inView ? "in-view" : ""}`}
          style={{
            background: "linear-gradient(90deg, transparent, var(--border2), transparent)",
            transformOrigin: "center",
            animationDelay: "0.5s",
          }}
        />
      </div>
    </section>
  );
}
