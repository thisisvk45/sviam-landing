import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/?signin=true");
  }

  return (
    <ProfileClient
      token={session.access_token}
      email={session.user.email || ""}
    />
  );
}
