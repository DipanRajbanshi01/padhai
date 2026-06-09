import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile, isOnboarded } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * OAuth / email-confirmation callback. Exchanges the `code` for a session,
 * ensures a profile exists, then routes to onboarding (new) or the next page.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await ensureProfile(user);
        const profile = await db.user.findUnique({ where: { id: user.id } });
        const dest = isOnboarded(profile) ? next : "/onboarding";
        return NextResponse.redirect(`${origin}${dest}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=Could not sign you in. Please try again.`);
}
