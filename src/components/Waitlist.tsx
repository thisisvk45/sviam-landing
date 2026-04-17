"use client";

import {
  motion,
  useInView,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import { useRef, useState, FormEvent } from "react";
import confetti from "canvas-confetti";

type UserType = "candidate" | "company" | null;

export default function Waitlist() {
  const ref = useRef(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reducedMotion = useReducedMotion();

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [userType, setUserType] = useState<UserType>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [hiringRole, setHiringRole] = useState("");
  const [lookingFor, setLookingFor] = useState("");

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
          phone,
          user_type: userType,
          company_name: companyName || null,
          hiring_role: hiringRole || null,
          looking_for: lookingFor || null,
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
    "w-full px-4 py-3 rounded-[10px] text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)] focus:ring-opacity-30";
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
              "conic-gradient(from 0deg, rgba(99,102,241,0.1), rgba(16,185,129,0.08), rgba(129,140,248,0.06), rgba(99,102,241,0.1))",
            borderRadius: "50%",
            filter: "blur(80px)",
            animation: reducedMotion ? "none" : "aurora 15s linear infinite",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px]"
          style={{
            background:
              "conic-gradient(from 180deg, rgba(16,185,129,0.08), rgba(99,102,241,0.1), rgba(16,185,129,0.06), rgba(16,185,129,0.08))",
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
            <motion.h2
              initial={
                reducedMotion ? false : { y: "100%", rotateX: -30, filter: "blur(6px)" }
              }
              animate={
                inView ? { y: 0, rotateX: 0, filter: "blur(0px)" } : {}
              }
              transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
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
            </motion.h2>
          </div>
          <div className="overflow-hidden mb-8">
            <motion.h2
              initial={
                reducedMotion ? false : { y: "100%", rotateX: -30, filter: "blur(6px)" }
              }
              animate={
                inView ? { y: 0, rotateX: 0, filter: "blur(0px)" } : {}
              }
              transition={{
                duration: 0.7,
                delay: 0.15,
                ease: [0.33, 1, 0.68, 1],
              }}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                fontWeight: 700,
                transformOrigin: "bottom",
              }}
            >
              Be first in line.
            </motion.h2>
          </div>

          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 15 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-[var(--muted2)]"
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 300,
              lineHeight: 1.6,
            }}
          >
            SViam is in private beta. We&apos;re letting people in wave by wave.
            <br />
            Tell us about yourself. One email when it&apos;s your turn.
          </motion.p>
        </div>

        {/* Form */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20, scale: 0.95 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5, type: "spring", stiffness: 200 }}
        >
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                exit={reducedMotion ? {} : { opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.3 }}
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
                      <motion.button
                        key={type}
                        type="button"
                        onClick={() => setUserType(type)}
                        whileHover={reducedMotion ? {} : { scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-4 py-3 rounded-[10px] text-sm font-medium relative"
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          color:
                            userType === type
                              ? "white"
                              : "var(--muted2)",
                        }}
                      >
                        {userType === type && (
                          <motion.div
                            layoutId="type-active"
                            className="absolute inset-0 rounded-[10px]"
                            style={{
                              background:
                                type === "candidate"
                                  ? "var(--accent)"
                                  : "var(--teal)",
                              boxShadow:
                                type === "candidate"
                                  ? "0 0 20px rgba(99,102,241,0.3)"
                                  : "0 0 20px rgba(16,185,129,0.3)",
                            }}
                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                          />
                        )}
                        <span className="relative z-10">
                          {type === "candidate" ? "Candidate" : "Company"}
                        </span>
                      </motion.button>
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
                      placeholder="Priya Krishnan"
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
                      placeholder="priya@email.com"
                      required
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label
                    className="text-[0.65rem] text-[var(--muted)] block mb-2 tracking-[0.15em]"
                    style={{
                      fontFamily: "var(--font-dm-mono)",
                      textTransform: "uppercase",
                    }}
                  >
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>

                {/* Conditional fields */}
                <AnimatePresence mode="wait">
                  {userType === "company" && (
                    <motion.div
                      key="company-fields"
                      initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 overflow-hidden"
                    >
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
                          Role you are hiring for
                        </label>
                        <input
                          type="text"
                          value={hiringRole}
                          onChange={(e) => setHiringRole(e.target.value)}
                          placeholder="Senior Backend Engineer"
                          className={inputClass}
                          style={inputStyle}
                        />
                      </div>
                    </motion.div>
                  )}

                  {userType === "candidate" && (
                    <motion.div
                      key="candidate-fields"
                      initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <label
                        className="text-[0.65rem] text-[var(--muted)] block mb-2 tracking-[0.15em]"
                        style={{
                          fontFamily: "var(--font-dm-mono)",
                          textTransform: "uppercase",
                        }}
                      >
                        What role are you looking for?
                      </label>
                      <input
                        type="text"
                        value={lookingFor}
                        onChange={(e) => setLookingFor(e.target.value)}
                        placeholder="Full Stack Developer, React, Node.js"
                        className={inputClass}
                        style={inputStyle}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-[var(--orange)]"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {error}
                  </motion.p>
                )}

                {/* Submit */}
                <motion.button
                  ref={btnRef}
                  type="submit"
                  disabled={!name || !email || !userType || submitting}
                  className="w-full py-4 rounded-[12px] text-sm font-medium text-white relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--accent), var(--accent2))",
                    boxShadow: "0 0 30px rgba(99,102,241,0.3)",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                  whileHover={
                    reducedMotion || submitting
                      ? {}
                      : {
                          scale: 1.02,
                          boxShadow: "0 0 50px rgba(99,102,241,0.5)",
                        }
                  }
                  whileTap={submitting ? {} : { scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {!reducedMotion && !submitting && (
                    <motion.span
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                      }}
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatDelay: 2,
                      }}
                    />
                  )}
                  <span className="relative z-10">
                    {submitting ? "Joining..." : "Get Early Access"}
                  </span>
                </motion.button>

                <p
                  className="text-center text-[var(--muted)]"
                  style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.65rem" }}
                >
                  No spam. One email when you&apos;re in.
                </p>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={reducedMotion ? false : { opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
                className="p-8 rounded-[20px] text-center"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                }}
              >
                <motion.div
                  className="w-16 h-16 rounded-full bg-[var(--green)] flex items-center justify-center mx-auto mb-5"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    delay: 0.1,
                  }}
                >
                  <motion.svg
                    width="28"
                    height="28"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <motion.path
                      d="M3 8.5l3 3 7-7"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    />
                  </motion.svg>
                </motion.div>
                <motion.h3
                  className="text-xl font-medium text-[var(--text)] mb-2"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
                  initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  You&apos;re on the list!
                </motion.h3>
                <motion.p
                  className="text-sm text-[var(--muted2)]"
                  style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  We&apos;ll reach out when your spot opens up.
                  <br />
                  Keep an eye on your inbox.
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
