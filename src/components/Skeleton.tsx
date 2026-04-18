"use client";

export function JobCardSkeleton() {
  return (
    <div
      className="p-5 rounded-[16px] flex gap-4 animate-pulse"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div
        className="w-14 h-14 rounded-[12px] flex-shrink-0"
        style={{ background: "var(--surface)" }}
      />
      <div className="flex-1 space-y-3">
        <div className="h-4 rounded w-3/4" style={{ background: "var(--surface)" }} />
        <div className="h-3 rounded w-1/2" style={{ background: "var(--surface)" }} />
        <div className="flex gap-2">
          <div className="h-5 rounded-full w-16" style={{ background: "var(--surface)" }} />
          <div className="h-5 rounded-full w-20" style={{ background: "var(--surface)" }} />
          <div className="h-5 rounded-full w-14" style={{ background: "var(--surface)" }} />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div
      className="p-6 rounded-[16px] animate-pulse space-y-4"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="h-4 rounded w-1/3" style={{ background: "var(--surface)" }} />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 rounded w-1/4" style={{ background: "var(--surface)" }} />
            <div className="h-3 rounded w-1/3" style={{ background: "var(--surface)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
