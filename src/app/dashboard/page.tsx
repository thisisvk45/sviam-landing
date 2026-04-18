import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/?signin=true");
  }

  return <DashboardClient token={session.access_token} email={session.user.email || ""} />;
}
