"use client";

import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
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
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reducedMotion = useReducedMotion();
  const [selectedStack, setSelectedStack] = useState("Python");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Senior");
  const [depth, setDepth] = useState(75);

  return (
    <section className="relative z-10 py-20 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <motion.span
            className="text-xs tracking-[0.2em] text-[var(--muted)] mb-4 block"
            style={{
              fontFamily: "var(--font-dm-mono)",
              textTransform: "uppercase",
            }}
            initial={reducedMotion ? false : { opacity: 0, x: -15 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.4 }}
          >
            YOUR WEAPON
          </motion.span>
          <div className="overflow-hidden">
            <motion.h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.025em",
              }}
              initial={reducedMotion ? false : { y: "100%", rotateX: -15 }}
              animate={inView ? { y: 0, rotateX: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
            >
              Build the interview no one can BS.
              <br />
              <span className="text-[var(--muted2)]">In under 60 seconds.</span>
            </motion.h2>
          </div>
          <motion.p
            className="mt-4 text-[var(--muted2)] max-w-lg"
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 300,
              lineHeight: 1.6,
            }}
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Pick the stack. Crank the difficulty. Add follow-up depth so deep
            that tutorial-memorizers crumble. This is what separates real
            engineers from resume artists.
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Config panel */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 30, scale: 0.97 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.33, 1, 0.68, 1] }}
            className="p-6 rounded-[16px]"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
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
                    <motion.button
                      key={s.name}
                      onClick={() => setSelectedStack(s.name)}
                      whileHover={reducedMotion ? {} : { scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.92 }}
                      animate={
                        active && !reducedMotion
                          ? { boxShadow: `0 0 20px ${s.color}40` }
                          : { boxShadow: "0 0 0px transparent" }
                      }
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="px-4 py-2 rounded-[10px] text-xs font-medium relative overflow-hidden"
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        background: active
                          ? s.color
                          : "var(--surface)",
                        color: active ? "#080810" : "var(--muted2)",
                        border: `1px solid ${active ? s.color : "var(--border)"}`,
                        fontWeight: active ? 500 : 400,
                      }}
                    >
                      {s.name}
                    </motion.button>
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
                  <motion.button
                    key={d}
                    onClick={() => setSelectedDifficulty(d)}
                    whileHover={reducedMotion ? {} : { scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-3 py-2 rounded-[8px] text-xs font-medium relative"
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      background:
                        selectedDifficulty === d
                          ? "var(--accent)"
                          : "transparent",
                      color:
                        selectedDifficulty === d
                          ? "white"
                          : "var(--muted2)",
                    }}
                  >
                    {selectedDifficulty === d && (
                      <motion.div
                        layoutId="difficulty-active"
                        className="absolute inset-0 rounded-[8px]"
                        style={{
                          background: "var(--accent)",
                          boxShadow: "0 0 15px rgba(108,99,255,0.3)",
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">{d}</span>
                  </motion.button>
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
                  <motion.span
                    key={t}
                    className="px-3 py-1.5 rounded-[8px] text-xs cursor-pointer"
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      background:
                        i < 2
                          ? "rgba(108,99,255,0.1)"
                          : "var(--surface)",
                      border: `1px solid ${i < 2 ? "rgba(108,99,255,0.2)" : "var(--border)"}`,
                      color: i < 2 ? "var(--accent2)" : "var(--muted2)",
                    }}
                    whileHover={
                      reducedMotion
                        ? {}
                        : {
                            scale: 1.08,
                            y: -2,
                            borderColor: "rgba(108,99,255,0.4)",
                          }
                    }
                    whileTap={{ scale: 0.95 }}
                    initial={reducedMotion ? false : { opacity: 0, scale: 0.8 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 20,
                      delay: 0.4 + i * 0.08,
                    }}
                  >
                    {t}
                  </motion.span>
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
                <motion.span
                  className="text-xs text-[var(--accent2)]"
                  style={{ fontFamily: "var(--font-dm-mono)" }}
                  key={depth}
                  initial={reducedMotion ? false : { scale: 1.3, color: "var(--accent)" }}
                  animate={{ scale: 1, color: "var(--accent2)" }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  {depth}%
                </motion.span>
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
                    background: `linear-gradient(90deg, var(--accent) 0%, var(--teal) ${depth}%, var(--surface) ${depth}%)`,
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Live preview */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 30, scale: 0.97 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.33, 1, 0.68, 1] }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedStack}
                initial={reducedMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reducedMotion ? {} : { opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="scanlines rounded-[12px]"
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
              </motion.div>
            </AnimatePresence>
            <motion.p
              className="mt-3 text-center text-[0.7rem] text-[var(--muted)]"
              style={{ fontFamily: "var(--font-dm-mono)" }}
              animate={reducedMotion ? {} : { opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Live preview · {selectedStack} / {selectedDifficulty}
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
