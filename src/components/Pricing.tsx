"use client";

import Link from "next/link";
import { IconCheck, IconX, IconSparkles, IconBuildingBank, IconArrowRight } from "@tabler/icons-react";
import { useInView } from "@/hooks/useInView";

const tiers = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    desc: "Get started with AI job matching",
    cta: "Start Free",
    href: "/register",
    highlight: false,
    features: [
      { text: "3 resume tailors / month", ok: true },
      { text: "3 cover letters / month", ok: true },
      { text: "3 auto-applies / month", ok: true },
      { text: "AI job matching", ok: true },
      { text: "Priority matching", ok: false },
      { text: "Interview prep", ok: false },
    ],
  },
  {
    name: "Pro",
    price: "₹299",
    period: "/mo",
    desc: "For serious job seekers",
    cta: "Upgrade to Pro",
    href: "/register",
    highlight: true,
    features: [
      { text: "100 resume tailors / month", ok: true },
      { text: "100 cover letters / month", ok: true },
      { text: "100 auto-applies / month", ok: true },
      { text: "AI job matching", ok: true },
      { text: "Priority matching", ok: true },
      { text: "Interview prep access", ok: true },
    ],
  },
  {
    name: "Unlimited",
    price: "₹499",
    period: "/mo",
    desc: "Everything, no limits",
    cta: "Go Unlimited",
    href: "/register",
    highlight: false,
    features: [
      { text: "Unlimited everything", ok: true },
      { text: "AI cover letter customisation", ok: true },
      { text: "Priority support", ok: true },
      { text: "AI job matching", ok: true },
      { text: "Priority matching", ok: true },
      { text: "Interview prep access", ok: true },
    ],
  },
];

export default function Pricing() {
  const { ref, inView } = useInView();

  return (
    <section
      ref={ref}
      id="pricing"
      className="relative z-10 py-24 px-6 cv-auto"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className={`text-center mb-14 anim-base anim-fade-up ${inView ? "in-view" : ""}`}>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ background: "rgba(0,153,153,0.08)", border: "1px solid rgba(0,153,153,0.2)" }}
          >
            <span className="text-[0.65rem] font-medium text-[var(--teal)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
              Simple pricing
            </span>
          </div>
          <h2
            className="text-[var(--text)] mb-3"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            Start free. Upgrade when ready.
          </h2>
          <p
            className="text-sm text-[var(--muted)] max-w-md mx-auto"
            style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
          >
            No credit card required. No hidden fees. Cancel anytime.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {tiers.map((tier, idx) => (
            <div
              key={tier.name}
              className={`rounded-[16px] p-6 flex flex-col relative anim-base anim-fade-up ${inView ? "in-view" : ""}`}
              style={{
                background: "var(--card)",
                border: tier.highlight
                  ? "2px solid var(--teal)"
                  : "1px solid var(--border)",
                boxShadow: tier.highlight
                  ? "0 0 40px rgba(0,153,153,0.1)"
                  : undefined,
                animationDelay: `${0.1 + idx * 0.1}s`,
              }}
            >
              {tier.highlight && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider text-white flex items-center gap-1"
                  style={{ background: "var(--teal)" }}
                >
                  <IconSparkles size={10} /> Most Popular
                </span>
              )}
              <h3
                className="text-lg font-semibold text-[var(--text)] mb-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {tier.name}
              </h3>
              <p
                className="text-xs text-[var(--muted2)] mb-4"
                style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
              >
                {tier.desc}
              </p>
              <div className="mb-5">
                <span
                  className="text-3xl font-bold text-[var(--text)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {tier.price}
                </span>
                <span
                  className="text-sm text-[var(--muted)]"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {tier.period}
                </span>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {tier.features.map((f) => (
                  <li
                    key={f.text}
                    className="flex items-start gap-2 text-xs"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {f.ok ? (
                      <IconCheck size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#009999" }} />
                    ) : (
                      <IconX size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--muted)" }} />
                    )}
                    <span style={{ color: f.ok ? "var(--text)" : "var(--muted)" }}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className="w-full text-center py-2.5 rounded-[10px] text-sm font-semibold transition-all hover:brightness-110"
                style={{
                  background: tier.highlight ? "var(--teal)" : "var(--surface)",
                  color: tier.highlight ? "white" : "var(--text)",
                  border: tier.highlight ? "none" : "1px solid var(--border)",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* University partnership banner */}
        <div
          className={`rounded-[16px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 anim-base anim-fade-up ${inView ? "in-view" : ""}`}
          style={{
            background: "linear-gradient(135deg, rgba(0,153,153,0.06), rgba(0,153,153,0.02))",
            border: "1px solid rgba(0,153,153,0.15)",
            animationDelay: "0.4s",
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-11 h-11 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0,153,153,0.1)", color: "var(--teal)" }}
            >
              <IconBuildingBank size={22} />
            </div>
            <div>
              <h3
                className="text-sm font-semibold text-[var(--text)] mb-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                SViam Campus — University Partnership
              </h3>
              <p
                className="text-xs text-[var(--muted2)] max-w-lg"
                style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
              >
                License SViam for your entire student body. Every enrolled student gets Pro-level access.
                Custom placement cell dashboard, bulk onboarding, and institutional analytics included.
              </p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-xs font-medium text-white shrink-0 transition-all hover:brightness-110"
            style={{
              background: "var(--teal)",
              fontFamily: "var(--font-dm-sans)",
              boxShadow: "0 0 20px rgba(0,153,153,0.2)",
            }}
          >
            Learn more
            <IconArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
