"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  IconMapPin,
  IconBriefcase,
  IconBrandLinkedin,
  IconBrandGithub,
  IconExternalLink,
} from "@tabler/icons-react";
import { getPublicProfile } from "@/lib/api";
import type { PublicProfile } from "@/lib/api";

export default function PublicProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPublicProfile(slug);
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Profile not found");
      }
      finally { setLoading(false); }
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="animate-pulse space-y-4 w-full max-w-md px-6">
          <div className="h-20 w-20 rounded-full mx-auto" style={{ background: "var(--surface)" }} />
          <div className="h-8 rounded w-48 mx-auto" style={{ background: "var(--surface)" }} />
          <div className="h-40 rounded-[16px]" style={{ background: "var(--surface)" }} />
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center px-6">
          <p className="text-lg text-[var(--text)] mb-2" style={{ fontFamily: "var(--font-display)" }}>Profile not found</p>
          <p className="text-sm text-[var(--muted2)] mb-4" style={{ fontFamily: "var(--font-dm-sans)" }}>{error}</p>
          <a href="/" className="text-sm font-medium" style={{ color: "var(--accent)", fontFamily: "var(--font-dm-sans)" }}>
            Go to SViam
          </a>
        </div>
      </main>
    );
  }

  const initials = profile.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <main className="min-h-screen py-12" style={{ background: "var(--bg)" }}>
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 70%)",
      }} />

      <div className="relative z-10 max-w-lg mx-auto px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors" style={{ fontFamily: "var(--font-dm-sans)" }}>
            sviam.in
          </a>
        </div>

        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-[20px] text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>

          {/* Avatar */}
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-bold"
            style={{ background: "linear-gradient(135deg, var(--accent), #7c3aed)", color: "white", fontFamily: "var(--font-display)" }}>
            {initials}
          </div>

          <h1 className="text-[var(--text)] text-xl font-bold mb-1" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            {profile.name}
          </h1>

          <div className="flex items-center justify-center gap-3 text-sm text-[var(--muted2)] mb-4" style={{ fontFamily: "var(--font-dm-sans)" }}>
            {profile.city && <span className="flex items-center gap-1"><IconMapPin size={14} />{profile.city}</span>}
            {profile.experience_level && <span className="flex items-center gap-1"><IconBriefcase size={14} />{profile.experience_level}</span>}
          </div>

          {/* Links */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors hover:bg-[var(--surface)]"
                style={{ border: "1px solid var(--border)", color: "var(--muted2)" }}>
                <IconBrandLinkedin size={18} />
              </a>
            )}
            {profile.github && (
              <a href={profile.github} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors hover:bg-[var(--surface)]"
                style={{ border: "1px solid var(--border)", color: "var(--muted2)" }}>
                <IconBrandGithub size={18} />
              </a>
            )}
            {profile.portfolio && (
              <a href={profile.portfolio} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors hover:bg-[var(--surface)]"
                style={{ border: "1px solid var(--border)", color: "var(--muted2)" }}>
                <IconExternalLink size={18} />
              </a>
            )}
          </div>

          {/* Target roles */}
          {profile.target_roles.length > 0 && (
            <div className="mb-4">
              <p className="text-[0.55rem] text-[var(--muted)] uppercase tracking-wider mb-2" style={{ fontFamily: "var(--font-dm-mono)" }}>Looking for</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {profile.target_roles.map((role) => (
                  <span key={role} className="px-2.5 py-1 rounded-full text-xs"
                    style={{ background: "rgba(99,102,241,0.1)", color: "var(--accent)", border: "1px solid rgba(99,102,241,0.2)", fontFamily: "var(--font-dm-sans)" }}>
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {profile.skills.length > 0 && (
            <div>
              <p className="text-[0.55rem] text-[var(--muted)] uppercase tracking-wider mb-2" style={{ fontFamily: "var(--font-dm-mono)" }}>Skills</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {profile.skills.map((skill) => (
                  <span key={skill} className="px-2 py-0.5 rounded-full text-[0.65rem]"
                    style={{ background: "var(--surface)", color: "var(--muted2)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.work_mode && profile.work_mode !== "Any" && (
            <p className="text-xs text-[var(--muted2)] mt-4" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
              Preferred: {profile.work_mode}
            </p>
          )}
        </motion.div>

        {/* Footer */}
        <p className="text-center mt-6 text-[0.6rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
          Powered by <a href="/" className="text-[var(--accent)] hover:underline">SViam</a>
        </p>
      </div>
    </main>
  );
}
