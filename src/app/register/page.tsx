"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
  IconBrandGoogle,
  IconTargetArrow,
  IconFileText,
  IconSparkles,
  IconRocket,
  IconUsers,
  IconBriefcase,
  IconMail,
  IconLock,
  IconUser,
} from "@tabler/icons-react";

type UserType = "seeker" | "hirer" | null;

const SEEKER_BENEFITS = [
  { icon: IconTargetArrow, title: "AI Job Matching", desc: "Get matched to roles that fit your skills" },
  { icon: IconFileText, title: "Resume Tailoring", desc: "Optimize your resume for each application" },
  { icon: IconSparkles, title: "One-Click Apply", desc: "Apply to matched jobs instantly" },
  { icon: IconRocket, title: "Interview Prep", desc: "AI-powered practice for your target roles" },
];

const HIRER_BENEFITS = [
  { icon: IconUsers, title: "AI-Screened Candidates", desc: "Every candidate pre-scored before they reach you" },
  { icon: IconTargetArrow, title: "Smart Matching", desc: "Find the right fit from thousands of profiles" },
  { icon: IconBriefcase, title: "Streamlined Pipeline", desc: "Track candidates from match to offer" },
  { icon: IconSparkles, title: "Save 4x on Hiring", desc: "Cheaper than traditional job boards" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [supabase, router]);

  const handleGoogle = () => {
    // Store the user type as a cookie so the server callback can route correctly
    if (userType) {
      document.cookie = `sviam_user_type=${userType};path=/;max-age=1800;SameSite=Lax`;
    }
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (userType) {
      document.cookie = `sviam_user_type=${userType};path=/;max-age=1800;SameSite=Lax`;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim(), user_type: userType },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setConfirmSent(true);
    }
  };

  const benefits = userType === "hirer" ? HIRER_BENEFITS : SEEKER_BENEFITS;
  const leftHeading = userType === "hirer" ? "Build your dream team." : "Land your dream role.";
  const leftSub = userType === "hirer"
    ? "AI-powered hiring that finds, screens, and ranks candidates before they reach your calendar."
    : "Join thousands of candidates finding their dream role faster with AI matching, resume tailoring, and one-click apply.";

  return (
    <main className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Left panel — branding + benefits */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-center px-16 relative overflow-hidden"
        style={{ background: "var(--card)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: userType === "hirer"
              ? "radial-gradient(ellipse 80% 60% at 20% 80%, rgba(0,153,153,0.08) 0%, transparent 60%)"
              : "radial-gradient(ellipse 80% 60% at 20% 80%, rgba(99,102,241,0.08) 0%, transparent 60%)",
            transition: "background 0.4s ease",
          }}
        />

        <div className="relative z-10 max-w-md">
          <Link href="/">
            <span
              className="gradient-text inline-block mb-8"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                fontWeight: 700,
                letterSpacing: "-0.03em",
              }}
            >
              SViam
            </span>
          </Link>

          <h1
            className="text-[var(--text)] mb-3"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2.2rem",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              transition: "opacity 0.3s ease",
            }}
          >
            {leftHeading}
          </h1>

          <p
            className="text-[var(--muted2)] mb-10"
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 300,
              fontSize: "0.95rem",
              lineHeight: 1.6,
            }}
          >
            {leftSub}
          </p>

          <div className="space-y-5">
            {benefits.map((b) => (
              <div key={b.title} className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{
                    background: userType === "hirer" ? "rgba(0,153,153,0.1)" : "rgba(99,102,241,0.1)",
                    color: userType === "hirer" ? "var(--teal)" : "var(--teal)",
                  }}
                >
                  <b.icon size={20} />
                </div>
                <div>
                  <p
                    className="text-sm font-semibold text-[var(--text)]"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {b.title}
                  </p>
                  <p
                    className="text-xs text-[var(--muted2)]"
                    style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
                  >
                    {b.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — sign-up form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/">
              <span
                className="gradient-text inline-block"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                }}
              >
                SViam
              </span>
            </Link>
          </div>

          <h2
            className="text-[var(--text)] text-center mb-1"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Create your account
          </h2>
          <p
            className="text-center text-[var(--muted2)] mb-6"
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 300,
              fontSize: "0.85rem",
            }}
          >
            Free forever. No credit card required.
          </p>

          {/* Role selection — seeker vs hirer */}
          <p
            className="text-xs text-[var(--muted)] mb-3"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            I want to...
          </p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setUserType("seeker")}
              className="p-4 rounded-[14px] text-center transition-all duration-200"
              style={{
                background: userType === "seeker" ? "rgba(99,102,241,0.08)" : "var(--surface)",
                border: `2px solid ${userType === "seeker" ? "rgba(99,102,241,0.4)" : "var(--border)"}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center mx-auto mb-2"
                style={{
                  background: userType === "seeker" ? "rgba(99,102,241,0.15)" : "var(--card)",
                  color: userType === "seeker" ? "var(--teal)" : "var(--muted)",
                }}
              >
                <IconTargetArrow size={20} />
              </div>
              <p
                className="text-sm font-semibold mb-0.5"
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  color: userType === "seeker" ? "var(--teal)" : "var(--text)",
                }}
              >
                Find a job
              </p>
              <p
                className="text-[0.65rem] text-[var(--muted)]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                AI matching & apply
              </p>
            </button>

            <button
              onClick={() => setUserType("hirer")}
              className="p-4 rounded-[14px] text-center transition-all duration-200"
              style={{
                background: userType === "hirer" ? "rgba(0,153,153,0.08)" : "var(--surface)",
                border: `2px solid ${userType === "hirer" ? "rgba(0,153,153,0.4)" : "var(--border)"}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center mx-auto mb-2"
                style={{
                  background: userType === "hirer" ? "rgba(0,153,153,0.15)" : "var(--card)",
                  color: userType === "hirer" ? "var(--teal)" : "var(--muted)",
                }}
              >
                <IconUsers size={20} />
              </div>
              <p
                className="text-sm font-semibold mb-0.5"
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  color: userType === "hirer" ? "var(--teal)" : "var(--text)",
                }}
              >
                Hire talent
              </p>
              <p
                className="text-[0.65rem] text-[var(--muted)]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                AI-screened candidates
              </p>
            </button>
          </div>

          {/* Sign-up options — only show after role selected */}
          {userType && !confirmSent && (
            <div style={{ animation: "fadeInUp 0.3s ease forwards" }}>
              {/* Email/Password form */}
              <form onSubmit={handleEmailSignup} className="space-y-3 mb-4">
                <div className="relative">
                  <IconUser
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--muted)" }}
                  />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full py-3 pl-10 pr-4 rounded-[12px] text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--teal)]"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      fontFamily: "var(--font-dm-sans)",
                      color: "var(--text)",
                    }}
                  />
                </div>
                <div className="relative">
                  <IconMail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--muted)" }}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-3 pl-10 pr-4 rounded-[12px] text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--teal)]"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      fontFamily: "var(--font-dm-sans)",
                      color: "var(--text)",
                    }}
                  />
                </div>
                <div className="relative">
                  <IconLock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--muted)" }}
                  />
                  <input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-3 pl-10 pr-4 rounded-[12px] text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--teal)]"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      fontFamily: "var(--font-dm-sans)",
                      color: "var(--text)",
                    }}
                  />
                </div>

                {error && (
                  <p
                    className="text-xs text-red-400 text-center"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-[12px] text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                  style={{
                    background: "var(--teal)",
                    fontFamily: "var(--font-dm-sans)",
                    boxShadow: userType === "hirer"
                      ? "0 0 24px rgba(0,153,153,0.3)"
                      : "0 0 24px rgba(108,99,255,0.3)",
                  }}
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                <span
                  className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-dm-mono)" }}
                >
                  or
                </span>
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              </div>

              <button
                onClick={handleGoogle}
                className="w-full py-3.5 rounded-[12px] text-sm font-medium flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mb-6"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  fontFamily: "var(--font-dm-sans)",
                  color: "var(--text)",
                }}
              >
                <IconBrandGoogle size={18} />
                Sign up with Google
              </button>

              {/* What happens next */}
              {userType === "seeker" && (
                <div
                  className="p-4 rounded-[14px] mb-6 space-y-2.5"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    animation: "fadeInUp 0.3s ease 0.1s both",
                  }}
                >
                  <p
                    className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider"
                    style={{ fontFamily: "var(--font-dm-mono)" }}
                  >
                    After sign-up you&apos;ll set up
                  </p>
                  {[
                    "Job function & target roles",
                    "Where you're based & work mode",
                    "Experience level",
                    "Resume upload for AI matching",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2.5 text-xs text-[var(--muted2)]"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: "var(--teal)" }}
                      />
                      {item}
                    </div>
                  ))}
                </div>
              )}

              {userType === "hirer" && (
                <div
                  className="p-4 rounded-[14px] mb-6"
                  style={{
                    background: "rgba(0,153,153,0.04)",
                    border: "1px solid rgba(0,153,153,0.15)",
                    animation: "fadeInUp 0.3s ease 0.1s both",
                  }}
                >
                  <p
                    className="text-xs text-[var(--muted2)]"
                    style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
                  >
                    Our hiring platform is launching soon. Sign up now to get early access and be first in line.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Confirmation sent message */}
          {confirmSent && (
            <div
              className="p-6 rounded-[14px] mb-6 text-center"
              style={{
                background: "rgba(0,153,153,0.06)",
                border: "1px solid rgba(0,153,153,0.2)",
                animation: "fadeInUp 0.3s ease forwards",
              }}
            >
              <p
                className="text-sm font-semibold text-[var(--text)] mb-2"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Check your email
              </p>
              <p
                className="text-xs text-[var(--muted2)]"
                style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
              >
                We sent a confirmation link to <strong className="text-[var(--text)]">{email}</strong>.
                Click it to activate your account, then sign in.
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span
              className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              already a member?
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          <Link
            href="/signin"
            className="block w-full py-3 rounded-[12px] text-sm font-medium text-center transition-all duration-200 hover:scale-[1.01]"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            Sign in to your account
          </Link>

          {/* Terms */}
          <p
            className="text-center mt-6 text-[0.6rem] text-[var(--muted)] leading-relaxed"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            By signing up, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-[var(--muted2)]">Terms</Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-[var(--muted2)]">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
