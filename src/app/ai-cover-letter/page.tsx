import Link from "next/link";

export const metadata = {
  title: "AI Cover Letter Generator | SViam",
  description: "Generate tailored cover letters for every job application in seconds using AI.",
};

export default function AICoverLetterPage() {
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
            <span className="text-4xl mb-4 block">{"\u{270D}\uFE0F"}</span>
            <h1 className="text-4xl md:text-5xl text-text mb-4" style={{ fontFamily: "var(--font-serif)" }}>
              AI Cover Letter Generator
            </h1>
            <p className="text-lg text-muted max-w-xl mx-auto" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
              Stop spending hours writing cover letters. Our AI reads the job description and your resume, then crafts a personalized cover letter that highlights exactly why you are the right fit.
            </p>
          </div>

          {/* How it works */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { step: "01", title: "Select a Job", desc: "Pick any matched job from your dashboard or paste a job description directly." },
              { step: "02", title: "Choose Your Tone", desc: "Formal for corporate roles. Creative for startups. The AI adapts its writing style to match the company culture." },
              { step: "03", title: "Get Your Letter", desc: "A polished, personalized cover letter ready to send. Edit if you want or use it as is." },
            ].map((item) => (
              <div key={item.step} className="p-6 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <span className="text-xs text-accent2 font-medium" style={{ fontFamily: "var(--font-dm-mono)" }}>{item.step}</span>
                <h3 className="text-lg text-text mt-2 mb-2" style={{ fontFamily: "var(--font-serif)" }}>{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Features */}
          <h2 className="text-2xl text-text mb-6" style={{ fontFamily: "var(--font-serif)" }}>Why Use AI Cover Letters</h2>
          <div className="space-y-4 mb-16">
            {[
              { title: "Personalized to Every Role", desc: "Each cover letter is unique, tailored to the specific job description, company, and role requirements." },
              { title: "Highlights Your Strengths", desc: "The AI identifies which of your skills and experiences matter most for each role and puts them front and center." },
              { title: "Professional Quality", desc: "Well structured, grammatically perfect, and written in a natural tone that doesn't sound like AI." },
              { title: "Save Hours Every Week", desc: "Generate a quality cover letter in under 30 seconds instead of spending 30 minutes writing one from scratch." },
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
              Write a Cover Letter
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <Link
              href="/resume-builder"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm text-muted2 hover:text-text transition-colors"
              style={{ fontFamily: "var(--font-dm-sans)", border: "1px solid var(--border)" }}
            >
              Open Resume Builder
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
