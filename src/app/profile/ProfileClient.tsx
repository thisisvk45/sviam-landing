"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  IconArrowLeft,
  IconCheck,
  IconLoader2,
  IconX,
  IconPlus,
  IconSparkles,
} from "@tabler/icons-react";
import { getProfile, updateProfile, deleteAccount, getBillingStatus, getBillingUsage } from "@/lib/api";
import { createBrowserClient } from "@supabase/ssr";
import type { AtsProfile, AutoApplySettings, SubscriptionStatus, UsageInfo } from "@/lib/api";
import UpgradePrompt from "@/components/UpgradePrompt";

const INDIAN_CITIES = [
  "Bangalore", "Mumbai", "Delhi NCR", "Hyderabad", "Chennai",
  "Pune", "Kolkata", "Ahmedabad", "Noida", "Gurgaon", "Jaipur",
];
const EXP_LEVELS = [
  { value: "Fresher", label: "Fresher (0-1 years)" },
  { value: "Junior", label: "Junior (1-3 years)" },
  { value: "Mid", label: "Mid-level (3-6 years)" },
  { value: "Senior", label: "Senior (6-10 years)" },
  { value: "Lead", label: "Lead / Staff (10+ years)" },
];
const WORK_AUTH_OPTIONS = ["Citizen", "Permanent Resident", "H-1B", "F-1 OPT", "F-1 CPT", "L-1", "Other"];
const NOTICE_OPTIONS = ["Immediate", "15 days", "30 days", "60 days", "90 days"];
const WORK_MODE_OPTIONS = ["Remote", "Hybrid", "Onsite"];

