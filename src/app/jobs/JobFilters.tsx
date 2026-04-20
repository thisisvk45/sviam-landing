"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const CITIES = ["Bangalore", "Mumbai", "Delhi NCR", "Hyderabad", "Chennai", "Pune", "Remote"];
const LEVELS = ["fresher", "junior", "mid", "senior", "lead"];

export default function JobFilters({
  currentCity,
  currentLevel,
  currentRemote,
}: {
  currentCity?: string;
  currentLevel?: string;
  currentRemote?: string;
}) {
  const router = useRouter();
  const [city, setCity] = useState(currentCity || "");
  const [level, setLevel] = useState(currentLevel || "");
  const [remote, setRemote] = useState(currentRemote === "true");

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (level) params.set("level", level);
    if (remote) params.set("remote", "true");
    router.push(`/jobs?${params}`);
  };

  const clearFilters = () => {
    setCity("");
    setLevel("");
    setRemote(false);
    router.push("/jobs");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={city} onChange={(e) => { setCity(e.target.value); }}
        className="px-3 py-2 rounded-[8px] text-xs outline-none"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-dm-sans)" }}>
        <option value="">All Cities</option>
        {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <select value={level} onChange={(e) => { setLevel(e.target.value); }}
        className="px-3 py-2 rounded-[8px] text-xs outline-none"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-dm-sans)" }}>
        <option value="">All Levels</option>
        {LEVELS.map((l) => <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
      </select>

      <label className="flex items-center gap-1.5 text-xs text-[var(--muted2)] cursor-pointer" style={{ fontFamily: "var(--font-dm-sans)" }}>
        <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)}
          className="rounded" style={{ accentColor: "var(--teal)" }} />
        Remote only
      </label>

      <button onClick={applyFilters}
        className="px-3 py-2 rounded-[8px] text-xs font-medium text-white"
        style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)" }}>
        Apply
      </button>

      {(city || level || remote) && (
        <button onClick={clearFilters}
          className="px-3 py-2 rounded-[8px] text-xs text-[var(--muted2)] hover:text-[var(--text)]"
          style={{ fontFamily: "var(--font-dm-sans)" }}>
          Clear
        </button>
      )}
    </div>
  );
}
