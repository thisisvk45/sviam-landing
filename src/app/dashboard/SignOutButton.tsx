"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 text-sm rounded-[10px] text-[var(--muted2)] hover:text-[var(--text)] transition-colors"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      Sign out
    </button>
  );
}
