import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import ResumeBuilderClient from "./ResumeBuilderClient";

export default async function ResumeBuilderPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/?signin=true");
  }

  return (
    <ResumeBuilderClient
      token={session.access_token}
      email={session.user.email || ""}
    />
  );
}
