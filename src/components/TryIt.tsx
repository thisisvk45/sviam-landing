"use client";

import { useState, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { IconUpload } from "@tabler/icons-react";
import { matchResume } from "@/lib/api";
import type { MatchResult } from "@/lib/api";
import JobCard from "./JobCard";
import AuthButton from "./AuthButton";

export default function TryIt() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reducedMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are accepted.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await matchResume(file);
      const top5 = data.results.slice(0, 5);
      setResults(top5);
      // Persist to localStorage so dashboard can hydrate after signup
      try {
        localStorage.setItem("sviam_tryit_results", JSON.stringify(top5));
      } catch {
        // localStorage unavailable
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const topScore = results.length > 0 ? results[0].match_score : 0;

  return (
    <section id="try-it" className="relative z-10 py-24 px-6" ref={ref}>
      <div className="max-w-2xl mx-auto">
        {/* Headline */}
        <motion.div
          className="text-center mb-10"
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="text-[var(--text)] mb-3"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            See your matches in 10 seconds.
          </h2>
          <p
            className="text-[var(--muted2)]"
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 300,
              lineHeight: 1.6,
            }}
          >
            Upload your resume &mdash; no account needed.
          </p>
        </motion.div>

        {/* Upload area */}
        {results.length === 0 && !loading && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 15 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={() => inputRef.current?.click()}
            className="py-12 rounded-[16px] text-center cursor-pointer transition-all duration-200 hover:border-[var(--accent)]"
            style={{
              background: "var(--card)",
              border: "2px dashed var(--border)",
            }}
          >
            <IconUpload
              size={32}
              className="mx-auto mb-3"
              style={{ color: "var(--muted)" }}
            />
            <p
              className="text-[var(--text)] text-sm font-medium mb-1"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Drop your resume here or click to upload
            </p>
            <p
              className="text-xs text-[var(--muted)]"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              PDF only &middot; Free &middot; No signup
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
            />
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center">
            <motion.div
              className="w-10 h-10 rounded-full border-2 mx-auto mb-4"
              style={{
                borderColor: "var(--border)",
                borderTopColor: "var(--accent)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p
              className="text-sm text-[var(--muted2)]"
              style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
            >
              Matching your resume against 8,000+ jobs...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p
            className="text-center text-sm mt-4"
            style={{ color: "#ef4444", fontFamily: "var(--font-dm-sans)" }}
          >
            {error}
          </p>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-[12px] text-center"
              style={{
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              <p
                className="text-sm text-[var(--text)]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Your top match is{" "}
                <span className="font-semibold" style={{ color: "var(--accent)" }}>
                  {topScore}%
                </span>{" "}
                &mdash; create a free account to apply
              </p>
            </motion.div>

            <div className="space-y-3">
              {results.map((job, i) => (
                <JobCard key={job.job_id} job={job} index={i} />
              ))}
            </div>

            <div
              className="p-6 rounded-[16px] text-center space-y-4"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="text-sm text-[var(--muted2)]"
                style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
              >
                Sign up to see all matches and apply in one click
              </p>
              <div className="max-w-xs mx-auto">
                <AuthButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
