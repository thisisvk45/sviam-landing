"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState, useEffect } from "react";

interface Token {
  text: string;
  color: string;
}

interface CodeLine {
  tokens: Token[];
}

interface Props {
  codeLines?: CodeLine[];
  aiQuestions?: string[];
  fileName?: string;
  showCameraFeeds?: boolean;
  interactive?: boolean;
}

const defaultCodeLines: CodeLine[] = [
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
  {
    tokens: [{ text: "        comp = target - num", color: "#abb2bf" }],
  },
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

const defaultAiQuestions = [
  "What is the time complexity of this loop?",
  "Why did you choose a hashmap here instead of a sorted array?",
  "Walk me through your approach before writing the next function.",
];

export default function CodeEditor({
  codeLines = defaultCodeLines,
  aiQuestions = defaultAiQuestions,
  fileName = "interview.py",
  showCameraFeeds = false,
  interactive = false,
}: Props) {
  const reducedMotion = useReducedMotion();
  const [questionIdx, setQuestionIdx] = useState(0);
  const [showInterrupt, setShowInterrupt] = useState(false);
  const [typedLines, setTypedLines] = useState<string[]>([]);
  const [typingDone, setTypingDone] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [showResponse, setShowResponse] = useState(false);

  const cannedResponses = [
    "Good start, but consider the space complexity. What happens with a very large input?",
    "That\u2019s one way to think about it. Can you prove that it\u2019s optimal?",
    "Interesting. How would you handle duplicate values in the array?",
  ];

  useEffect(() => {
    if (reducedMotion || typingDone) {
      setTypedLines(
        codeLines.map((line) => line.tokens.map((t) => t.text).join(""))
      );
      setTypingDone(true);
      return;
    }

    const fullLines = codeLines.map((line) =>
      line.tokens.map((t) => t.text).join("")
    );
    let currentLine = 0;
    let currentChar = 0;
    const result: string[] = [];

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (currentLine >= fullLines.length) {
          clearInterval(interval);
          setTypingDone(true);
          return;
        }
        const line = fullLines[currentLine];
        currentChar++;
        result[currentLine] = line.slice(0, currentChar);
        setTypedLines([...result]);
        if (currentChar >= line.length) {
          currentLine++;
          currentChar = 0;
        }
      }, 30);
      return () => clearInterval(interval);
    }, 500);

    return () => clearTimeout(timeout);
  }, [reducedMotion, typingDone, codeLines]);

  useEffect(() => {
    if (interactive) return;
    const interval = setInterval(() => {
      setShowInterrupt(true);
      setTimeout(() => {
        setShowInterrupt(false);
        setQuestionIdx((prev) => (prev + 1) % aiQuestions.length);
      }, 2500);
    }, 4000);
    return () => clearInterval(interval);
  }, [interactive, aiQuestions]);

  const handleInteractiveSubmit = () => {
    if (!userInput.trim()) return;
    setShowResponse(true);
    setUserInput("");
    setTimeout(() => {
      setShowResponse(false);
      setShowInterrupt(false);
      setQuestionIdx((prev) => (prev + 1) % aiQuestions.length);
      setTimeout(() => setShowInterrupt(true), 1000);
    }, 3000);
  };

  return (
    <div>
      <div className="relative">
        {/* LIVE badge */}
        <motion.div
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-[6px]"
          style={{ background: "rgba(6,214,160,0.1)" }}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
        >
          <span className="live-dot" style={{ width: 6, height: 6 }} />
          <span
            className="text-[10px] font-medium text-[var(--green)]"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            LIVE
          </span>
        </motion.div>

        <div
          className="rounded-[12px] overflow-hidden"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Chrome bar */}
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <motion.span
              className="w-3 h-3 rounded-full bg-[#ff5f57]"
              whileHover={reducedMotion ? {} : { scale: 1.5 }}
              transition={{ type: "spring", stiffness: 500 }}
            />
            <motion.span
              className="w-3 h-3 rounded-full bg-[#febc2e]"
              whileHover={reducedMotion ? {} : { scale: 1.5 }}
              transition={{ type: "spring", stiffness: 500 }}
            />
            <motion.span
              className="w-3 h-3 rounded-full bg-[#28c840]"
              whileHover={reducedMotion ? {} : { scale: 1.5 }}
              transition={{ type: "spring", stiffness: 500 }}
            />
            <span
              className="ml-3 text-[11px] text-[var(--muted)]"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              {fileName} · SViam Interview
            </span>
          </div>

          {/* Code */}
          <div
            className="p-4 space-y-1 min-h-[180px]"
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontSize: "13px",
              lineHeight: "1.7",
            }}
          >
            {codeLines.map((line, li) => {
              const typed = typedLines[li] || "";
              const fullText = line.tokens.map((t) => t.text).join("");
              let charIdx = 0;

              return (
                <motion.div
                  key={li}
                  className="flex"
                  initial={reducedMotion ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: li * 0.05 }}
                >
                  <span
                    className="text-[var(--muted)] w-6 text-right mr-4 select-none text-xs"
                    style={{ opacity: 0.4 }}
                  >
                    {li + 1}
                  </span>
                  <span>
                    {line.tokens.map((t, ti) => {
                      const startIdx = charIdx;
                      charIdx += t.text.length;
                      const visibleChars = Math.max(
                        0,
                        Math.min(t.text.length, typed.length - startIdx)
                      );
                      if (visibleChars <= 0) return null;
                      return (
                        <span
                          key={ti}
                          style={{ color: t.color || "#abb2bf" }}
                        >
                          {t.text.slice(0, visibleChars)}
                        </span>
                      );
                    })}
                    {typed.length < fullText.length &&
                      typed.length > 0 &&
                      li ===
                        typedLines.findIndex(
                          (l, idx) =>
                            (l?.length || 0) <
                            codeLines[idx].tokens
                              .map((t) => t.text)
                              .join("").length
                        ) && (
                        <span
                          className="inline-block w-[2px] h-[14px] ml-0.5 bg-white align-middle"
                          style={{ animation: "blink 1s infinite" }}
                        />
                      )}
                    {typingDone && li === codeLines.length - 1 && (
                      <span
                        className="inline-block w-[2px] h-[14px] ml-0.5 bg-white align-middle"
                        style={{ animation: "blink 1s infinite" }}
                      />
                    )}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* AI Interrupt */}
          <AnimatePresence mode="wait">
            {(showInterrupt || (interactive && questionIdx >= 0)) && (
              <motion.div
                key={questionIdx}
                initial={
                  reducedMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: -15, scale: 0.95, filter: "blur(4px)" }
                }
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(4px)" }}
                transition={{ duration: 0.35, type: "spring", stiffness: 300, damping: 25 }}
                className="mx-4 mb-4 p-3 rounded-[10px]"
                style={{
                  background: "var(--surface)",
                  border: "1px solid",
                  borderImage:
                    "linear-gradient(135deg, var(--accent), var(--teal)) 1",
                }}
              >
                <motion.span
                  className="text-[10px] font-bold tracking-wider mb-1 block"
                  style={{
                    color: "var(--accent2)",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                  animate={reducedMotion ? {} : { opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  AI ASKS
                </motion.span>
                <span
                  className="text-xs text-[var(--text)]"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {showResponse
                    ? cannedResponses[questionIdx % cannedResponses.length]
                    : aiQuestions[questionIdx]}
                </span>

                {/* Interactive input */}
                {interactive && !showResponse && (
                  <motion.div
                    className="flex gap-2 mt-2"
                    initial={reducedMotion ? false : { opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleInteractiveSubmit()
                      }
                      placeholder="Type your answer..."
                      className="flex-1 px-3 py-1.5 rounded-[6px] text-xs text-[var(--text)] placeholder:text-[var(--muted)] outline-none"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid var(--border)",
                        fontFamily: "var(--font-dm-sans)",
                      }}
                    />
                    <motion.button
                      onClick={handleInteractiveSubmit}
                      className="px-3 py-1.5 rounded-[6px] text-[10px] font-medium text-white"
                      style={{ background: "var(--accent)" }}
                      whileHover={reducedMotion ? {} : { scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      Answer
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showCameraFeeds && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          {["Candidate", "Screen Share"].map((label, i) => (
            <motion.div
              key={label}
              className="p-3 rounded-[10px] flex items-center justify-center h-16"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.15, duration: 0.4 }}
              whileHover={reducedMotion ? {} : { borderColor: "var(--accent)", scale: 1.02 }}
            >
              <span
                className="text-[10px] text-[var(--muted)]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {label}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
