import Link from "next/link";

export const metadata = {
  title: "Interview Prep | SViam",
  description: "Practice for your next interview with AI-generated questions tailored to your target role and company.",
};

export default function InterviewPrepInfoPage() {
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
            <span className="text-4xl mb-4 block">{"\u{1F399}\uFE0F"}</span>
            <h1 className="text-4xl md:text-5xl text-text mb-4" style={{ fontFamily: "var(--font-serif)" }}>
              Interview Prep
            </h1>
            <p className="text-lg text-muted max-w-xl mx-auto" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
              Get ready for your next interview with AI generated questions tailored to the specific role, company, and your experience level. Practice smart, not just hard.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {[
              { icon: "\u{1F3AF}", title: "Role Specific Questions", desc: "Questions are generated based on the exact job title, company, and required skills. No generic interview prep." },
              { icon: "\u{1F4CA}", title: "Difficulty Calibration", desc: "Questions match your experience level. Entry level candidates get fundamentals. Senior candidates get system design and leadership scenarios." },
              { icon: "\u{1F4A1}", title: "Expert Tips", desc: "Every question comes with a tip on how to approach it, what interviewers are looking for, and common mistakes to avoid." },
              { icon: "\u{1F30D}", title: "F1 Visa Prep", desc: "Specialized mock visa interview questions for students applying to US universities. Practice with real consulate style questions." },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <span className="text-2xl mb-3 block">{item.icon}</span>
                <h3 className="text-lg text-text mb-2" style={{ fontFamily: "var(--font-serif)" }}>{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Question categories */}
          <h2 className="text-2xl text-text mb-6" style={{ fontFamily: "var(--font-serif)" }}>Question Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-16">
            {[
              "Technical", "Behavioral", "System Design",
              "Problem Solving", "Culture Fit", "Leadership",
              "Domain Knowledge", "Case Study", "Situational",
            ].map((cat) => (
              <div key={cat} className="p-3 rounded-xl text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <span className="text-sm text-muted2" style={{ fontFamily: "var(--font-dm-sans)" }}>{cat}</span>
              </div>
            ))}
          </div>

          {/* How it works */}
          <h2 className="text-2xl text-text mb-6" style={{ fontFamily: "var(--font-serif)" }}>How It Works</h2>
          <div className="space-y-4 mb-16">
            {[
              { step: "1", title: "Enter the role and company", desc: "Tell us which job you are interviewing for and at which company." },
              { step: "2", title: "Add your skills and level", desc: "Optionally add your key skills and experience level so questions are calibrated to you." },
              { step: "3", title: "Get tailored questions", desc: "Our AI generates a set of realistic interview questions across multiple categories." },
              { step: "4", title: "Practice with tips", desc: "Each question includes expert tips on how to structure your answer and what the interviewer expects." },
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
              href="/interview-prep"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm text-white font-medium"
              style={{ background: "linear-gradient(135deg, var(--teal), var(--accent2))", fontFamily: "var(--font-dm-sans)" }}
            >
              Start Practicing Now
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <Link
              href="/visa-prep"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm text-muted2 hover:text-text transition-colors"
              style={{ fontFamily: "var(--font-dm-sans)", border: "1px solid var(--border)" }}
            >
              F1 Visa Prep
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
