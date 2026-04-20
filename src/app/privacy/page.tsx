import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | SViam",
  description: "How SViam collects, uses, and protects your data.",
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-muted mb-8" style={{ fontFamily: "var(--font-dm-sans)" }}>
            Last updated: April 2026
          </p>

          <div className="space-y-6 text-muted leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            <p>
              SViam Technologies Pvt Ltd (&quot;SViam&quot;, &quot;we&quot;, &quot;our&quot;) is committed to protecting your privacy.
              This policy explains how we collect, use, and safeguard your personal information.
            </p>

            <Section title="Information We Collect">
              <ul className="space-y-2 ml-4">
                <li className="flex gap-2"><Dot /><span><strong className="text-text">Account data:</strong> Name, email, and profile picture from Google sign-in.</span></li>
                <li className="flex gap-2"><Dot /><span><strong className="text-text">Resume data:</strong> Resume files you upload, parsed content (skills, experience, education).</span></li>
                <li className="flex gap-2"><Dot /><span><strong className="text-text">Preferences:</strong> Job preferences, location, salary expectations, work mode.</span></li>
                <li className="flex gap-2"><Dot /><span><strong className="text-text">Usage data:</strong> Pages visited, features used, anonymized analytics.</span></li>
              </ul>
            </Section>

            <Section title="How We Use Your Data">
              <ul className="space-y-2 ml-4">
                <li className="flex gap-2"><Dot /><span>Match you with relevant job opportunities using AI.</span></li>
                <li className="flex gap-2"><Dot /><span>Generate tailored resumes and cover letters.</span></li>
                <li className="flex gap-2"><Dot /><span>Provide interview preparation and career tools.</span></li>
                <li className="flex gap-2"><Dot /><span>Improve our AI models and platform experience.</span></li>
              </ul>
            </Section>

            <Section title="Data Protection">
              <p>
                Your resume and personal data are encrypted at rest and in transit. We use Supabase for secure data storage
                with row-level security. Your resume is never shared with employers or third parties without your explicit consent.
              </p>
            </Section>

            <Section title="Third Party Services">
              <p>We use the following services:</p>
              <ul className="space-y-2 ml-4 mt-2">
                <li className="flex gap-2"><Dot /><span><strong className="text-text">Google OAuth</strong> for authentication.</span></li>
                <li className="flex gap-2"><Dot /><span><strong className="text-text">Supabase</strong> for data storage and auth.</span></li>
                <li className="flex gap-2"><Dot /><span><strong className="text-text">Vercel Analytics</strong> for anonymized page analytics.</span></li>
              </ul>
            </Section>

            <Section title="Your Rights">
              <p>
                You can delete your account and all associated data at any time from your Profile settings.
                You can also request a data export by emailing privacy@sviam.in.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                For privacy related inquiries, email us at{" "}
                <a href="mailto:privacy@sviam.in" className="text-accent2 hover:underline">privacy@sviam.in</a>.
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
