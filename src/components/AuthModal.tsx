"use client";

import { useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { IconBrandGoogle, IconX } from "@tabler/icons-react";

type AuthMode = "signin" | "register";

export default function AuthModal({
  open,
  mode,
  onClose,
  onToggleMode,
}: {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
  onToggleMode: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleGoogle = () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
  };

  const isRegister = mode === "register";

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div
        className="relative w-full max-w-sm rounded-[20px] p-8"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border2)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
          animation: "fadeInUp 0.25s ease forwards",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--surface)]"
          style={{ color: "var(--muted)" }}
        >
          <IconX size={16} />
        </button>

        {/* Logo */}
        <div className="text-center mb-6">
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
          <p
            className="text-[var(--muted2)] mt-1"
            style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300, fontSize: "0.85rem" }}
          >
            {isRegister
              ? "Create your free account"
              : "Welcome back"}
          </p>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          className="w-full py-3.5 rounded-[12px] text-sm font-medium flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mb-4"
          style={{
            background: isRegister ? "var(--teal)" : "var(--surface)",
            border: isRegister ? "none" : "1px solid var(--border)",
            fontFamily: "var(--font-dm-sans)",
            color: isRegister ? "white" : "var(--text)",
            boxShadow: isRegister ? "0 0 24px rgba(0,153,153,0.3)" : "none",
          }}
        >
          <IconBrandGoogle size={18} />
          <span>{isRegister ? "Sign up with Google" : "Sign in with Google"}</span>
        </button>

        {/* Benefits for register */}
        {isRegister && (
          <div className="mb-4 space-y-2">
            {["AI job matching", "One-click apply", "Resume tailoring"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "var(--teal)" }} />
                {item}
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-[0.65rem] text-[var(--muted)] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono)" }}>
            or
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* Toggle */}
        <p className="text-center text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={onToggleMode}
            className="font-medium hover:underline"
            style={{ color: "var(--teal)" }}
          >
            {isRegister ? "Sign in" : "Join free"}
          </button>
        </p>

        {/* Terms */}
        {isRegister && (
          <p
            className="text-center mt-4 text-[0.6rem] text-[var(--muted)]"
            style={{ fontFamily: "var(--font-dm-sans)", lineHeight: 1.5 }}
          >
            By signing up, you agree to our{" "}
            <a href="/terms" className="underline hover:text-[var(--muted2)]">Terms</a> and{" "}
            <a href="/privacy" className="underline hover:text-[var(--muted2)]">Privacy Policy</a>
          </p>
        )}
      </div>
    </div>
  );
}
