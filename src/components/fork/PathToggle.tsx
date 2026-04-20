"use client";

import { useFork, ForkPath } from "./ForkContext";

const options: { id: ForkPath; label: string }[] = [
  { id: "seeker", label: "For job seekers" },
  { id: "hirer", label: "For companies" },
];

export default function PathToggle() {
  const { path, setPath } = useFork();

  if (!path) return null;

  return (
    <div
      className="sticky top-[64px] z-[90] flex justify-center py-4"
      style={{ animation: "fadeInUp 0.4s ease forwards" }}
    >
      <div
        className="inline-flex items-center rounded-full p-1"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          backdropFilter: "blur(20px)",
          transition: "box-shadow 0.3s ease",
        }}
      >
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => {
              if (opt.id && opt.id !== path) setPath(opt.id);
            }}
            className="relative px-5 py-2 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
            style={{
              fontFamily: "var(--font-dm-sans)",
              color: path === opt.id ? "white" : "var(--muted2)",
              background: path === opt.id
                ? (opt.id === "seeker" ? "var(--teal)" : "var(--teal)")
                : "transparent",
              boxShadow: path === opt.id
                ? (opt.id === "seeker" ? "0 0 20px rgba(0,153,153,0.4)" : "0 0 20px rgba(0,212,170,0.4)")
                : "none",
              transition: "background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, transform 0.15s ease",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
