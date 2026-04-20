import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import OnboardingClient from "./OnboardingClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const metadata = {
  title: "Get Started | SViam",
};

export default async function OnboardingPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  // Check if already completed onboarding
  try {
    const res = await fetch(`${API_URL}/profile/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const profile = await res.json();
      const prefs = profile.job_preferences as Record<string, unknown> | null;
      if (prefs?.onboarding_completed) {
        redirect("/dashboard");
      }
    }
  } catch {
    // Continue to onboarding if profile fetch fails
  }

  const meta = session.user.user_metadata;
  const userName = meta?.full_name || meta?.name || "";

  return (
    <OnboardingClient
      token={session.access_token}
      userName={userName}
    />
  );
}
