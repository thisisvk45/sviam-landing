import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const origin = req.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  // Temporarily redirect to dashboard; we'll check profile below
  const dashboardResponse = NextResponse.redirect(`${origin}/dashboard`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            dashboardResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  // Check user type (seeker vs hirer) from cookie set during registration
  const userType = req.cookies.get("sviam_user_type")?.value;

  // Check if user has completed onboarding (has a profile with preferences)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const { data: { session } } = await supabase.auth.getSession();

  // Helper to create redirect with cookies
  const makeRedirect = (path: string) => {
    const resp = NextResponse.redirect(`${origin}${path}`);
    dashboardResponse.cookies.getAll().forEach(cookie => {
      resp.cookies.set(cookie.name, cookie.value);
    });
    // Clear the user type cookie after use
    resp.cookies.set("sviam_user_type", "", { maxAge: 0 });
    return resp;
  };

  // Hirers go to company-coming-soon
  if (userType === "hirer") {
    return makeRedirect("/company-coming-soon");
  }

  if (session?.access_token) {
    try {
      const profileRes = await fetch(`${API_URL}/profile/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        // If profile has no resume and no city set, they're new — send to onboarding
        if (!profile.resume_text && !profile.city) {
          return makeRedirect("/onboarding");
        }
      } else if (profileRes.status === 404) {
        // No profile at all — new user, go to onboarding
        return makeRedirect("/onboarding");
      }
    } catch {
      // If profile check fails, default to dashboard
    }
  }

  return dashboardResponse;
}
