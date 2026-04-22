import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const tokenHash = req.nextUrl.searchParams.get("token_hash");
  const type = req.nextUrl.searchParams.get("type");
  const origin = req.nextUrl.origin;

  if (!code && !tokenHash) {
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  // Default redirect — will be overridden below
  const defaultRedirect = NextResponse.redirect(`${origin}/dashboard`);

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
            defaultRedirect.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Exchange code/token for session
  let authError: Error | null = null;
  if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "email" | "signup" | "recovery" });
    authError = result.error;
  } else if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    authError = result.error;
  }

  if (authError) {
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  // Helper to redirect while preserving auth cookies
  const makeRedirect = (path: string) => {
    const resp = NextResponse.redirect(`${origin}${path}`);
    defaultRedirect.cookies.getAll().forEach(cookie => {
      resp.cookies.set(cookie.name, cookie.value);
    });
    resp.cookies.set("sviam_user_type", "", { maxAge: 0 });
    return resp;
  };

  // ── HIRER CHECK: cookie is the user's explicit choice — redirect immediately ──
  const userTypeCookie = req.cookies.get("sviam_user_type")?.value;
  if (userTypeCookie === "hirer") {
    // Fire-and-forget: persist user_type to backend profile
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      fetch(`${API_URL}/profile/me`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_type: "hirer" }),
      }).catch(() => {});
    }
    return makeRedirect("/company");
  }

  // ── Check auth metadata (email signup stores user_type there) ──
  const { data: { session } } = await supabase.auth.getSession();
  const authUserType = session?.user?.user_metadata?.user_type as string | undefined;
  if (authUserType === "hirer") {
    return makeRedirect("/company");
  }

  // ── SEEKER / RETURNING USER: check backend profile ──
  if (session?.access_token) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const profileRes = await fetch(`${API_URL}/profile/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (profileRes.ok) {
        const profile = await profileRes.json();

        // Existing hirer returning via sign-in (no cookie needed)
        if (profile.user_type === "hirer") {
          return makeRedirect("/company");
        }

        // Seeker: check if onboarding is done
        if (!profile.resume_text && !profile.city) {
          return makeRedirect("/onboarding");
        }
      } else if (profileRes.status === 404) {
        // Brand new user, no profile yet → onboarding
        return makeRedirect("/onboarding");
      }
    } catch {
      // Backend down — just go to dashboard, it'll handle redirect client-side
    }
  }

  return defaultRedirect;
}
