import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import InterviewPrepClient from "./InterviewPrepClient";

export default async function InterviewPrepPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/?signin=true");
  }

  return (
    <InterviewPrepClient
      token={session.access_token}
      email={session.user.email || ""}
    />
  );
}
