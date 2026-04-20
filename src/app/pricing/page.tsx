import Link from "next/link";
import type { Metadata } from "next";
import {
  IconCheck,
  IconX,
  IconSparkles,
  IconBuildingBank,
  IconSchool,
  IconUsers,
  IconMail,
  IconArrowRight,
} from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Pricing | SViam",
  description:
    "SViam pricing plans. Free job matching, resume tailoring, and interview prep. Upgrade to Pro or Unlimited for more access.",
};

const tiers = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Get started with AI-powered job matching",
    cta: "Start Free",
    ctaHref: "/register",
    highlight: false,
    features: [
      { text: "3 resume tailors / month", included: true },
      { text: "3 cover letters / month", included: true },
      { text: "3 auto-applies / month", included: true },
      { text: "AI job matching", included: true },
      { text: "Application pipeline tracker", included: true },
      { text: "AI interview practice", included: true },
      { text: "Priority matching", included: false },
      { text: "Interview prep access", included: false },
      { text: "AI cover letter customisation", included: false },
    ],
  },
  {
    name: "Pro",
    price: "₹299",
    period: "/month",
    description: "For serious job seekers who want an edge",
    cta: "Upgrade to Pro",
    ctaHref: "/register",
    highlight: true,
    badge: "Most Popular",
    features: [
      { text: "100 resume tailors / month", included: true },
      { text: "100 cover letters / month", included: true },
      { text: "100 auto-applies / month", included: true },
      { text: "AI job matching", included: true },
      { text: "Application pipeline tracker", included: true },
      { text: "AI interview practice", included: true },
      { text: "Priority matching", included: true },
      { text: "Interview prep access", included: true },
      { text: "AI cover letter customisation", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Unlimited",
    price: "₹499",
    period: "/month",
    description: "Everything, no limits, no waiting",
    cta: "Go Unlimited",
    ctaHref: "/register",
    highlight: false,
    features: [
      { text: "Unlimited resume tailors", included: true },
      { text: "Unlimited cover letters", included: true },
      { text: "Unlimited auto-applies", included: true },
      { text: "AI job matching", included: true },
      { text: "Application pipeline tracker", included: true },
      { text: "AI interview practice", included: true },
      { text: "Priority matching", included: true },
      { text: "Interview prep access", included: true },
      { text: "AI cover letter customisation", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel your subscription at any time from your profile settings. You'll retain access until the end of your billing period.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept UPI, all major credit and debit cards, and net banking through Razorpay.",
  },
  {
    q: "Is there a student discount?",
    a: "Yes! Ask your university about SViam Campus — students get Pro-level access through institutional licensing. Individual students can also reach out to us for discounted plans.",
  },
  {
    q: "What happens when I hit a free limit?",
    a: "You'll see a friendly prompt to upgrade. Your data and existing results are never lost — you just can't generate new ones until the limit resets next month.",
  },
  {
    q: "Do limits reset every month?",
    a: "Yes. All usage limits reset on the 1st of each month. Unused quota does not roll over.",
  },
];

const universityBenefits = [
  { icon: IconSchool, title: "Campus-wide access", desc: "Every enrolled student gets Pro-level features at no individual cost" },
  { icon: IconUsers, title: "Placement cell dashboard", desc: "Track student applications, offer rates, and top employers in one view" },
  { icon: IconBuildingBank, title: "Custom branding", desc: "White-labelled portal with your university's logo and career resources" },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen pt-14" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 px-6 py-2.5 flex items-center justify-between"
        style={{
          background: "color-mix(in srgb, var(--bg) 88%, transparent)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link
          href="/"
          className="gradient-text text-sm font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          SViam
        </Link>
        <Link
          href="/register"
          className="px-4 py-1.5 rounded-[8px] text-xs font-semibold text-white"
          style={{
            background: "var(--teal)",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          Get Started
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ background: "rgba(0,153,153,0.08)", border: "1px solid rgba(0,153,153,0.2)" }}
          >
            <span className="text-[0.65rem] font-medium text-[var(--teal)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
              For job seekers
            </span>
          </div>
          <h1
            className="text-[var(--text)] mb-3"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            Simple, transparent pricing
          </h1>
          <p
            className="text-sm text-[var(--muted)] max-w-md mx-auto"
            style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
          >
            Start free. Upgrade when you need more. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-20">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="rounded-[16px] p-6 flex flex-col relative"
              style={{
                background: "var(--card)",
                border: tier.highlight
                  ? "2px solid var(--teal)"
                  : "1px solid var(--border)",
                boxShadow: tier.highlight
                  ? "0 0 40px rgba(0,153,153,0.1)"
                  : undefined,
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
              <h2
                className="text-lg font-semibold text-[var(--text)] mb-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {tier.name}
              </h2>
              <p
                className="text-xs text-[var(--muted2)] mb-4"
                style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
              >
                {tier.description}
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

              <ul className="space-y-2.5 mb-6 flex-1">
                {tier.features.map((f) => (
                  <li
                    key={f.text}
                    className="flex items-start gap-2 text-xs"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {f.included ? (
                      <IconCheck
                        size={14}
                        className="flex-shrink-0 mt-0.5"
                        style={{ color: "#009999" }}
                      />
                    ) : (
                      <IconX
                        size={14}
                        className="flex-shrink-0 mt-0.5"
                        style={{ color: "var(--muted)" }}
                      />
                    )}
                    <span
                      style={{
                        color: f.included ? "var(--text)" : "var(--muted)",
                      }}
                    >
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.ctaHref}
                className="w-full text-center py-2.5 rounded-[10px] text-sm font-semibold transition-all hover:brightness-110"
                style={{
                  background: tier.highlight
                    ? "var(--teal)"
                    : "var(--surface)",
                  color: tier.highlight ? "white" : "var(--text)",
                  border: tier.highlight
                    ? "none"
                    : "1px solid var(--border)",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* University Partnership Section */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{ background: "rgba(0,153,153,0.08)", border: "1px solid rgba(0,153,153,0.2)" }}
            >
              <IconBuildingBank size={12} style={{ color: "var(--teal)" }} />
              <span className="text-[0.65rem] font-medium text-[var(--teal)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                For universities & institutions
              </span>
            </div>
            <h2
              className="text-[var(--text)] mb-3"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
              }}
            >
              SViam Campus
            </h2>
            <p
              className="text-sm text-[var(--muted)] max-w-lg mx-auto"
              style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
            >
              License SViam for your entire student body. Give every student Pro-level access
              to AI job matching, resume tailoring, and auto-apply — powered by your placement cell.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {universityBenefits.map((b) => (
              <div
                key={b.title}
                className="rounded-[14px] p-5"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3"
                  style={{ background: "rgba(0,153,153,0.1)", color: "var(--teal)" }}
                >
                  <b.icon size={20} />
                </div>
                <h3
                  className="text-sm font-semibold text-[var(--text)] mb-1"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {b.title}
                </h3>
                <p
                  className="text-xs text-[var(--muted2)]"
                  style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
                >
                  {b.desc}
                </p>
              </div>
            ))}
          </div>

          <div
            className="rounded-[16px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
            style={{
              background: "linear-gradient(135deg, rgba(0,153,153,0.06), rgba(0,153,153,0.02))",
              border: "1px solid rgba(0,153,153,0.15)",
            }}
          >
            <div>
              <h3
                className="text-base font-semibold text-[var(--text)] mb-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Partner with us
              </h3>
              <p
                className="text-xs text-[var(--muted2)] max-w-md"
                style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
              >
                We offer custom pricing based on student count. Includes placement cell analytics,
                bulk onboarding, and dedicated support. Currently onboarding pilot universities.
              </p>
            </div>
            <Link
              href="/contact?subject=university-partnership"
              className="flex items-center gap-2 px-6 py-3 rounded-[12px] text-sm font-medium text-white shrink-0 transition-all hover:brightness-110"
              style={{
                background: "var(--teal)",
                fontFamily: "var(--font-dm-sans)",
                boxShadow: "0 0 24px rgba(0,153,153,0.25)",
              }}
            >
              <IconMail size={16} />
              Get in touch
              <IconArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2
            className="text-lg font-semibold text-[var(--text)] text-center mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Billing FAQ
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="p-4 rounded-[12px]"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  className="text-sm font-medium text-[var(--text)] mb-1"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {faq.q}
                </p>
                <p
                  className="text-xs text-[var(--muted2)] leading-relaxed"
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontWeight: 300,
                  }}
                >
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p
            className="text-xs text-[var(--muted)]"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Questions? Reach out at{" "}
            <Link href="/contact" className="text-[var(--teal)] hover:underline">
              sviam.in/contact
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
