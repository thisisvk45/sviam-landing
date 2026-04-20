"use client";

import { useState } from "react";
import { useInView, usePrefersReducedMotion } from "@/hooks/useInView";
import CodeEditor from "../shared/CodeEditor";

const stacks = [
  { name: "Python", color: "#3776AB" },
  { name: "React", color: "#61DAFB" },
  { name: "Node.js", color: "#339933" },
  { name: "Go", color: "#00ADD8" },
  { name: "Java", color: "#ED8B00" },
];

const difficulties = ["Junior", "Mid", "Senior", "Staff"];

const pythonCode = [
  {
    tokens: [
      { text: "def ", color: "#c678dd" },
      { text: "two_sum", color: "#61afef" },
      { text: "(nums, target):", color: "#abb2bf" },
    ],
  },
  {
    tokens: [
      { text: "    seen = ", color: "#abb2bf" },
      { text: "{}", color: "#98c379" },
    ],
  },
  {
    tokens: [
      { text: "    ", color: "" },
      { text: "for ", color: "#c678dd" },
      { text: "i, num ", color: "#abb2bf" },
      { text: "in ", color: "#c678dd" },
      { text: "enumerate(nums):", color: "#61afef" },
    ],
  },
  { tokens: [{ text: "        comp = target - num", color: "#abb2bf" }] },
  {
    tokens: [
      { text: "        ", color: "" },
      { text: "if ", color: "#c678dd" },
      { text: "comp ", color: "#abb2bf" },
      { text: "in ", color: "#c678dd" },
      { text: "seen:", color: "#abb2bf" },
    ],
  },
  {
    tokens: [
      { text: "            ", color: "" },
      { text: "return ", color: "#c678dd" },
      { text: "[seen[comp], i]", color: "#abb2bf" },
    ],
  },
];

const reactCode = [
  {
    tokens: [
      { text: "const ", color: "#c678dd" },
      { text: "useDebounce ", color: "#61afef" },
      { text: "= (val, ms) => {", color: "#abb2bf" },
    ],
  },
  {
    tokens: [
      { text: "  const ", color: "#c678dd" },
      { text: "[d, setD]", color: "#abb2bf" },
      { text: " = ", color: "#abb2bf" },
      { text: "useState", color: "#61afef" },
      { text: "(val)", color: "#abb2bf" },
    ],
  },
  {
    tokens: [
      { text: "  ", color: "" },
      { text: "useEffect", color: "#61afef" },
      { text: "(() => {", color: "#abb2bf" },
    ],
  },
  {
    tokens: [
      { text: "    const t = ", color: "#abb2bf" },
      { text: "setTimeout", color: "#61afef" },
      { text: "(() =>", color: "#abb2bf" },
    ],
  },
  {
    tokens: [
      { text: "      ", color: "" },
      { text: "setD", color: "#61afef" },
      { text: "(val), ms)", color: "#abb2bf" },
    ],
  },
  {
    tokens: [
      { text: "    ", color: "" },
      { text: "return ", color: "#c678dd" },
      { text: "() => clearTimeout(t)", color: "#abb2bf" },
    ],
  },
];

const codeMap: Record<string, typeof pythonCode> = {
  Python: pythonCode,
  React: reactCode,
  "Node.js": pythonCode,
  Go: pythonCode,
  Java: pythonCode,
};

const fileMap: Record<string, string> = {
  Python: "interview.py",
  React: "interview.tsx",
  "Node.js": "interview.js",
  Go: "interview.go",
  Java: "Interview.java",
};

