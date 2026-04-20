"use client";

import { useState, useEffect } from "react";
import { usePrefersReducedMotion } from "@/hooks/useInView";

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
  const reducedMotion = usePrefersReducedMotion();
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
        <div
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-[6px]"
          style={{
            background: "rgba(6,214,160,0.1)",
            animation: reducedMotion ? "none" : "css-fade-in 0.5s ease-out 0.5s both",
          }}
        >
          <span className="live-dot" style={{ width: 6, height: 6 }} />
          <span
            className="text-[10px] font-medium text-[var(--green)]"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            LIVE
          </span>
        </div>

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
            <span className="w-3 h-3 rounded-full bg-[#ff5f57] transition-transform hover:scale-150" />
            <span className="w-3 h-3 rounded-full bg-[#febc2e] transition-transform hover:scale-150" />
            <span className="w-3 h-3 rounded-full bg-[#28c840] transition-transform hover:scale-150" />
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
                <div
                  key={li}
                  className="flex"
                  style={{
                    animation: reducedMotion
                      ? "none"
                      : `css-fade-in 0.3s ease-out ${li * 0.05}s both`,
                  }}
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
                </div>
              );
            })}
          </div>

          {/* AI Interrupt */}
          {(showInterrupt || (interactive && questionIdx >= 0)) && (
            <div
              key={questionIdx}
              className="mx-4 mb-4 p-3 rounded-[10px]"
              style={{
                background: "var(--surface)",
                border: "1px solid",
                borderImage:
                  "linear-gradient(135deg, var(--teal), var(--teal)) 1",
                animation: reducedMotion
                  ? "none"
                  : "css-fade-in 0.35s ease-out both",
              }}
            >
              <span
                className="text-[10px] font-bold tracking-wider mb-1 block"
                style={{
                  color: "var(--accent2)",
                  fontFamily: "var(--font-dm-sans)",
                  animation: reducedMotion ? "none" : "pulse-opacity 1.5s infinite",
                }}
              >
                AI ASKS
              </span>
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
                <div
                  className="flex gap-2 mt-2"
                  style={{
                    animation: reducedMotion
                      ? "none"
                      : "css-fade-in 0.3s ease-out 0.2s both",
                  }}
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
                  <button
                    onClick={handleInteractiveSubmit}
                    className="px-3 py-1.5 rounded-[6px] text-[10px] font-medium text-white hover-scale transition-transform"
                    style={{ background: "var(--teal)" }}
                  >
                    Answer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showCameraFeeds && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          {["Candidate", "Screen Share"].map((label, i) => (
            <div
              key={label}
              className="p-3 rounded-[10px] flex items-center justify-center h-16 hover-lift transition-all duration-300"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                animation: reducedMotion
                  ? "none"
                  : `css-fade-in 0.4s ease-out ${0.8 + i * 0.15}s both`,
              }}
            >
              <span
                className="text-[10px] text-[var(--muted)]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
