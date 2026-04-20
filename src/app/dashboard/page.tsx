import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import DashboardClient from "./DashboardClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/?signin=true");
  }

  // Check if onboarding is completed
  try {
    const res = await fetch(`${API_URL}/profile/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const profile = await res.json();
      const prefs = profile.job_preferences as Record<string, unknown> | null;
      if (!prefs?.onboarding_completed && !profile.resume_text) {
        redirect("/onboarding");
      }
    }
  } catch {
    // If profile fetch fails, continue to dashboard
  }

  const meta = session.user.user_metadata;
  const userName = meta?.full_name || meta?.name || "";

  return (
    <DashboardClient
      token={session.access_token}
      email={session.user.email || ""}
      userName={userName}
    />
  );
}
