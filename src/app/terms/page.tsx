import Link from "next/link";

export const metadata = {
  title: "Terms of Service | SViam",
  description: "Terms and conditions for using SViam.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <nav className="px-6 py-5">
        <Link href="/">
          <span className="gradient-text cursor-pointer" style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontStyle: "italic" }}>
            SViam
          </span>
        </Link>
      </nav>

      <div className="flex-1 px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl text-text mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            Terms of Service
          </h1>
          <p className="text-sm text-muted mb-8" style={{ fontFamily: "var(--font-dm-sans)" }}>
            Last updated: April 2026
          </p>

          <div className="space-y-6 text-muted leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            <p>
              By using SViam (&quot;the Platform&quot;), you agree to these Terms of Service.
              SViam is operated by SViam Technologies Pvt Ltd, registered in Bengaluru, Karnataka, India.
            </p>

            <Section title="Account">
              <p>
                You must sign in with a valid Google account to use SViam&apos;s features. You are responsible for
                maintaining the security of your account. You must provide accurate information in your profile.
              </p>
            </Section>

            <Section title="Acceptable Use">
              <p>You agree not to:</p>
              <ul className="space-y-2 ml-4 mt-2">
                <li className="flex gap-2"><Dot /><span>Upload false or misleading information in your resume or profile.</span></li>
                <li className="flex gap-2"><Dot /><span>Use automated tools to scrape, crawl, or extract data from the platform.</span></li>
                <li className="flex gap-2"><Dot /><span>Attempt to reverse engineer our AI matching algorithms.</span></li>
                <li className="flex gap-2"><Dot /><span>Use the platform for any unlawful purpose.</span></li>
              </ul>
            </Section>

            <Section title="AI Generated Content">
              <p>
                SViam uses AI to generate resume suggestions, cover letters, interview questions, and match scores.
                These are provided as recommendations only. You are responsible for reviewing and verifying all
                AI generated content before using it in job applications.
              </p>
            </Section>

            <Section title="Data and Privacy">
              <p>
                Your use of SViam is also governed by our{" "}
                <Link href="/privacy" className="text-accent2 hover:underline">Privacy Policy</Link>.
                We do not sell your personal data. Your resume is used solely for job matching and will not be
                shared with third parties without your explicit consent.
              </p>
            </Section>

            <Section title="Subscriptions and Billing">
              <p>
                SViam offers free and paid tiers. Paid subscriptions are billed through our payment partner.
                You may cancel at any time. Refunds are handled on a case by case basis.
              </p>
            </Section>

            <Section title="Limitation of Liability">
              <p>
                SViam provides job matching and career tools on an &quot;as is&quot; basis. We do not guarantee
                job placement, interview outcomes, or employer responses. We are not liable for any decisions
                made based on our AI recommendations.
              </p>
            </Section>

            <Section title="Changes to Terms">
              <p>
                We may update these terms from time to time. Continued use of SViam after changes constitutes
                acceptance of the updated terms. Material changes will be communicated via email.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                For questions about these terms, email{" "}
                <a href="mailto:legal@sviam.in" className="text-accent2 hover:underline">legal@sviam.in</a>.
              </p>
            </Section>
          </div>

          <div className="mt-12">
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
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl text-text mb-3" style={{ fontFamily: "var(--font-serif)" }}>{title}</h2>
      {children}
    </div>
  );
}

function Dot() {
  return <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-accent" />;
}
