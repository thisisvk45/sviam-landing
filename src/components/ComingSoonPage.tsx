import Link from "next/link";

export default function ComingSoonPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      {/* Header */}
      <nav className="px-6 py-5">
        <Link href="/">
          <span
            className="gradient-text cursor-pointer"
            style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontStyle: "italic" }}
          >
            SViam
          </span>
        </Link>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h1
            className="text-3xl text-text mb-3"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {title}
          </h1>
          <p
            className="text-muted mb-8 leading-relaxed"
            style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
          >
            {description}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--teal), var(--accent2))", fontFamily: "var(--font-dm-sans)" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 8H3m0 0l4 4m-4-4l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Home
            </Link>
            <a
              href="mailto:hello@sviam.in"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm text-muted hover:text-text transition-colors"
              style={{ fontFamily: "var(--font-dm-sans)", border: "1px solid var(--border)" }}
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center">
        <p className="text-[0.7rem] text-muted" style={{ fontFamily: "var(--font-dm-sans)" }}>
          &copy; 2026 SViam Technologies Pvt Ltd
        </p>
      </div>
    </div>
  );
}
