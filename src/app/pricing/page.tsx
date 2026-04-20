import Link from "next/link";
import type { Metadata } from "next";
import { IconCheck, IconX, IconSparkles } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Pricing | SViam",
  description:
    "SViam pricing plans. Free job matching, resume tailoring, and interview prep. Upgrade to Pro or Premium for unlimited access.",
};

const tiers = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Get started with AI-powered job matching",
    cta: "Start Free",
    ctaHref: "/dashboard",
    highlight: false,
    features: [
      { text: "10 job matches per day", included: true },
      { text: "3 resume tailors per month", included: true },
      { text: "3 cover letters per month", included: true },
      { text: "AI interview practice", included: true },
      { text: "Application pipeline tracker", included: true },
      { text: "Unlimited matches", included: false },
      { text: "Priority matching", included: false },
      { text: "Auto-apply agent", included: false },
    ],
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/month",
    description: "Unlimited tools for serious job seekers",
    cta: "Upgrade to Pro",
    ctaHref: "/dashboard",
    highlight: true,
    features: [
      { text: "Unlimited job matches", included: true },
      { text: "Unlimited resume tailoring", included: true },
      { text: "Unlimited cover letters", included: true },
      { text: "AI interview practice", included: true },
      { text: "Application pipeline tracker", included: true },
      { text: "Priority matching", included: true },
      { text: "Email digest of new matches", included: true },
      { text: "Auto-apply agent", included: false },
    ],
  },
  {
    name: "Premium",
    price: "₹999",
    period: "/month",
    description: "Everything, plus auto-apply when it launches",
    cta: "Go Premium",
    ctaHref: "/dashboard",
    highlight: false,
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Auto-apply agent (coming soon)", included: true },
      { text: "Dedicated support", included: true },
      { text: "Early access to new features", included: true },
      { text: "Company research reports", included: true },
      { text: "Salary insights", included: true },
      { text: "Interview coaching AI", included: true },
      { text: "Resume ATS score checker", included: true },
    ],
  },
];

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel your subscription at any time from your profile settings. You will retain access until the end of your billing period.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept UPI, all major credit and debit cards, and net banking through Razorpay.",
  },
  {
    q: "Is there a student discount?",
    a: "We are working on student pricing. For now, the free tier covers most needs. Reach out to us if you are a student and need more.",
  },
  {
    q: "What happens when I hit a free limit?",
    a: "You will see a friendly prompt to upgrade. Your data and existing results are never lost — you just cannot generate new ones until the limit resets (daily for matches, monthly for tailoring).",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen pt-14" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 px-6 py-2.5 flex items-center justify-between"
        style={{
          background: "rgba(10,10,14,0.88)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link
          href="/"
          className="text-sm font-semibold text-[var(--text)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          SViam
        </Link>
        <Link
          href="/dashboard"
          className="px-4 py-1.5 rounded-[8px] text-xs font-semibold text-white"
          style={{
            background: "var(--teal)",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          Dashboard
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-14">
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
            Start free. Upgrade when you need more. No hidden fees, no
            surprises.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-16">
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
                  ? "0 0 40px rgba(99,102,241,0.1)"
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

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
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
      </div>
    </main>
  );
}
