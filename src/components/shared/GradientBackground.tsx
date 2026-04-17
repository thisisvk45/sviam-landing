"use client";

export default function GradientBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Animated gradient mesh �� large blurred shapes */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full"
        style={{
          top: "-20%",
          right: "-15%",
          background:
            "radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 65%)",
          animation: "meshMove 30s ease-in-out infinite",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          bottom: "-10%",
          left: "-10%",
          background:
            "radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 65%)",
          animation: "meshMove 25s ease-in-out infinite reverse",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          top: "40%",
          left: "30%",
          background:
            "radial-gradient(circle, rgba(155,143,255,0.04) 0%, transparent 65%)",
          animation: "meshMove 35s ease-in-out infinite 5s",
          filter: "blur(80px)",
        }}
      />
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
