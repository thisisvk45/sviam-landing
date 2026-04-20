"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { IconMenu2, IconX, IconSun, IconMoon } from "@tabler/icons-react";

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // Scroll listener for glass effect
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Theme persistence
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("sviam-theme", next ? "dark" : "light");
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsSignedIn(!!data.session);
      if (data.session?.user) {
        const meta = data.session.user.user_metadata;
        setUserName(meta?.full_name || meta?.name || "");
        setUserAvatar(meta?.avatar_url || meta?.picture || "");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session);
      if (session?.user) {
        const meta = session.user.user_metadata;
        setUserName(meta?.full_name || meta?.name || "");
        setUserAvatar(meta?.avatar_url || meta?.picture || "");
      } else {
        setUserName("");
        setUserAvatar("");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAvatarDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAvatarDropdownOpen(false);
    window.location.href = "/";
  };

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-[100] px-6 py-4 navbar-glass ${scrolled ? "scrolled" : ""}`}
      style={{
        opacity: 0,
        animation: "fadeInUp 0.6s cubic-bezier(0.33,1,0.68,1) forwards",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/">
          <span
            className="gradient-text cursor-pointer hover-scale inline-block"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              transition: "transform 0.15s ease",
            }}
          >
            SViam
          </span>
        </Link>

        {/* Center nav links — signed-in only, desktop */}
        {isSignedIn && (
          <div className="hidden md:flex items-center gap-6">
            {[
              { href: "/dashboard", label: "Dashboard" },
              { href: "/resume-builder", label: "Resume Builder" },
              { href: "/profile", label: "Profile" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[var(--text)] hover:text-[var(--teal)] transition-colors"
                style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 500 }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors duration-200 hover:bg-[var(--card)]"
            style={{ border: "1px solid var(--border)" }}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <IconSun size={16} className="text-[var(--muted2)]" />
            ) : (
              <IconMoon size={16} className="text-[var(--muted2)]" />
            )}
          </button>

          {/* Mobile menu button — signed-in users only */}
          {isSignedIn && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors duration-200 hover:bg-[var(--card)]"
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
            /* Avatar with dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
                className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                style={{
                  background: userAvatar ? "transparent" : "linear-gradient(135deg, var(--teal), var(--teal))",
                  border: "2px solid var(--border2)",
                }}
              >
                {userAvatar ? (
                  <Image src={userAvatar} alt={userName} width={36} height={36} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
                ) : (
                  <span className="text-xs font-bold text-white">{initials}</span>
                )}
              </button>

              {avatarDropdownOpen && (
                <div
                  className="absolute right-0 top-12 w-48 rounded-xl overflow-hidden shadow-xl dropdown-enter"
                  style={{ background: "var(--card)", border: "1px solid var(--border2)" }}
                >
                  {/* User info */}
                  <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <p className="text-sm font-medium text-[var(--text)] truncate" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      {userName || "User"}
                    </p>
                  </div>
                  {[
                    { href: "/dashboard", label: "Dashboard" },
                    { href: "/profile", label: "Profile" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setAvatarDropdownOpen(false)}
                      className="block px-4 py-2.5 text-sm text-[var(--muted2)] hover:text-[var(--text)] hover:bg-white/[0.03] transition-colors"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/[0.03] transition-colors"
                    style={{ fontFamily: "var(--font-dm-sans)", borderTop: "1px solid var(--border)" }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Auth CTAs for guests */
            <>
              <Link
                href="/company"
                className="px-4 py-2 text-sm font-medium rounded-[10px] transition-colors hover:text-[var(--text)]"
                style={{
                  color: "var(--muted2)",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                For Companies
              </Link>
              <Link
                href="/signin"
                className="px-4 py-2 text-sm font-medium rounded-[10px] transition-colors hover:text-[var(--text)]"
                style={{
                  color: "var(--muted2)",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 text-sm font-medium rounded-[10px] text-white relative overflow-hidden hover-scale hover-glow inline-block"
                style={{
                  background: "var(--teal)",
                  boxShadow: "0 0 24px rgba(0,153,153,0.3)",
                  fontFamily: "var(--font-dm-sans)",
                  transition: "transform 0.15s ease, box-shadow 0.2s ease",
                }}
              >
                <span className="relative z-10">Join Now</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && isSignedIn && (
        <div className="md:hidden mt-2 mobile-menu-enter">
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
            <button
              onClick={handleSignOut}
              className="px-3 py-2 rounded-[8px] text-sm text-red-400 hover:text-red-300 hover:bg-[var(--surface)] transition-colors text-left"
              style={{ fontFamily: "var(--font-dm-sans)", borderTop: "1px solid var(--border)" }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
