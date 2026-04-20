"use client";

import { useRef, useState, FormEvent } from "react";
import { useInView, usePrefersReducedMotion } from "@/hooks/useInView";
import confetti from "canvas-confetti";
import AuthButton from "./AuthButton";

type UserType = "candidate" | "company" | null;

const roles = [
  "Software Engineer",
  "Data Scientist",
  "Product Manager",
  "UI/UX Designer",
  "DevOps / Cloud",
  "Marketing",
  "Sales / BD",
  "Finance / CA",
  "Operations",
  "HR / People Ops",
  "Content / Writing",
  "Legal / Compliance",
  "Supply Chain",
  "Other",
];

const candidateLevels = [
  "College / Internship",
  "Entry Level (0-1 yr)",
  "Early Career (2-4 yrs)",
  "Mid Level (5-7 yrs)",
  "Senior (8+ yrs)",
  "Lead / Manager",
  "Director+",
];

const companyLevels = [
  "Interns",
  "Freshers (0-1 yr)",
  "Junior (2-4 yrs)",
  "Mid Level (5-7 yrs)",
  "Senior (8+ yrs)",
  "Lead / Manager",
  "Director+",
  "Any Level",
];

export default function Waitlist() {
  const { ref, inView } = useInView<HTMLElement>({ margin: "-80px" });
  const btnRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [userType, setUserType] = useState<UserType>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [hiringRoles, setHiringRoles] = useState<string[]>([]);
  const [hiringLevel, setHiringLevel] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !userType) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          user_type: userType,
          company_name: companyName || null,
          hiring_role: hiringRoles.length ? hiringRoles.join(", ") : null,
          hiring_level: hiringLevel || null,
          looking_for: lookingFor.length ? lookingFor.join(", ") : null,
          experience_level: experienceLevel || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      if (btnRef.current && !reducedMotion) {
        const rect = btnRef.current.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;
        confetti({ particleCount: 150, spread: 80, origin: { x, y } });
        setTimeout(() => {
          confetti({ particleCount: 50, spread: 100, origin: { x: x - 0.1, y } });
          confetti({ particleCount: 50, spread: 100, origin: { x: x + 0.1, y } });
        }, 200);
      }
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-[10px] text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--teal)] focus:ring-opacity-30";
  const inputStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    fontFamily: "var(--font-dm-sans)",
  };

  return (
    <section
      id="waitlist"
      className="relative z-10 py-32 px-6 overflow-hidden"
      ref={ref}
    >
      {/* Aurora background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(99,102,241,0.1), rgba(0,153,153,0.08), rgba(129,140,248,0.06), rgba(99,102,241,0.1))",
            borderRadius: "50%",
            filter: "blur(80px)",
            animation: reducedMotion ? "none" : "aurora 15s linear infinite",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px]"
          style={{
            background:
              "conic-gradient(from 180deg, rgba(0,153,153,0.08), rgba(99,102,241,0.1), rgba(0,153,153,0.06), rgba(0,153,153,0.08))",
            borderRadius: "50%",
            filter: "blur(60px)",
            animation: reducedMotion
              ? "none"
              : "aurora 12s linear infinite reverse",
          }}
        />
      </div>

      <div className="max-w-xl mx-auto relative">
        {/* Headline */}
        <div className="text-center mb-10">
          <div className="overflow-hidden mb-2">
            <h2
              className={`anim-base anim-reveal-up ${inView ? "in-view" : ""}`}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                fontWeight: 700,
                transformOrigin: "bottom",
              }}
            >
              The old way is dying.
            </h2>
          </div>
          <div className="overflow-hidden mb-8">
            <h2
              className={`anim-base anim-reveal-up ${inView ? "in-view" : ""}`}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                fontWeight: 700,
                transformOrigin: "bottom",
                animationDelay: "0.15s",
              }}
            >
              Be first in line.
            </h2>
          </div>

          <p
            className={`text-[var(--muted2)] anim-base anim-fade-up ${inView ? "in-view" : ""}`}
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 300,
              lineHeight: 1.6,
              animationDelay: "0.4s",
            }}
          >
            SViam is in private beta. We&apos;re letting people in wave by wave.
            <br />
            Tell us about yourself. One email when it&apos;s your turn.
          </p>
        </div>

        {/* Form */}
        <div
          className={`anim-base anim-fade-scale ${inView ? "in-view" : ""}`}
          style={{ animationDelay: "0.5s" }}
        >
          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              className="p-6 sm:p-8 rounded-[20px] space-y-5"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.2), 0 0 40px rgba(99,102,241,0.05)",
              }}
            >
              {/* User type toggle */}
              <div>
                <label
                  className="text-[0.65rem] text-[var(--muted)] block mb-3 tracking-[0.15em]"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    textTransform: "uppercase",
                  }}
                >
                  I am a
                </label>
                <div
                  className="flex gap-1 p-1 rounded-[12px]"
                  style={{ background: "var(--surface)" }}
                >
                  {(["candidate", "company"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUserType(type)}
                      className="flex-1 px-4 py-3 rounded-[10px] text-sm font-medium relative transition-all duration-300"
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        color:
                          userType === type
                            ? "white"
                            : "var(--muted2)",
                        background:
                          userType === type
                            ? type === "candidate"
                              ? "var(--teal)"
                              : "var(--teal)"
                            : "transparent",
                        boxShadow:
                          userType === type
                            ? type === "candidate"
                              ? "0 0 20px rgba(99,102,241,0.3)"
                              : "0 0 20px rgba(0,153,153,0.3)"
                            : "none",
                      }}
                    >
                      {type === "candidate" ? "Candidate" : "Company"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name + Email row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="text-[0.65rem] text-[var(--muted)] block mb-2 tracking-[0.15em]"
                    style={{
                      fontFamily: "var(--font-dm-mono)",
                      textTransform: "uppercase",
                    }}
                  >
                    Full name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Vikas Kumar"
                    required
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label
                    className="text-[0.65rem] text-[var(--muted)] block mb-2 tracking-[0.15em]"
                    style={{
                      fontFamily: "var(--font-dm-mono)",
                      textTransform: "uppercase",
                    }}
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=""
                    required
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Conditional fields - Company */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: userType === "company" ? "600px" : "0",
                  opacity: userType === "company" ? 1 : 0,
                }}
              >
                <div className="space-y-5">
                  <div>
                    <label
                      className="text-[0.65rem] text-[var(--muted)] block mb-2 tracking-[0.15em]"
                      style={{
                        fontFamily: "var(--font-dm-mono)",
                        textTransform: "uppercase",
                      }}
                    >
                      Company name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Razorpay"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      className="text-[0.65rem] text-[var(--muted)] block mb-2 tracking-[0.15em]"
                      style={{
                        fontFamily: "var(--font-dm-mono)",
                        textTransform: "uppercase",
                      }}
                    >
                      Hiring for
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {roles.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() =>
                            setHiringRoles((prev) =>
                              prev.includes(role)
                                ? prev.filter((r) => r !== role)
                                : [...prev, role]
                            )
                          }
                          className="px-3 py-1.5 rounded-full text-xs transition-all duration-200 hover-scale"
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontWeight: 500,
                            background:
                              hiringRoles.includes(role)
                                ? "var(--teal)"
                                : "var(--surface)",
                            color:
                              hiringRoles.includes(role)
                                ? "white"
                                : "var(--muted2)",
                            border:
                              hiringRoles.includes(role)
                                ? "1px solid var(--teal)"
                                : "1px solid var(--border)",
                            boxShadow:
                              hiringRoles.includes(role)
                                ? "0 0 12px rgba(0,153,153,0.25)"
                                : "none",
                          }}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label
                      className="text-[0.65rem] text-[var(--muted)] block mb-2 tracking-[0.15em]"
                      style={{
                        fontFamily: "var(--font-dm-mono)",
                        textTransform: "uppercase",
                      }}
                    >
                      Experience level needed
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {companyLevels.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() =>
                            setHiringLevel(
                              hiringLevel === level ? "" : level
                            )
                          }
                          className="px-3 py-1.5 rounded-full text-xs transition-all duration-200 hover-scale"
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontWeight: 500,
                            background:
                              hiringLevel === level
                                ? "var(--teal)"
                                : "var(--surface)",
                            color:
                              hiringLevel === level
                                ? "white"
                                : "var(--muted2)",
                            border:
                              hiringLevel === level
                                ? "1px solid var(--teal)"
                                : "1px solid var(--border)",
                            boxShadow:
                              hiringLevel === level
                                ? "0 0 12px rgba(0,153,153,0.25)"
                                : "none",
                          }}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Conditional fields - Candidate */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: userType === "candidate" ? "600px" : "0",
                  opacity: userType === "candidate" ? 1 : 0,
                }}
              >
                <div className="space-y-5">
                  <div>
                    <label
                      className="text-[0.65rem] text-[var(--muted)] block mb-2 tracking-[0.15em]"
                      style={{
                        fontFamily: "var(--font-dm-mono)",
                        textTransform: "uppercase",
                      }}
                    >
                      What role are you looking for?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {roles.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() =>
                            setLookingFor((prev) =>
                              prev.includes(role)
                                ? prev.filter((r) => r !== role)
                                : [...prev, role]
                            )
                          }
                          className="px-3 py-1.5 rounded-full text-xs transition-all duration-200 hover-scale"
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontWeight: 500,
                            background:
                              lookingFor.includes(role)
                                ? "var(--teal)"
                                : "var(--surface)",
                            color:
                              lookingFor.includes(role)
                                ? "white"
                                : "var(--muted2)",
                            border:
                              lookingFor.includes(role)
                                ? "1px solid var(--teal)"
                                : "1px solid var(--border)",
                            boxShadow:
                              lookingFor.includes(role)
                                ? "0 0 12px rgba(99,102,241,0.25)"
                                : "none",
                          }}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label
                      className="text-[0.65rem] text-[var(--muted)] block mb-2 tracking-[0.15em]"
                      style={{
                        fontFamily: "var(--font-dm-mono)",
                        textTransform: "uppercase",
                      }}
                    >
                      Experience level
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {candidateLevels.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() =>
                            setExperienceLevel(
                              experienceLevel === level ? "" : level
                            )
                          }
                          className="px-3 py-1.5 rounded-full text-xs transition-all duration-200 hover-scale"
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontWeight: 500,
                            background:
                              experienceLevel === level
                                ? "var(--teal)"
                                : "var(--surface)",
                            color:
                              experienceLevel === level
                                ? "white"
                                : "var(--muted2)",
                            border:
                              experienceLevel === level
                                ? "1px solid var(--teal)"
                                : "1px solid var(--border)",
                            boxShadow:
                              experienceLevel === level
                                ? "0 0 12px rgba(99,102,241,0.25)"
                                : "none",
                          }}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p
                  className="text-sm text-[var(--orange)]"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                ref={btnRef}
                type="submit"
                disabled={!name || !email || !userType || submitting}
                className="w-full py-4 rounded-[12px] text-sm font-medium text-white relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed btn-shimmer hover-scale"
                style={{
                  background:
                    "linear-gradient(135deg, var(--teal), var(--accent2))",
                  boxShadow: "0 0 30px rgba(99,102,241,0.3)",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                <span className="relative z-10">
                  {submitting ? "Joining..." : "Get Early Access"}
                </span>
              </button>

              <p
                className="text-center text-[var(--muted)]"
                style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.65rem" }}
              >
                No spam. One email when you&apos;re in.
              </p>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                <span
                  className="text-[var(--muted)] text-xs"
                  style={{ fontFamily: "var(--font-dm-mono)" }}
                >
                  or
                </span>
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              </div>

              <AuthButton />
            </form>
          ) : (
            <div
              className="p-8 rounded-[20px] text-center"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                animation: reducedMotion ? "none" : "fadeInScale 0.6s ease forwards",
              }}
            >
              <div
                className="w-16 h-16 rounded-full bg-[var(--green)] flex items-center justify-center mx-auto mb-5"
                style={{
                  animation: reducedMotion ? "none" : "fadeInScale 0.4s ease 0.1s both",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8.5l3 3 7-7"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      strokeDasharray: 20,
                      strokeDashoffset: reducedMotion ? 0 : 20,
                      animation: reducedMotion ? "none" : "checkDraw 0.5s ease 0.3s forwards",
                    }}
                  />
                </svg>
              </div>
              <h3
                className="text-xl font-medium text-[var(--text)] mb-2"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  animation: reducedMotion ? "none" : "fadeInUp 0.4s ease 0.4s both",
                }}
              >
                You&apos;re on the list!
              </h3>
              <p
                className="text-sm text-[var(--muted2)]"
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontWeight: 300,
                  animation: reducedMotion ? "none" : "fadeInUp 0.4s ease 0.6s both",
                }}
              >
                We&apos;ll reach out when your spot opens up.
                <br />
                Keep an eye on your inbox.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Inline keyframe for checkmark draw - not available in globals.css */}
      <style jsx>{`
        @keyframes checkDraw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </section>
  );
}
