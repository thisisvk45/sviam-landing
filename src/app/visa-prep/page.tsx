import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import VisaPrepClient from "./VisaPrepClient";

export default async function VisaPrepPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/?signin=true");
  }

  return <VisaPrepClient token={session.access_token} />;
}
