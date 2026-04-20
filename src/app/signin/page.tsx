"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { IconBrandGoogle } from "@tabler/icons-react";

export default function SignInPage() {
  const router = useRouter();

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
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: "var(--bg)" }}
    >
      {/* Background gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/">
            <span
              className="gradient-text inline-block"
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
        </div>

        {/* Card */}
        <div
          className="p-8 rounded-[20px]"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border2)",
          }}
        >
          <h1
            className="text-[var(--text)] text-center mb-1"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.4rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Welcome back
          </h1>
          <p
            className="text-center text-[var(--muted2)] mb-8"
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 300,
              fontSize: "0.85rem",
            }}
          >
            Sign in to your SViam account
          </p>

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
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="flex-1 h-px"
              style={{ background: "var(--border)" }}
            />
            <span
              className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              new here?
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: "var(--border)" }}
            />
          </div>

          <Link
            href="/register"
            className="block w-full py-3 rounded-[12px] text-sm font-medium text-center text-white transition-all duration-200 hover:scale-[1.01]"
            style={{
              background: "var(--teal)",
              fontFamily: "var(--font-dm-sans)",
              boxShadow: "0 0 20px rgba(0,153,153,0.25)",
            }}
          >
            Create a free account
          </Link>
        </div>

        {/* Footer */}
        <p
          className="text-center mt-6 text-[0.6rem] text-[var(--muted)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          By signing in, you agree to our{" "}
          <Link
            href="/terms"
            className="underline hover:text-[var(--muted2)]"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline hover:text-[var(--muted2)]"
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </main>
  );
}
