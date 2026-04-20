import Link from "next/link";

export const metadata = {
  title: "Contact Us | SViam",
  description: "Get in touch with the SViam team.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <nav className="px-6 py-5">
        <Link href="/">
          <span className="gradient-text cursor-pointer" style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontStyle: "italic" }}>
            SViam
          </span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: "rgba(0,153,153,0.1)", border: "1px solid rgba(0,153,153,0.2)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h1 className="text-3xl text-text mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            Get in Touch
          </h1>
          <p className="text-muted mb-8 leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            Have questions, feedback, or want to partner with us? We would love to hear from you.
          </p>

          <div className="space-y-4 mb-10">
            {[
              { label: "General Inquiries", value: "hello@sviam.in", href: "mailto:hello@sviam.in" },
              { label: "Support", value: "support@sviam.in", href: "mailto:support@sviam.in" },
              { label: "Partnerships", value: "partners@sviam.in", href: "mailto:partners@sviam.in" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block p-4 rounded-xl text-left hover:bg-card transition-colors"
                style={{ border: "1px solid var(--border)" }}
              >
                <p className="text-xs text-muted mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>{item.label}</p>
                <p className="text-sm text-accent2" style={{ fontFamily: "var(--font-dm-sans)" }}>{item.value}</p>
              </a>
            ))}
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm text-white"
            style={{ background: "linear-gradient(135deg, var(--teal), var(--accent2))", fontFamily: "var(--font-dm-sans)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3m0 0l4 4m-4-4l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
