import Link from "next/link";

export const metadata = {
  title: "AI Resume Builder | SViam",
  description: "Build, parse, and tailor your resume with AI. Optimize for ATS and get higher match scores.",
};

export default function ResumeBuilderInfoPage() {
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
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="text-4xl mb-4 block">{"\u{1F4C4}"}</span>
            <h1 className="text-4xl md:text-5xl text-text mb-4" style={{ fontFamily: "var(--font-serif)" }}>
              AI Resume Builder
            </h1>
            <p className="text-lg text-muted max-w-xl mx-auto" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
              Upload any resume and our AI parses it into structured sections. Edit, improve bullet points, generate summaries, and tailor your resume for specific roles.
            </p>
          </div>

          {/* Capabilities */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {[
              { icon: "\u{1F50D}", title: "Smart Resume Parsing", desc: "Upload a PDF and our AI extracts personal info, work experience, education, skills, and certifications into editable sections." },
              { icon: "\u2728", title: "AI Bullet Improvement", desc: "Transform vague bullet points into quantified, impact driven statements that recruiters notice." },
              { icon: "\u{1F3AF}", title: "Job Specific Tailoring", desc: "Paste a job description and our AI rewrites your resume to emphasize the most relevant experience and skills for that role." },
              { icon: "\u{1F4CA}", title: "ATS Score Optimization", desc: "See how your resume scores against specific jobs and get actionable suggestions to improve your match rate." },
              { icon: "\u{1F4DD}", title: "Summary Generation", desc: "AI generates a professional summary paragraph based on your experience, skills, and target role." },
              { icon: "\u{1F4E5}", title: "PDF Export", desc: "Download your polished resume as a clean, ATS friendly PDF ready to submit." },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <span className="text-2xl mb-3 block">{item.icon}</span>
                <h3 className="text-lg text-text mb-2" style={{ fontFamily: "var(--font-serif)" }}>{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* How it works */}
          <h2 className="text-2xl text-text mb-6" style={{ fontFamily: "var(--font-serif)" }}>How It Works</h2>
          <div className="space-y-4 mb-16">
            {[
              { step: "1", title: "Upload your existing resume", desc: "PDF or Word format. Our AI reads and structures it in seconds." },
              { step: "2", title: "Review and edit sections", desc: "Each section is editable. Tweak anything the AI extracted or add new information." },
              { step: "3", title: "Improve with AI", desc: "Click to improve bullet points, generate summaries, or get skill suggestions based on your experience." },
              { step: "4", title: "Tailor for specific jobs", desc: "Paste a job description and the AI highlights what to change to maximize your fit for that role." },
              { step: "5", title: "Download and apply", desc: "Export your optimized resume as a PDF and apply with confidence." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 p-4 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-white bg-accent">{item.step}</span>
                <div>
                  <h3 className="text-sm font-medium text-text mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>{item.title}</h3>
                  <p className="text-sm text-muted" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/resume-builder"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm text-white font-medium"
              style={{ background: "linear-gradient(135deg, var(--teal), var(--accent2))", fontFamily: "var(--font-dm-sans)" }}
            >
              Open Resume Builder
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm text-muted2 hover:text-text transition-colors"
              style={{ fontFamily: "var(--font-dm-sans)", border: "1px solid var(--border)" }}
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm text-muted hover:text-text transition-colors"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