export default function ProfileClient({ token, email }: { token: string; email: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Personal
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");

  // ATS Profile
  const [ats, setAts] = useState<AtsProfile>({
    linkedin: "", github: "", portfolio: "",
    work_authorization: "", current_ctc: "", expected_ctc: "",
    notice_period: "", dob: "", gender: "", full_address: "",
    languages: [], references: [],
  });

  // Auto-Apply Settings
  const [autoApply, setAutoApply] = useState<AutoApplySettings>({
    enabled: false, max_per_day: 10, min_match_score: 60,
    excluded_companies: [], preferred_work_modes: [],
    always_include_cover_letter: true,
  });

  // Job Alerts
  const [alerts, setAlerts] = useState<{ role: string; city: string; work_mode: string; min_score: number }[]>([]);
  const [newAlert, setNewAlert] = useState({ role: "", city: "", work_mode: "Any", min_score: 60 });

  // Public profile slug
  const [publicSlug, setPublicSlug] = useState("");

  // Email Notifications
  const [emailPrefs, setEmailPrefs] = useState({
    new_matches: true,
    application_updates: true,
    weekly_digest: true,
    frequency: "daily" as "instant" | "daily" | "weekly",
  });

  // Tag inputs
  const [langInput, setLangInput] = useState("");
  const [excludeInput, setExcludeInput] = useState("");

  // Billing
  const [billingStatus, setBillingStatus] = useState<SubscriptionStatus>({ tier: "free", subscription_id: null, valid_until: null });
  const [billingUsage, setBillingUsage] = useState<Record<string, UsageInfo>>({});
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const load = async () => {
      console.time("profile-load");
      try {
        const profile = await getProfile(token);
        setName(profile.name || "");
        setPhone(profile.phone || "");
        setCity(profile.city || "");
        setExperienceLevel(profile.experience_level || "");

        const prefs = (profile.job_preferences || {}) as Record<string, unknown>;
        const atsData = (prefs.ats_profile || {}) as Partial<AtsProfile>;
        setAts({
          linkedin: atsData.linkedin || "",
          github: atsData.github || "",
          portfolio: atsData.portfolio || "",
          work_authorization: atsData.work_authorization || "",
          current_ctc: atsData.current_ctc || "",
          expected_ctc: atsData.expected_ctc || "",
          notice_period: atsData.notice_period || "",
          dob: atsData.dob || "",
          gender: atsData.gender || "",
          full_address: atsData.full_address || "",
          languages: atsData.languages || [],
          references: atsData.references || [],
        });

        const alertsData = (prefs.alerts || []) as typeof alerts;
        setAlerts(alertsData);
        setPublicSlug((prefs.public_slug as string) || "");

        const emailData = (prefs.email_notifications || {}) as Partial<typeof emailPrefs>;
        setEmailPrefs({
          new_matches: emailData.new_matches ?? true,
          application_updates: emailData.application_updates ?? true,
          weekly_digest: emailData.weekly_digest ?? true,
          frequency: emailData.frequency || "daily",
        });

        const autoData = (prefs.auto_apply || {}) as Partial<AutoApplySettings>;
        setAutoApply({
          enabled: autoData.enabled || false,
          max_per_day: autoData.max_per_day || 10,
          min_match_score: autoData.min_match_score || 60,
          excluded_companies: autoData.excluded_companies || [],
          preferred_work_modes: autoData.preferred_work_modes || [],
          always_include_cover_letter: autoData.always_include_cover_letter ?? true,
        });
      } catch { /* new user */ }
      finally { setLoading(false); console.timeEnd("profile-load"); }
    };
    load();
    // Fetch billing info in parallel
    Promise.all([
      getBillingStatus(token).then(setBillingStatus),
      getBillingUsage(token).then(setBillingUsage),
    ]).catch(() => {});
  }, [token]);

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      // Fetch existing preferences to merge
      let existing: Record<string, unknown> = {};
      try {
        const profile = await getProfile(token);
        if (profile.job_preferences && typeof profile.job_preferences === "object") {
          existing = profile.job_preferences as Record<string, unknown>;
        }
      } catch { /* ignore */ }

      await updateProfile(token, {
        name, phone, city, experience_level: experienceLevel,
        job_preferences: {
          ...existing,
          ats_profile: ats,
          auto_apply: autoApply,
          alerts,
          email_notifications: emailPrefs,
          public_slug: publicSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
    finally { setSaving(false); }
  };

  const addTag = (list: string[], value: string, setter: (v: string[]) => void) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) setter([...list, trimmed]);
  };

  const removeTag = (list: string[], value: string, setter: (v: string[]) => void) => {
    setter(list.filter((t) => t !== value));
  };

  if (loading) {
    return (
      <main className="min-h-screen pt-20" style={{ background: "var(--bg)" }}>
        <div className="max-w-3xl mx-auto px-6 py-8 animate-pulse space-y-4">
          <div className="h-8 rounded w-48" style={{ background: "var(--surface)" }} />
          <div className="h-64 rounded-[16px]" style={{ background: "var(--surface)" }} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-14" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 py-2.5 flex items-center justify-between"
        style={{ background: "rgba(10,10,14,0.88)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1 text-sm text-[var(--muted2)] hover:text-[var(--text)] transition-colors"
            style={{ fontFamily: "var(--font-dm-sans)" }}>
            <IconArrowLeft size={14} /> Dashboard
          </Link>
          <span className="text-sm font-semibold text-[var(--text)]" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            Profile & Settings
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/resume-builder" className="text-xs text-[var(--muted2)] hover:text-[var(--text)] transition-colors hidden sm:block"
            style={{ fontFamily: "var(--font-dm-sans)" }}>
            Resume Builder
          </Link>
          <span className="text-xs text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>{email}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        {/* ── Section 1: Personal ── */}
        <Card title="Personal Information">
          <div className="grid sm:grid-cols-2 gap-3.5">
            <Field label="Full Name">
              <Input value={name} onChange={setName} />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={setPhone} placeholder="+91 98765 43210" />
            </Field>
            <Field label="City">
              <select value={INDIAN_CITIES.includes(city) ? city : city ? "__other" : ""}
                onChange={(e) => setCity(e.target.value === "__other" ? "" : e.target.value)}
                className="w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                <option value="">Select city</option>
                {INDIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__other">Other</option>
              </select>
              {!INDIAN_CITIES.includes(city) && city !== "" && (
                <Input value={city} onChange={setCity} placeholder="Type your city" className="mt-2" />
              )}
            </Field>
            <Field label="Experience Level">
              <select value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                <option value="">Select level</option>
                {EXP_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </Field>
          </div>
        </Card>

        {/* ── Section 2: Links ── */}
        <Card title="Links">
          <div className="grid sm:grid-cols-2 gap-3.5">
            <Field label="LinkedIn URL">
              <Input value={ats.linkedin} onChange={(v) => setAts({ ...ats, linkedin: v })} placeholder="https://linkedin.com/in/..." />
            </Field>
            <Field label="GitHub URL">
              <Input value={ats.github} onChange={(v) => setAts({ ...ats, github: v })} placeholder="https://github.com/..." />
            </Field>
            <Field label="Portfolio / Website" className="sm:col-span-2">
              <Input value={ats.portfolio} onChange={(v) => setAts({ ...ats, portfolio: v })} placeholder="https://..." />
            </Field>
            <Field label="Public Profile URL" className="sm:col-span-2">
              <div className="flex items-center gap-0">
                <span className="px-3 py-2 rounded-l-[8px] text-xs text-[var(--muted)]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRight: "none", fontFamily: "var(--font-dm-mono)" }}>
                  sviam.in/u/
                </span>
                <input value={publicSlug} onChange={(e) => setPublicSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  placeholder="your-name"
                  className="flex-1 px-3 py-2 rounded-r-[8px] text-sm text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--teal)]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }} />
              </div>
              {publicSlug && (
                <p className="text-[0.6rem] text-[var(--muted)] mt-1" style={{ fontFamily: "var(--font-dm-mono)" }}>
                  Your profile will be visible at sviam.in/u/{publicSlug}
                </p>
              )}
            </Field>
          </div>
        </Card>

        {/* ── Section 3: Work & Compensation ── */}
        <Card title="Work & Compensation">
          <div className="grid sm:grid-cols-2 gap-3.5">
            <Field label="Work Authorization">
              <select value={ats.work_authorization}
                onChange={(e) => setAts({ ...ats, work_authorization: e.target.value })}
                className="w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                <option value="">Select</option>
                {WORK_AUTH_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Notice Period">
              <select value={ats.notice_period}
                onChange={(e) => setAts({ ...ats, notice_period: e.target.value })}
                className="w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                <option value="">Select</option>
                {NOTICE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Current CTC (LPA)">
              <Input value={ats.current_ctc} onChange={(v) => setAts({ ...ats, current_ctc: v })} placeholder="e.g. 8" />
            </Field>
            <Field label="Expected CTC (LPA)">
              <Input value={ats.expected_ctc} onChange={(v) => setAts({ ...ats, expected_ctc: v })} placeholder="e.g. 12" />
            </Field>
          </div>
        </Card>

        {/* ── Section 4: Additional ── */}
        <Card title="Additional Details">
          <div className="grid sm:grid-cols-2 gap-3.5">
            <Field label="Date of Birth">
              <Input value={ats.dob} onChange={(v) => setAts({ ...ats, dob: v })} placeholder="DD/MM/YYYY" />
            </Field>
            <Field label="Gender">
              <select value={ats.gender}
                onChange={(e) => setAts({ ...ats, gender: e.target.value })}
                className="w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Full Address" className="sm:col-span-2">
              <Input value={ats.full_address} onChange={(v) => setAts({ ...ats, full_address: v })} placeholder="Street, City, State, PIN" />
            </Field>
            <Field label="Languages" className="sm:col-span-2">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {ats.languages.map((lang) => (
                  <span key={lang} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem]"
                    style={{ background: "rgba(99,102,241,0.1)", color: "var(--teal)", border: "1px solid rgba(99,102,241,0.2)", fontFamily: "var(--font-dm-sans)" }}>
                    {lang}
                    <button onClick={() => removeTag(ats.languages, lang, (v) => setAts({ ...ats, languages: v }))} className="hover:text-[#ef4444]">
                      <IconX size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={langInput} onChange={setLangInput} placeholder="Add language"
                  onKeyDown={(e) => { if (e.key === "Enter") { addTag(ats.languages, langInput, (v) => setAts({ ...ats, languages: v })); setLangInput(""); } }} />
                <button onClick={() => { addTag(ats.languages, langInput, (v) => setAts({ ...ats, languages: v })); setLangInput(""); }}
                  className="px-2 rounded-[8px]" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted2)" }}>
                  <IconPlus size={14} />
                </button>
              </div>
            </Field>
          </div>
        </Card>

        {/* ── Section 5: Auto-Apply Settings ── */}
        <Card title="Auto-Apply Settings" accent>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-0.5 rounded-full text-[0.6rem] font-semibold uppercase tracking-wider"
              style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", fontFamily: "var(--font-dm-mono)" }}>
              Coming Soon
            </span>
            <p className="text-xs text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
              Auto-apply is in development. Set your preferences now so they are ready when it launches.
            </p>
          </div>

          <div className="space-y-4">
            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>Enable Auto-Apply</label>
              <button onClick={() => setAutoApply({ ...autoApply, enabled: !autoApply.enabled })}
                className="w-11 h-6 rounded-full relative transition-colors"
                style={{ background: autoApply.enabled ? "var(--teal)" : "var(--surface)", border: "1px solid var(--border)" }}>
                <motion.div className="w-4 h-4 rounded-full bg-white absolute top-0.5"
                  animate={{ left: autoApply.enabled ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
              </button>
            </div>

            {/* Max per day */}
            <Field label={`Max Applications Per Day: ${autoApply.max_per_day}`}>
              <input type="range" min={1} max={50} value={autoApply.max_per_day}
                onChange={(e) => setAutoApply({ ...autoApply, max_per_day: Number(e.target.value) })}
                className="w-full accent-[var(--teal)]" />
              <div className="flex justify-between text-[0.55rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                <span>1</span><span>50</span>
              </div>
            </Field>

            {/* Min match score */}
            <Field label={`Minimum Match Score: ${autoApply.min_match_score}%`}>
              <input type="range" min={30} max={95} step={5} value={autoApply.min_match_score}
                onChange={(e) => setAutoApply({ ...autoApply, min_match_score: Number(e.target.value) })}
                className="w-full accent-[var(--teal)]" />
              <div className="flex justify-between text-[0.55rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>
                <span>30%</span><span>95%</span>
              </div>
            </Field>

            {/* Preferred work modes */}
            <Field label="Preferred Work Modes">
              <div className="flex gap-2">
                {WORK_MODE_OPTIONS.map((m) => {
                  const selected = autoApply.preferred_work_modes.includes(m);
                  return (
                    <button key={m} onClick={() => {
                      setAutoApply({ ...autoApply,
                        preferred_work_modes: selected
                          ? autoApply.preferred_work_modes.filter((x) => x !== m)
                          : [...autoApply.preferred_work_modes, m],
                      });
                    }}
                      className="px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all"
                      style={{
                        background: selected ? "rgba(99,102,241,0.12)" : "var(--surface)",
                        border: selected ? "1px solid rgba(99,102,241,0.3)" : "1px solid var(--border)",
                        color: selected ? "var(--teal)" : "var(--muted2)",
                        fontFamily: "var(--font-dm-sans)",
                      }}>
                      {selected && <IconCheck size={10} className="inline mr-1" />}{m}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Excluded companies */}
            <Field label="Excluded Companies">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {autoApply.excluded_companies.map((c) => (
                  <span key={c} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem]"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", fontFamily: "var(--font-dm-sans)" }}>
                    {c}
                    <button onClick={() => removeTag(autoApply.excluded_companies, c, (v) => setAutoApply({ ...autoApply, excluded_companies: v }))} className="hover:text-[#ef4444]">
                      <IconX size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={excludeInput} onChange={setExcludeInput} placeholder="Company name"
                  onKeyDown={(e) => { if (e.key === "Enter") { addTag(autoApply.excluded_companies, excludeInput, (v) => setAutoApply({ ...autoApply, excluded_companies: v })); setExcludeInput(""); } }} />
                <button onClick={() => { addTag(autoApply.excluded_companies, excludeInput, (v) => setAutoApply({ ...autoApply, excluded_companies: v })); setExcludeInput(""); }}
                  className="px-2 rounded-[8px]" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted2)" }}>
                  <IconPlus size={14} />
                </button>
              </div>
            </Field>

            {/* Always include cover letter */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>Always Include Cover Letter</label>
              <button onClick={() => setAutoApply({ ...autoApply, always_include_cover_letter: !autoApply.always_include_cover_letter })}
                className="w-11 h-6 rounded-full relative transition-colors"
                style={{ background: autoApply.always_include_cover_letter ? "var(--teal)" : "var(--surface)", border: "1px solid var(--border)" }}>
                <motion.div className="w-4 h-4 rounded-full bg-white absolute top-0.5"
                  animate={{ left: autoApply.always_include_cover_letter ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
              </button>
            </div>
          </div>
        </Card>

        {/* ── Section 6: Job Alerts ── */}
        <Card title="Job Alerts">
          <p className="text-xs text-[var(--muted2)] mb-4" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            Get notified when new jobs match your criteria.
          </p>

          {alerts.length > 0 && (
            <div className="space-y-2 mb-4">
              {alerts.map((alert, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-[8px]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--text)] truncate" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      {alert.role || "Any role"} {alert.city ? `in ${alert.city}` : ""} {alert.work_mode !== "Any" ? `(${alert.work_mode})` : ""}
                    </p>
                    <p className="text-[0.6rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-mono)" }}>Min score: {alert.min_score}%</p>
                  </div>
                  <button onClick={() => setAlerts(alerts.filter((_, j) => j !== i))}
                    className="p-1 hover:text-[#ef4444] transition-colors" style={{ color: "var(--muted)" }}>
                    <IconX size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-2.5 mb-3">
            <Field label="Role / Title">
              <Input value={newAlert.role} onChange={(v) => setNewAlert({ ...newAlert, role: v })} placeholder="e.g. Frontend Developer" />
            </Field>
            <Field label="City">
              <select value={newAlert.city}
                onChange={(e) => setNewAlert({ ...newAlert, city: e.target.value })}
                className="w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                <option value="">Any City</option>
                {INDIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Work Mode">
              <select value={newAlert.work_mode}
                onChange={(e) => setNewAlert({ ...newAlert, work_mode: e.target.value })}
                className="w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }}>
                <option value="Any">Any</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
            </Field>
            <Field label={`Min Score: ${newAlert.min_score}%`}>
              <input type="range" min={30} max={95} step={5} value={newAlert.min_score}
                onChange={(e) => setNewAlert({ ...newAlert, min_score: Number(e.target.value) })}
                className="w-full accent-[var(--teal)]" />
            </Field>
          </div>
          <button onClick={() => {
            if (newAlert.role.trim()) {
              setAlerts([...alerts, { ...newAlert, role: newAlert.role.trim() }]);
              setNewAlert({ role: "", city: "", work_mode: "Any", min_score: 60 });
            }
          }}
            className="px-4 py-2 rounded-[8px] text-xs font-medium flex items-center gap-1"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted2)", fontFamily: "var(--font-dm-sans)" }}>
            <IconPlus size={12} /> Add Alert
          </button>
        </Card>

        {/* ── Section 7: Email Notifications ── */}
        <Card title="Email Notifications">
          <div className="space-y-3">
            {([
              { key: "new_matches" as const, label: "New job matches", desc: "When new jobs match your alerts" },
              { key: "application_updates" as const, label: "Application updates", desc: "Status changes on your applications" },
              { key: "weekly_digest" as const, label: "Weekly digest", desc: "Summary of your job search activity" },
            ]).map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{label}</p>
                  <p className="text-[0.6rem] text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>{desc}</p>
                </div>
                <button onClick={() => setEmailPrefs({ ...emailPrefs, [key]: !emailPrefs[key] })}
                  className="w-11 h-6 rounded-full relative transition-colors"
                  style={{ background: emailPrefs[key] ? "var(--teal)" : "var(--surface)", border: "1px solid var(--border)" }}>
                  <motion.div className="w-4 h-4 rounded-full bg-white absolute top-0.5"
                    animate={{ left: emailPrefs[key] ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                </button>
              </div>
            ))}

            <div className="pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              <Field label="Email Frequency">
                <div className="flex gap-2">
                  {(["instant", "daily", "weekly"] as const).map((f) => (
                    <button key={f} onClick={() => setEmailPrefs({ ...emailPrefs, frequency: f })}
                      className="px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all capitalize"
                      style={{
                        background: emailPrefs.frequency === f ? "rgba(99,102,241,0.12)" : "var(--surface)",
                        border: emailPrefs.frequency === f ? "1px solid rgba(99,102,241,0.3)" : "1px solid var(--border)",
                        color: emailPrefs.frequency === f ? "var(--teal)" : "var(--muted2)",
                        fontFamily: "var(--font-dm-sans)",
                      }}>
                      {f}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </div>
        </Card>

        {/* ── Save button ── */}
        {error && (
          <p className="text-sm text-center" style={{ color: "#ef4444", fontFamily: "var(--font-dm-sans)" }}>{error}</p>
        )}
        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-[12px] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg, var(--teal), #7c3aed)", fontFamily: "var(--font-dm-sans)", boxShadow: "0 4px 20px rgba(0,153,153,0.3)" }}>
          {saving ? <IconLoader2 size={16} className="animate-spin" /> : saved ? <><IconCheck size={16} /> Saved!</> : "Save Profile"}
        </button>

        {/* ── Plan & Billing ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-[16px] mt-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-[8px] flex items-center justify-center"
              style={{ background: "rgba(0,153,153,0.1)", color: "var(--teal)" }}
            >
              <IconSparkles size={14} />
            </div>
            <h2
              className="text-[var(--text)] text-base font-semibold"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              Plan & Billing
            </h2>
          </div>

          {/* Current Plan */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: billingStatus.tier === "free"
                  ? "var(--surface)"
                  : billingStatus.tier === "unlimited"
                    ? "linear-gradient(135deg, rgba(0,153,153,0.15), rgba(0,153,153,0.08))"
                    : "rgba(0,153,153,0.1)",
                border: billingStatus.tier === "free"
                  ? "1px solid var(--border)"
                  : "1px solid rgba(0,153,153,0.3)",
                color: billingStatus.tier === "free" ? "var(--muted2)" : "var(--teal)",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              {billingStatus.tier === "free" ? "Free Plan" : billingStatus.tier === "pro" ? "Pro Plan" : "Unlimited Plan"}
            </span>
            {billingStatus.valid_until && (
              <span
                className="text-[0.65rem] text-[var(--muted)]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Valid until {new Date(billingStatus.valid_until).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>

          {/* Usage Stats */}
          {billingStatus.tier === "free" && (
            <div className="space-y-2.5 mb-4">
              {[
                { key: "tailor", label: "Resume Tailors" },
                { key: "cover_letter", label: "Cover Letters" },
                { key: "auto_apply", label: "Auto-Applies" },
              ].map(({ key, label }) => {
                const usage = billingUsage[key];
                const used = usage?.used ?? 0;
                const limit = usage?.limit ?? 3;
                const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs text-[var(--muted2)]"
                        style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
                      >
                        {label}
                      </span>
                      <span
                        className="text-xs"
                        style={{
                          fontFamily: "var(--font-dm-mono)",
                          color: pct >= 100 ? "#ef4444" : "var(--muted)",
                        }}
                      >
                        {used}/{limit}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--surface)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 100 ? "#ef4444" : "var(--teal)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {billingUsage[Object.keys(billingUsage)[0]]?.resets && (
                <p
                  className="text-[0.6rem] text-[var(--muted)] mt-1"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Resets {new Date(billingUsage[Object.keys(billingUsage)[0]].resets as string).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              )}
            </div>
          )}

          {billingStatus.tier !== "unlimited" && (
            <button
              onClick={() => setShowUpgrade(true)}
              className="px-4 py-2 rounded-[8px] text-xs font-medium text-white transition-all hover:brightness-110"
              style={{
                background: "var(--teal)",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              {billingStatus.tier === "free" ? "Upgrade to Pro" : "Upgrade to Unlimited"}
            </button>
          )}
        </motion.div>

        {/* ── Danger Zone ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-[16px] mt-4"
          style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <h2 className="text-[var(--text)] text-base font-semibold mb-1" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            Danger Zone
          </h2>
          <p className="text-xs text-[var(--muted2)] mb-4" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-[8px] text-xs font-medium transition-all hover:brightness-110"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontFamily: "var(--font-dm-sans)" }}>
            Delete Account
          </button>
        </motion.div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <>
          <div className="fixed inset-0 z-[60]" style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); setDeleteError(""); }} />
          <div className="fixed inset-0 z-[61] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm p-6 rounded-[20px]"
              style={{ background: "var(--card)", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              <h3 className="text-[var(--text)] text-base font-semibold mb-2" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                Delete your account?
              </h3>
              <p className="text-xs text-[var(--muted2)] mb-4 leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                This will permanently delete your profile, resumes, applications, saved jobs, and all associated data. You cannot undo this.
              </p>
              <p className="text-xs text-[var(--muted)] mb-2" style={{ fontFamily: "var(--font-dm-sans)" }}>
                Type <strong className="text-[var(--text)]">DELETE</strong> to confirm:
              </p>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none focus:ring-1 focus:ring-[#ef4444] mb-3"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-mono)" }}
              />
              {deleteError && (
                <p className="text-xs mb-3" style={{ color: "#ef4444", fontFamily: "var(--font-dm-sans)" }}>{deleteError}</p>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); setDeleteError(""); }}
                  className="flex-1 py-2.5 rounded-[10px] text-xs font-medium"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted2)", fontFamily: "var(--font-dm-sans)" }}>
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (deleteConfirm !== "DELETE") { setDeleteError("Please type DELETE to confirm."); return; }
                    setDeleting(true);
                    setDeleteError("");
                    try {
                      await deleteAccount(token);
                      try { sessionStorage.clear(); } catch { /* ignore */ }
                      try { localStorage.removeItem("sviam-role"); localStorage.removeItem("sviam_dismissed"); } catch { /* ignore */ }
                      const supabase = createBrowserClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                      );
                      await supabase.auth.signOut();
                      window.location.href = "/";
                    } catch (err) {
                      setDeleteError(err instanceof Error ? err.message : "Failed to delete account");
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting || deleteConfirm !== "DELETE"}
                  className="flex-1 py-2.5 rounded-[10px] text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "#ef4444", fontFamily: "var(--font-dm-sans)" }}>
                  {deleting ? "Deleting..." : "Delete Forever"}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Upgrade Modal */}
      <UpgradePrompt
        show={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature={billingStatus.tier === "free" ? "AI features" : "unlimited access"}
        limit={billingStatus.tier === "free" ? "3 per month" : "100 per month"}
        onUpgraded={() => {
          Promise.all([
            getBillingStatus(token).then(setBillingStatus),
            getBillingUsage(token).then(setBillingUsage),
          ]).catch(() => {});
        }}
      />
    </main>
  );
}

/* ─── Sub-components ─── */
function Card({ title, accent, children }: { title: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-[16px]"
      style={{
        background: accent ? "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))" : "var(--card)",
        border: accent ? "1px solid rgba(99,102,241,0.15)" : "1px solid var(--border)",
      }}>
      <h2 className="text-[var(--text)] text-base font-semibold mb-4" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="text-[0.55rem] text-[var(--muted)] block mb-1 tracking-[0.12em] uppercase" style={{ fontFamily: "var(--font-dm-mono)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, className, onKeyDown }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown}
      className={`w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--teal)] ${className || ""}`}
      style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-dm-sans)" }} />
  );
}
