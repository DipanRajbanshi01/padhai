import { cache } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import type { User as Profile } from "@prisma/client";

/** The authenticated Supabase user, or null. Cached per request. */
export const getAuthUser = cache(async (): Promise<SupabaseUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * The application profile (Prisma `User`) for the signed-in user. Created on
 * first access (covers Google sign-in where we never ran the signup form).
 * Returns null when logged out.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const authUser = await getAuthUser();
  if (!authUser) return null;
  return ensureProfile(authUser);
});

/** Upsert the Prisma profile row for a Supabase auth user. */
export async function ensureProfile(authUser: SupabaseUser): Promise<Profile> {
  const email = authUser.email ?? null;
  const phone = authUser.phone ? `+${authUser.phone}` : null;
  const name =
    (authUser.user_metadata?.full_name as string | undefined) ??
    (authUser.user_metadata?.name as string | undefined) ??
    null;

  return db.user.upsert({
    where: { id: authUser.id },
    update: {}, // don't clobber profile edits on every visit
    create: { id: authUser.id, email, phone, name },
  });
}

/** True when the profile has completed onboarding (chosen a track). */
export function isOnboarded(profile: Profile | null): boolean {
  return !!profile?.classTrack;
}
