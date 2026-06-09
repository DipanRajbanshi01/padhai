"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, ensureProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { TRACKS } from "@/lib/tracks";

export type AuthState = { error?: string; message?: string };

function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  // Only allow internal paths (prevent open redirect).
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

/* ------------------------------- Email/password ------------------------------- */

export async function loginWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const user = await getAuthUser();
  if (user) await ensureProfile(user);

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUpWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });
  if (error) return { error: error.message };

  // If email confirmation is OFF, a session exists immediately → create profile.
  if (data.user && data.session) {
    await ensureProfile(data.user);
    revalidatePath("/", "layout");
    redirect("/onboarding");
  }

  return {
    message: "Check your email to confirm your account, then log in.",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/* ------------------------------- Onboarding ------------------------------- */

export async function saveOnboarding(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const classTrack = String(formData.get("classTrack") ?? "").trim();
  const targetExam = String(formData.get("targetExam") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!TRACKS.some((t) => t.code === classTrack)) {
    return { error: "Please choose your track." };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      classTrack,
      targetExam: targetExam || null,
      location: location || null,
      ...(name ? { name } : {}),
    },
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/* ------------------------------- Phone OTP (stub) ------------------------------- */
/**
 * Phone OTP is OTP-ready but not wired to an SMS provider yet (brief §10 Q3).
 * The schema (OtpCode) and these actions are in place; once an SMS provider is
 * chosen, generate + send the code here and verify against the hashed row.
 */
export async function requestOtp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) return { error: "Enter your phone number." };

  if (!process.env.SMS_PROVIDER) {
    return {
      error:
        "Phone OTP isn't enabled yet — please use email or Google for now. (Wire an SMS provider to turn this on.)",
    };
  }

  // TODO(Phase: OTP): generate a 6-digit code, store hashed in OtpCode, send via SMS.
  return { message: "If OTP were enabled, a code would be on its way." };
}
