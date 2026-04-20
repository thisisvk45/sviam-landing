import Link from "next/link";

export const metadata = {
  title: "AI Job Matching | SViam",
  description: "Upload your resume, get matched to the best roles in India using AI. Skill-based matching, not keyword stuffing.",
};

export default function AIJobMatchPage() {
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
            <span className="text-4xl mb-4 block">{"\u{1F3AF}"}</span>
            <h1 className="text-4xl md:text-5xl text-text mb-4" style={{ fontFamily: "var(--font-serif)" }}>
              AI Job Matching
            </h1>
            <p className="text-lg text-muted max-w-xl mx-auto" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
              Upload your resume once. Our AI reads it like a recruiter, understands your skills, experience, and career trajectory, then matches you to roles that actually fit.
            </p>
          </div>

          {/* How it works */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { step: "01", title: "Upload Your Resume", desc: "Drop your PDF or Word file. Our AI extracts skills, experience, education, and career context in seconds." },
              { step: "02", title: "AI Analyzes and Matches", desc: "We compare your profile against thousands of live job postings using semantic understanding, not simple keyword matching." },
              { step: "03", title: "Get Ranked Results", desc: "See jobs ranked by match score with sub-scores for skill fit, experience alignment, and location compatibility." },
            ].map((item) => (
              <div key={item.step} className="p-6 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <span className="text-xs text-accent2 font-medium" style={{ fontFamily: "var(--font-dm-mono)" }}>{item.step}</span>
                <h3 className="text-lg text-text mt-2 mb-2" style={{ fontFamily: "var(--font-serif)" }}>{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Features */}
          <h2 className="text-2xl text-text mb-6" style={{ fontFamily: "var(--font-serif)" }}>What Makes It Different</h2>
          <div className="space-y-4 mb-16">
            {[
              { title: "Semantic Skill Matching", desc: "We understand that \"React\" and \"React.js\" are the same thing, and that a \"Full Stack Developer\" likely knows both frontend and backend. No more missing matches because of keyword variations." },
              { title: "Experience Level Calibration", desc: "A 2 year developer won't see VP roles. A senior engineer won't see internships. We calibrate results to your actual experience level." },
              { title: "Real Time Job Index", desc: "We index jobs from top Indian companies and job boards daily. You see fresh opportunities, not stale listings." },
              { title: "Match Score Transparency", desc: "Every match comes with a detailed breakdown showing why it scored the way it did across skills, experience, and location dimensions." },
              { title: "One Click Apply", desc: "Found a match? Apply directly from SViam. We track your application status so you never lose track of where you stand." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 p-4 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-accent" />
                <div>
                  <h3 className="text-sm font-medium text-text mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>{item.title}</h3>
                  <p className="text-sm text-muted" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm text-white font-medium"
              style={{ background: "linear-gradient(135deg, var(--teal), var(--accent2))", fontFamily: "var(--font-dm-sans)" }}
            >
              Upload Resume and Match
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <Link
              href="/resume-builder"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm text-muted2 hover:text-text transition-colors"
              style={{ fontFamily: "var(--font-dm-sans)", border: "1px solid var(--border)" }}
            >
              Build Your Resume First
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
