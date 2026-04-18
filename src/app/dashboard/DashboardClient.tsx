"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SignOutButton from "./SignOutButton";
import ResumeUpload from "@/components/ResumeUpload";
import JobCard from "@/components/JobCard";
import ErrorBoundary from "@/components/ErrorBoundary";
import { JobCardSkeleton, ProfileSkeleton } from "@/components/Skeleton";
import {
  getProfile,
  updateProfile,
  getJobStats,
  saveJob,
  unsaveJob,
  getSavedJobs,
} from "@/lib/api";
import type { MatchResult, Profile } from "@/lib/api";

export default function DashboardClient({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [profileLoading, setProfileLoading] = useState(true);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    city: "",
    experience_level: "",
  });
  const [saving, setSaving] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  // Filters
  const [filterCity, setFilterCity] = useState("");
  const [filterRemote, setFilterRemote] = useState(false);

  useEffect(() => {
    // Load profile
    getProfile(token)
      .then((p) => {
        setProfile(p);
        setEditForm({
          name: p.name || "",
          city: p.city || "",
          experience_level: p.experience_level || "",
        });
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));

    // Load job stats
    getJobStats()
      .then((s) => setTotalJobs(s.total_active_jobs))
      .catch(() => {});

    // Load saved jobs
    getSavedJobs(token)
      .then((res) => {
        setSavedJobIds(new Set(res.saved_jobs.map((j) => j.job_id)));
      })
      .catch(() => {});

    // Hydrate from localStorage (TryIt results)
    try {
      const stored = localStorage.getItem("sviam_tryit_results");
      if (stored) {
        const parsed = JSON.parse(stored) as MatchResult[];
        if (parsed.length > 0) {
          setMatches(parsed);
          localStorage.removeItem("sviam_tryit_results");
        }
      }
    } catch {
      // ignore
    }
  }, [token]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile(token, editForm);
      setProfile(updated);
      setEditing(false);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (jobId: string) => {
    try {
      await saveJob(token, jobId);
      setSavedJobIds((prev) => new Set(prev).add(jobId));
    } catch {
      // silent
    }
  };

  const handleUnsave = async (jobId: string) => {
    try {
      await unsaveJob(token, jobId);
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    } catch {
      // silent
    }
  };

  const handleMatchComplete = (results: MatchResult[]) => {
    setMatches(results);
    setMatchesLoading(false);
  };

  // Apply client-side filters
  const filteredMatches = matches.filter((job) => {
    if (filterCity && !job.city.toLowerCase().includes(filterCity.toLowerCase()))
      return false;
    if (filterRemote && !job.remote) return false;
    return true;
  });

  const inputClass =
    "w-full px-3 py-2 rounded-[8px] text-sm text-[var(--text)] outline-none";
  const inputStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    fontFamily: "var(--font-dm-sans)",
  };

  return (
    <ErrorBoundary>
      <main
        className="min-h-screen px-6 pt-28 pb-16"
        style={{ background: "var(--bg)" }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1
                className="text-[var(--text)] mb-1"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                }}
              >
                Welcome{profile.name ? `, ${profile.name}` : ""}
              </h1>
              <p
                className="text-[var(--muted2)] text-sm"
                style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
              >
                {totalJobs > 0
                  ? `Matching against ${totalJobs.toLocaleString()} active jobs`
                  : "Your SViam dashboard"}
              </p>
            </div>
            <SignOutButton />
          </div>

          {/* Two column layout */}
          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-6">
            {/* Left column — Profile */}
            <div className="space-y-6">
              {profileLoading ? (
                <ProfileSkeleton />
              ) : (
                <div
                  className="p-6 rounded-[16px]"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2
                      className="text-[var(--text)] text-base font-medium"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      Profile
                    </h2>
                    {!editing && (
                      <button
                        onClick={() => setEditing(true)}
                        className="text-xs text-[var(--accent)]"
                        style={{ fontFamily: "var(--font-dm-sans)" }}
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  {editing ? (
                    <div className="space-y-3">
                      <div>
                        <label
                          className="text-[0.65rem] text-[var(--muted)] block mb-1 tracking-[0.1em] uppercase"
                          style={{ fontFamily: "var(--font-dm-mono)" }}
                        >
                          Name
                        </label>
                        <input
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          className={inputClass}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label
                          className="text-[0.65rem] text-[var(--muted)] block mb-1 tracking-[0.1em] uppercase"
                          style={{ fontFamily: "var(--font-dm-mono)" }}
                        >
                          City
                        </label>
                        <input
                          value={editForm.city}
                          onChange={(e) =>
                            setEditForm({ ...editForm, city: e.target.value })
                          }
                          className={inputClass}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label
                          className="text-[0.65rem] text-[var(--muted)] block mb-1 tracking-[0.1em] uppercase"
                          style={{ fontFamily: "var(--font-dm-mono)" }}
                        >
                          Experience Level
                        </label>
                        <input
                          value={editForm.experience_level}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              experience_level: e.target.value,
                            })
                          }
                          className={inputClass}
                          style={inputStyle}
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="px-4 py-2 rounded-[8px] text-xs font-medium text-white"
                          style={{
                            background: "var(--accent)",
                            fontFamily: "var(--font-dm-sans)",
                          }}
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditing(false)}
                          className="px-4 py-2 rounded-[8px] text-xs text-[var(--muted2)]"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            fontFamily: "var(--font-dm-sans)",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <InfoRow label="Email" value={email} />
                      <InfoRow label="Name" value={profile.name || "—"} />
                      <InfoRow label="City" value={profile.city || "—"} />
                      <InfoRow
                        label="Experience"
                        value={profile.experience_level || "—"}
                      />
                      <InfoRow
                        label="Resume"
                        value={profile.resume_url ? "Uploaded" : "Not uploaded"}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Filters */}
              {matches.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-[16px]"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <h3
                    className="text-[var(--text)] text-sm font-medium mb-3"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    Filter Matches
                  </h3>
                  <div className="space-y-3">
                    <input
                      placeholder="Filter by city..."
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterRemote}
                        onChange={(e) => setFilterRemote(e.target.checked)}
                        className="rounded"
                      />
                      <span
                        className="text-sm text-[var(--muted2)]"
                        style={{ fontFamily: "var(--font-dm-sans)" }}
                      >
                        Remote only
                      </span>
                    </label>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right column — Resume + Matches */}
            <div className="space-y-6">
              <ErrorBoundary>
                <ResumeUpload
                  token={token}
                  onMatchComplete={handleMatchComplete}
                />
              </ErrorBoundary>

              {/* Job matches */}
              <div>
                <h2
                  className="text-[var(--text)] text-base font-medium mb-4"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {filteredMatches.length > 0
                    ? `Your Matches (${filteredMatches.length})`
                    : "Job Matches"}
                </h2>

                {matchesLoading ? (
                  <div className="space-y-3">
                    {[0, 1, 2, 3].map((i) => (
                      <JobCardSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredMatches.length > 0 ? (
                  <div className="space-y-3">
                    {filteredMatches.map((job, i) => (
                      <JobCard
                        key={job.job_id}
                        job={job}
                        index={i}
                        saved={savedJobIds.has(job.job_id)}
                        onSave={handleSave}
                        onUnsave={handleUnsave}
                      />
                    ))}
                  </div>
                ) : matches.length > 0 && filteredMatches.length === 0 ? (
                  <div
                    className="p-8 rounded-[16px] text-center"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <p
                      className="text-sm text-[var(--muted2)]"
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontWeight: 300,
                      }}
                    >
                      No matches found with current filters
                    </p>
                  </div>
                ) : (
                  <div
                    className="p-8 rounded-[16px] text-center"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <p
                      className="text-sm text-[var(--muted2)]"
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontWeight: 300,
                      }}
                    >
                      Upload your resume above to see your matches
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </ErrorBoundary>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span
        className="text-[0.7rem] text-[var(--muted)] uppercase tracking-wider"
        style={{ fontFamily: "var(--font-dm-mono)" }}
      >
        {label}
      </span>
      <span
        className="text-sm text-[var(--text)]"
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        {value}
      </span>
    </div>
  );
}
