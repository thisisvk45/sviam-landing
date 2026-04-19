"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { IconSun, IconMoon, IconMenu2, IconX } from "@tabler/icons-react";

export default function Navbar() {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 60], [0, 0.88]);
  const blur = useTransform(scrollY, [0, 60], [0, 20]);
  const borderOpacity = useTransform(scrollY, [0, 60], [0, 0.07]);
  const reducedMotion = useReducedMotion();

  const [isDark, setIsDark] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // Magnetic hover for CTA button
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const magnetX = useMotionValue(0);
  const magnetY = useMotionValue(0);
  const springX = useSpring(magnetX, { stiffness: 200, damping: 20 });
  const springY = useSpring(magnetY, { stiffness: 200, damping: 20 });

  const handleCtaMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ctaRef.current || reducedMotion) return;
      const rect = ctaRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      magnetX.set(x * 0.3);
      magnetY.set(y * 0.3);
    },
    [reducedMotion, magnetX, magnetY]
  );

  const handleCtaMouseLeave = () => {
    magnetX.set(0);
    magnetY.set(0);
  };

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));

    // Check initial auth state
    supabase.auth.getSession().then(({ data }) => {
      setIsSignedIn(!!data.session);
      if (data.session?.user) {
        const meta = data.session.user.user_metadata;
        setUserName(meta?.full_name || meta?.name || "");
      }
    });

    // Listen for auth state changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session);
      if (session?.user) {
        const meta = session.user.user_metadata;
        setUserName(meta?.full_name || meta?.name || "");
      } else {
        setUserName("");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("sviam-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("sviam-theme", "light");
    }
  };

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-[100] px-6 py-4"
      initial={reducedMotion ? false : { y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
      style={{
        backgroundColor: useTransform(bgOpacity, (v) => `color-mix(in srgb, var(--bg) ${Math.round(v * 100)}%, transparent)`),
        backdropFilter: useTransform(blur, (v) => `blur(${v}px)`),
        borderBottom: useTransform(
          borderOpacity,
          (v) => `1px solid rgba(255,255,255,${v})`
        ),
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" legacyBehavior passHref>
          <motion.a
            className="gradient-text"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
            whileHover={reducedMotion ? {} : { scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            SViam
          </motion.a>
        </Link>

        <div className="flex items-center gap-3">
          {isSignedIn && (
            <>
              <Link
                href="/resume-builder"
                className="text-sm text-[var(--muted2)] hover:text-[var(--text)] transition-colors hidden sm:block"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Resume Builder
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-[var(--muted2)] hover:text-[var(--text)] transition-colors hidden sm:block"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Dashboard
              </Link>
              <Link
                href="/interview-prep"
                className="text-sm text-[var(--muted2)] hover:text-[var(--text)] transition-colors hidden sm:block"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Interview Prep
              </Link>
              <Link
                href="/profile"
                className="text-sm text-[var(--muted2)] hover:text-[var(--text)] transition-colors hidden sm:block"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Profile
              </Link>
            </>
          )}
          <motion.button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors duration-200 hover:bg-[var(--card)]"
            style={{ border: "1px solid var(--border)" }}
            aria-label="Toggle theme"
            whileHover={reducedMotion ? {} : { scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.div
                  key="sun"
                  initial={reducedMotion ? false : { rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.25, type: "spring", stiffness: 300 }}
                >
                  <IconSun size={16} className="text-[var(--muted2)]" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={reducedMotion ? false : { rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.25, type: "spring", stiffness: 300 }}
                >
                  <IconMoon size={16} className="text-[var(--muted2)]" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Mobile menu button — signed-in users only */}
          {isSignedIn && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors duration-200 hover:bg-[var(--card)]"
              style={{ border: "1px solid var(--border)" }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <IconX size={16} className="text-[var(--muted2)]" />
              ) : (
                <IconMenu2 size={16} className="text-[var(--muted2)]" />
              )}
            </button>
          )}

          {isSignedIn ? (
            <Link href="/dashboard" legacyBehavior passHref>
              <motion.a
                ref={ctaRef}
                className="px-5 py-2 text-sm font-medium rounded-[10px] text-white relative overflow-hidden"
                style={{
                  background: "var(--accent)",
                  boxShadow: "0 0 24px rgba(108,99,255,0.35)",
                  fontFamily: "var(--font-dm-sans)",
                  x: springX,
                  y: springY,
                }}
                onMouseMove={handleCtaMouseMove}
                onMouseLeave={handleCtaMouseLeave}
                whileHover={reducedMotion ? {} : { scale: 1.05, boxShadow: "0 0 40px rgba(108,99,255,0.6)" }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.span
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)",
                  }}
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />
                <span className="relative z-10">
                  {userName ? `Hi, ${userName.split(" ")[0]}` : "Dashboard"}
                </span>
              </motion.a>
            </Link>
          ) : (
            <motion.button
              onClick={() => {
                // Persist the fork choice (seeker/hirer) so we know the role after OAuth redirect
                try {
                  const fork = sessionStorage.getItem("sviam-fork");
                  if (fork) localStorage.setItem("sviam-role", fork);
                } catch { /* ignore */ }
                supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  },
                });
              }}
              className="px-5 py-2 text-sm font-medium rounded-[10px] text-white relative overflow-hidden"
              style={{
                background: "var(--accent)",
                boxShadow: "0 0 24px rgba(108,99,255,0.35)",
                fontFamily: "var(--font-dm-sans)",
              }}
              whileHover={reducedMotion ? {} : { scale: 1.05, boxShadow: "0 0 40px rgba(108,99,255,0.6)" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="relative z-10">Sign In</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileMenuOpen && isSignedIn && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden overflow-hidden mt-2"
          >
            <div
              className="flex flex-col gap-1 px-2 py-2 rounded-[12px]"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              {[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/resume-builder", label: "Resume Builder" },
                { href: "/interview-prep", label: "Interview Prep" },
                { href: "/profile", label: "Profile" },
              ].map((navLink) => (
                <Link
                  key={navLink.href}
                  href={navLink.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-[8px] text-sm text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {navLink.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
