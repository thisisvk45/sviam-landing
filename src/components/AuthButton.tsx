"use client";

import Link from "next/link";
import { IconBrandGoogle } from "@tabler/icons-react";

export default function AuthButton() {
  return (
    <Link
      href="/register"
      className="w-full py-3.5 rounded-[12px] text-sm font-medium flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        fontFamily: "var(--font-dm-sans)",
        color: "var(--text)",
      }}
    >
      <IconBrandGoogle size={18} />
      <span>Sign up free</span>
    </Link>
  );
}
