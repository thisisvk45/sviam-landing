"use client";

import { motion, useReducedMotion } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { IconBrandGoogle } from "@tabler/icons-react";

export default function AuthButton() {
  const reducedMotion = useReducedMotion();

  const signInWithGoogle = () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <motion.button
      type="button"
      onClick={signInWithGoogle}
      className="w-full py-3.5 rounded-[12px] text-sm font-medium text-white flex items-center justify-center gap-3"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        fontFamily: "var(--font-dm-sans)",
        color: "var(--text)",
      }}
      whileHover={
        reducedMotion
          ? {}
          : { scale: 1.02, borderColor: "rgba(99,102,241,0.4)" }
      }
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <IconBrandGoogle size={18} />
      <span>Continue with Google</span>
    </motion.button>
  );
}