export default function HirerInterviewConfig() {
  const { ref, inView } = useInView<HTMLElement>({ once: true, margin: "-80px" });
  const reducedMotion = usePrefersReducedMotion();
  const [selectedStack, setSelectedStack] = useState("Python");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Senior");
  const [depth, setDepth] = useState(75);

  const animBase = reducedMotion ? "" : "anim-base";
  const show = inView ? "in-view" : "";

  return (
    <section className="relative z-10 py-20 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div className={`mb-12 ${animBase} anim-fade-up ${show}`}>
          <span
            className={`text-xs tracking-[0.2em] text-[var(--muted)] mb-4 block ${animBase} anim-fade-left ${show}`}
            style={{
              fontFamily: "var(--font-dm-mono)",
              textTransform: "uppercase",
              transitionDelay: "0s",
            }}
          >
            YOUR WEAPON
          </span>
          <div className="overflow-hidden">
            <h2
              className={`${animBase} anim-reveal-up ${show}`}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.025em",
                transitionDelay: "0.1s",
              }}
            >
              Build the interview no one can BS.
              <br />
              <span className="text-[var(--muted2)]">In under 60 seconds.</span>
            </h2>
          </div>
          <p
            className={`mt-4 text-[var(--muted2)] max-w-lg ${animBase} anim-fade-up ${show}`}
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 300,
              lineHeight: 1.6,
              transitionDelay: "0.2s",
            }}
          >
            Pick the stack. Crank the difficulty. Add follow-up depth so deep
            that tutorial-memorizers crumble. This is what separates real
            engineers from resume artists.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Config panel */}
          <div
            className={`p-6 rounded-[16px] ${animBase} anim-fade-up ${show}`}
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              transitionDelay: "0.1s",
            }}
          >
            {/* Stack selector — colored pills */}
            <div className="mb-8">
              <label
                className="text-[0.65rem] text-[var(--muted)] block mb-3 tracking-[0.15em]"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  textTransform: "uppercase",
                }}
              >
                Stack
              </label>
              <div className="flex flex-wrap gap-2">
                {stacks.map((s) => {
                  const active = selectedStack === s.name;
                  return (
                    <button
                      key={s.name}
                      onClick={() => setSelectedStack(s.name)}
                      className="px-4 py-2 rounded-[10px] text-xs font-medium relative overflow-hidden hover-scale transition-all duration-200"
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        background: active ? s.color : "var(--surface)",
                        color: active ? "#080810" : "var(--muted2)",
                        border: `1px solid ${active ? s.color : "var(--border)"}`,
                        fontWeight: active ? 500 : 400,
                        boxShadow: active ? `0 0 20px ${s.color}40` : "0 0 0px transparent",
                      }}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty */}
            <div className="mb-8">
              <label
                className="text-[0.65rem] text-[var(--muted)] block mb-3 tracking-[0.15em]"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  textTransform: "uppercase",
                }}
              >
                Difficulty
              </label>
              <div className="flex gap-1 p-1 rounded-[10px]" style={{ background: "var(--surface)" }}>
                {difficulties.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDifficulty(d)}
                    className="flex-1 px-3 py-2 rounded-[8px] text-xs font-medium relative hover-scale transition-all duration-200"
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      background:
                        selectedDifficulty === d
                          ? "var(--teal)"
                          : "transparent",
                      color:
                        selectedDifficulty === d
                          ? "white"
                          : "var(--muted2)",
                      boxShadow:
                        selectedDifficulty === d
                          ? "0 0 15px rgba(0,153,153,0.3)"
                          : "none",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Topics */}
            <div className="mb-8">
              <label
                className="text-[0.65rem] text-[var(--muted)] block mb-3 tracking-[0.15em]"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  textTransform: "uppercase",
                }}
              >
                Topics
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  "Data Structures",
                  "System Design",
                  "Algorithms",
                  "API Design",
                ].map((t, i) => (
                  <span
                    key={t}
                    className={`px-3 py-1.5 rounded-[8px] text-xs cursor-pointer hover-scale transition-all duration-200 ${animBase} anim-fade-up ${show}`}
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      background:
                        i < 2
                          ? "rgba(0,153,153,0.1)"
                          : "var(--surface)",
                      border: `1px solid ${i < 2 ? "rgba(0,153,153,0.2)" : "var(--border)"}`,
                      color: i < 2 ? "var(--accent2)" : "var(--muted2)",
                      transitionDelay: `${0.4 + i * 0.08}s`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Follow-up depth — interactive slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label
                  className="text-[0.65rem] text-[var(--muted)] tracking-[0.15em]"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    textTransform: "uppercase",
                  }}
                >
                  Follow-up depth
                </label>
                <span
                  className="text-xs text-[var(--accent2)] transition-transform duration-200"
                  style={{ fontFamily: "var(--font-dm-mono)" }}
                >
                  {depth}%
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(90deg, var(--teal) 0%, var(--teal) ${depth}%, var(--surface) ${depth}%)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div
            className={`${animBase} anim-fade-up ${show}`}
            style={{ transitionDelay: "0.2s" }}
          >
            <div
              key={selectedStack}
              className="scanlines rounded-[12px]"
              style={{
                animation: reducedMotion ? "none" : "css-fade-in 0.3s ease-out",
              }}
            >
              <CodeEditor
                codeLines={codeMap[selectedStack] || pythonCode}
                aiQuestions={[
                  "What is the time complexity of this approach?",
                  "Can you optimize the space usage here?",
                  "How would this handle edge cases with empty input?",
                ]}
                fileName={fileMap[selectedStack] || "interview.py"}
              />
            </div>
            <p
              className="mt-3 text-center text-[0.7rem] text-[var(--muted)]"
              style={{
                fontFamily: "var(--font-dm-mono)",
                animation: reducedMotion ? "none" : "pulse-opacity 2s infinite",
              }}
            >
              Live preview · {selectedStack} / {selectedDifficulty}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
