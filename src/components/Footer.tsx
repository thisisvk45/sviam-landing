"use client";

import { useInView } from "@/hooks/useInView";
import Link from "next/link";

const features = [
  { label: "AI Job Match", href: "/ai-job-match" },
  { label: "Resume Builder", href: "/resume-builder-info" },
  { label: "AI Cover Letter", href: "/ai-cover-letter" },
  { label: "Interview Prep", href: "/interview-prep-info" },
  { label: "F-1 Visa Prep", href: "/visa-prep" },
  { label: "Application Pipeline", href: "/dashboard" },
  { label: "Auto-Apply Agent", href: "#", badge: "Coming Soon" },
  { label: "AI Interview Platform", href: "#", badge: "Coming Soon" },
];

const company = [
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
  { label: "Press Kit", href: "/press" },
  { label: "Contact Us", href: "/contact" },
  { label: "Partners", href: "/partners" },
];

const legal = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Help Center", href: "/help" },
  { label: "Report an Issue", href: "/report" },
];

function SocialIcon({ path, label }: { path: string; label: string }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/[0.05] transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d={path} />
      </svg>
    </a>
  );
}

export default function Footer() {
  const { ref, inView } = useInView<HTMLElement>({ margin: "-50px" });

  return (
    <footer
      className="relative z-10 pt-20 pb-8 px-6"
      ref={ref}
      style={{ borderTop: "1px solid var(--border)" }}
    >
      {/* Gradient line at top */}
      <div
        className={`absolute top-0 left-0 right-0 h-px anim-base anim-scale-x ${inView ? "in-view" : ""}`}
        style={{
          background: "linear-gradient(90deg, transparent 10%, var(--teal) 30%, var(--teal) 70%, transparent 90%)",
          opacity: 0.2,
          transformOrigin: "center",
        }}
      />

      <div className="max-w-7xl mx-auto">
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-10 mb-16 anim-base anim-fade-up ${inView ? "in-view" : ""}`}
        >
          {/* Column 1 — Branding */}
          <div className="col-span-2 md:col-span-1">
            <span
              className="gradient-text block mb-2"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.8rem",
                fontStyle: "italic",
              }}
            >
              SViam
            </span>
            <p
              className="text-sm text-[var(--muted)] mb-5"
              style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
            >
              India&apos;s AI Hiring Platform
            </p>

            {/* Social icons */}
            <div className="flex gap-1 mb-6">
              <SocialIcon
                label="LinkedIn"
                path="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
              />
              <SocialIcon
                label="Twitter"
                path="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
              />
              <SocialIcon
                label="Instagram"
                path="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
              />
              <SocialIcon
                label="YouTube"
                path="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
              />
            </div>

            <p
              className="text-xs text-[var(--muted)]"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              &copy; 2026 SViam Technologies Pvt Ltd
            </p>
          </div>

          {/* Column 2 — Features */}
          <div>
            <h4
              className="text-sm font-medium text-[var(--text)] mb-4"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Features
            </h4>
            <ul className="space-y-2.5">
              {features.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors inline-flex items-center gap-2"
                    style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
                  >
                    {item.label}
                    {item.badge && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "rgba(99,102,241,0.1)",
                          color: "var(--accent2)",
                          fontFamily: "var(--font-dm-mono)",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Company */}
          <div>
            <h4
              className="text-sm font-medium text-[var(--text)] mb-4"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Company
            </h4>
            <ul className="space-y-2.5">
              {company.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                    style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Legal & Support */}
          <div>
            <h4
              className="text-sm font-medium text-[var(--text)] mb-4"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Legal & Support
            </h4>
            <ul className="space-y-2.5">
              {legal.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                    style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className={`pt-6 anim-base anim-fade-up stagger-3 ${inView ? "in-view" : ""}`}
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p
            className="text-[0.7rem] text-[var(--muted)] text-center"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            &copy; 2026 SViam Technologies Pvt Ltd
          </p>
        </div>
      </div>
    </footer>
  );
}
