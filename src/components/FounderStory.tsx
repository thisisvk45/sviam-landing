"use client";

import { useInView } from "@/hooks/useInView";

export default function FounderStory() {
  const { ref, inView } = useInView<HTMLElement>({ margin: "-80px" });

  return (
    <section className="relative z-10 py-24 px-6" ref={ref}>
      <div className="max-w-3xl mx-auto">
        <div
          className={`p-8 sm:p-12 rounded-[24px] relative overflow-hidden anim-base anim-fade-up ${inView ? "in-view" : ""}`}
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            animationDuration: "0.7s",
          }}
        >
          {/* Accent glow */}
          <div
            className="absolute top-0 left-0 w-60 h-60 pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
            }}
          />

          {/* Quote mark */}
          <span
            className={`block mb-6 text-[var(--teal)] anim-base anim-fade-scale ${inView ? "in-view" : ""}`}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "4rem",
              lineHeight: 0.8,
              fontWeight: 700,
              opacity: inView ? 0.15 : 0,
              animationDelay: "0.2s",
            }}
          >
            &ldquo;
          </span>

          {/* Story */}
          <blockquote
            className={`relative anim-base anim-fade-up ${inView ? "in-view" : ""}`}
            style={{ animationDelay: "0.3s" }}
          >
            <p
              className="text-[var(--text)] mb-6"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "clamp(1rem, 2vw, 1.15rem)",
                lineHeight: 1.75,
                fontWeight: 300,
              }}
            >
              I sent 200+ applications. Got ghosted by most. Watched friends
              with better skills get passed over because their resume didn&apos;t
              have the right keywords. The system wasn&apos;t broken for some
              people. It was broken for everyone.
            </p>
            <p
              className="text-[var(--text)] mb-6"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "clamp(1rem, 2vw, 1.15rem)",
                lineHeight: 1.75,
                fontWeight: 300,
              }}
            >
              On the other side, I saw companies burn months and lakhs on hiring
              pipelines that still ended with bad hires. Engineers wasting
              hundreds of hours interviewing people who couldn&apos;t write a for
              loop.
            </p>
            <p
              className="text-[var(--muted2)] mb-8"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "clamp(1rem, 2vw, 1.15rem)",
                lineHeight: 1.75,
                fontWeight: 400,
              }}
            >
              SViam exists because I decided the system doesn&apos;t need a
              patch. It needs a replacement. This is that replacement.
            </p>

            {/* Attribution */}
            <div
              className={`flex items-center gap-4 anim-base anim-fade-left ${inView ? "in-view" : ""}`}
              style={{ animationDelay: "0.6s" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                style={{
                  background: "linear-gradient(135deg, var(--teal), var(--teal))",
                  fontFamily: "var(--font-display)",
                  fontSize: "0.9rem",
                }}
              >
                VK
              </div>
              <div>
                <p
                  className="text-sm font-medium text-[var(--text)]"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Vikas
                </p>
                <p
                  className="text-xs text-[var(--muted)]"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Founder, SViam
                </p>
              </div>
            </div>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
