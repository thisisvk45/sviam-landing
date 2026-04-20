import Link from "next/link";

export const metadata = {
  title: "About Us | SViam",
  description: "SViam is India's AI-powered hiring platform. Learn about our mission to transform how India hires.",
};

export default function AboutPage() {
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
          <h1 className="text-4xl text-text mb-6" style={{ fontFamily: "var(--font-serif)" }}>
            About SViam
          </h1>

          <div className="space-y-6 text-muted leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            <p className="text-lg text-text" style={{ fontWeight: 400 }}>
              SViam is building the future of hiring in India, powered by AI and designed for the way India actually works.
            </p>

            <p>
              We started with a simple frustration: applying to hundreds of jobs, getting ghosted, and never knowing why.
              The hiring process in India is broken for both candidates and companies. Resumes get lost in ATS black holes,
              interviews test memorization over capability, and the best talent rarely meets the right opportunity.
            </p>

            <p>
              SViam fixes this. Our AI matches candidates to roles based on deep skill analysis, not keyword stuffing.
              We parse resumes, understand context, and score compatibility across skills, experience, and culture fit.
              For candidates, this means fewer applications and better outcomes. For companies, it means faster hires
              and lower attrition.
            </p>

            {/* Mission */}
            <div className="rounded-2xl p-8 my-10" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <h2 className="text-3xl text-text mb-4" style={{ fontFamily: "var(--font-serif)" }}>Our Mission</h2>
              <p className="text-lg text-muted2 leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)" }}>
                Make hiring in India intelligent, fair, and fast so every candidate finds work that fits
                and every company finds talent that lasts.
              </p>
            </div>

            <h2 className="text-2xl text-text pt-4" style={{ fontFamily: "var(--font-serif)" }}>What We Build</h2>

            <div className="grid gap-4 mt-4">
              {[
                {
                  name: "AI Job Copilot",
                  desc: "Resume matching, tailoring, cover letters, and auto-apply. All powered by AI that understands your career trajectory.",
                  icon: "\u{1F3AF}",
                },
                {
                  name: "AI Interview Platform",
                  desc: "Structured AI interviews that assess real capability, not memorized answers. Fair, consistent, and scalable.",
                  icon: "\u{1F399}\uFE0F",
                },
                {
                  name: "Resume Intelligence",
                  desc: "AI-powered resume parsing, scoring, and tailoring. Generate custom resumes optimized for each role you apply to.",
                  icon: "\u{1F4C4}",
                },
                {
                  name: "F-1 Visa Prep",
                  desc: "Mock visa interviews with AI feedback for students heading to the US. Practice with real consulate questions.",
                  icon: "\u{1F30D}",
                },
                {
                  name: "Application Pipeline",
                  desc: "Track every application from submission to offer. Never lose track of where you stand.",
                  icon: "\u{1F4CA}",
                },
                {
                  name: "Auto-Apply Agent",
                  desc: "Coming soon. Set your preferences and let our AI apply to matching roles on your behalf, 24/7.",
                  icon: "\u{1F916}",
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className="flex gap-4 p-4 rounded-xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <span className="text-2xl shrink-0">{item.icon}</span>
                  <div>
                    <h3 className="text-sm font-medium text-text mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>{item.name}</h3>
                    <p className="text-sm text-muted" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
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
