"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { IconLogout } from "@tabler/icons-react";

export default function SignOutButton({ name }: { name?: string }) {
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
    <div className="flex items-center gap-2">
      {name && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
          style={{
            background: "var(--teal)",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      {name && (
        <span
          className="text-xs text-[var(--muted2)] hidden sm:block"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {name}
        </span>
      )}
      <button
        onClick={handleSignOut}
        className="p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
        title="Sign out"
      >
        <IconLogout size={15} />
      </button>
    </div>
  );
}
