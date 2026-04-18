import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, user_type, company_name, hiring_role, hiring_level, looking_for, experience_level } = body;

    if (!name || !email || !user_type) {
      return NextResponse.json(
        { error: "Name, email, and type are required." },
        { status: 400 }
      );
    }

    if (!["candidate", "company"].includes(user_type)) {
      return NextResponse.json(
        { error: "Invalid user type." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { error } = await supabase.from("waitlist").insert({
      name,
      email,
      user_type,
      company_name: company_name || null,
      hiring_role: hiring_role || null,
      hiring_level: hiring_level || null,
      looking_for: looking_for || null,
      experience_level: experience_level || null,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You're already on the list!" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Something went wrong. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Waitlist API error:", err);
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}
