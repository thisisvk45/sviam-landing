"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { IconBuilding, IconArrowLeft, IconCheck, IconBrain, IconUsers, IconChartBar, IconVideo } from "@tabler/icons-react";

const UPCOMING_FEATURES = [
  { icon: <IconBrain size={18} />, title: "AI-Powered Screening", desc: "Auto-rank candidates by fit, skills, and culture match" },
  { icon: <IconVideo size={18} />, title: "AI Interviews", desc: "Automated first-round technical and behavioral interviews" },
  { icon: <IconUsers size={18} />, title: "Talent Pipeline", desc: "Track candidates from application to offer in one place" },
  { icon: <IconChartBar size={18} />, title: "Hiring Analytics", desc: "Time-to-hire, source quality, and diversity metrics" },
];

export default function CompanyComingSoon() {
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const router = useRouter();

  const supabase = useMemo(
    () => createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ),
    [],
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserEmail(data.session.user.email || "");
        const meta = data.session.user.user_metadata;
        setUserName(meta?.full_name || meta?.name || "");
      }
    });
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Clear cached dashboard state so landing page shows fresh
    try { sessionStorage.removeItem("sviam_dashboard"); } catch { /* ignore */ }
    try { sessionStorage.removeItem("sviam-fork"); } catch { /* ignore */ }
    try { localStorage.removeItem("sviam-role"); } catch { /* ignore */ }
    router.push("/");
  };

  const firstName = userName.split(" ")[0] || "";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16" style={{ background: "var(--bg)" }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 20%, rgba(139,92,246,0.05) 0%, transparent 60%)",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-lg w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
            <IconBuilding size={30} style={{ color: "var(--teal)" }} />
          </div>

          <h1 className="text-[var(--text)] mb-3" style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
            fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.15,
          }}>
            {firstName ? `Thanks, ${firstName}!` : "You\u2019re on the list!"}
          </h1>

          <p className="text-[var(--muted2)] text-sm max-w-sm mx-auto" style={{
            fontFamily: "var(--font-dm-sans)", fontWeight: 300, lineHeight: 1.6,
          }}>
            Company features are launching soon. We&apos;ll notify you
            {userEmail ? <> at <span className="text-[var(--text)] font-medium">{userEmail}</span></> : ""} as soon as they&apos;re ready.
          </p>
        </div>

        {/* Confirmed badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-[14px] mb-8"
          style={{ background: "rgba(0,153,153,0.08)", border: "1px solid rgba(0,153,153,0.2)" }}
        >
          <div className="flex items-center justify-center gap-2">
            <IconCheck size={18} color="#009999" />
            <p className="text-sm font-medium" style={{ color: "#009999", fontFamily: "var(--font-dm-sans)" }}>
              You&apos;re registered for early access
            </p>
          </div>
        </motion.div>

        {/* Upcoming features */}
        <div className="p-5 rounded-[16px] mb-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-[0.6rem] uppercase tracking-wider text-[var(--muted)] mb-4" style={{ fontFamily: "var(--font-dm-mono)" }}>
            What&apos;s coming
          </p>
          <div className="grid grid-cols-2 gap-3">
            {UPCOMING_FEATURES.map((f) => (
              <div key={f.title} className="flex gap-2.5">
                <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(99,102,241,0.08)", color: "var(--teal)" }}>
                  {f.icon}
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--text)] mb-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>{f.title}</p>
                  <p className="text-[0.6rem] text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center">
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted2)] hover:text-[var(--text)] transition-colors"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            <IconArrowLeft size={14} /> Back to home
          </button>
        </div>
      </motion.div>
    </main>
  );
}
