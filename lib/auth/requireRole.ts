import "server-only";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "student" | "subject_teacher" | "homeroom_teacher";

type ProfileRow = {
  role: AppRole | null;
};

export async function requireRole(allowedRoles: AppRole[]) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || user == null) {
    console.log("[requireRole] unauthenticated", {
      userId: user?.id ?? null,
      role: null,
      allowedRoles,
      userError: userError?.message ?? null,
    });
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<ProfileRow>();

  const role = profile?.role ?? null;

  if (profileError || role == null) {
    console.log("[requireRole] profile missing or invalid", {
      userId: user.id,
      role,
      allowedRoles,
      profileError: profileError?.message ?? null,
    });
    redirect("/unauthorized");
  }

  if (allowedRoles.includes(role) === false) {
    console.log("[requireRole] forbidden role mismatch", {
      userId: user.id,
      role,
      allowedRoles,
    });
    redirect("/unauthorized");
  }

  console.log("[requireRole] authorized", {
    userId: user.id,
    role,
    allowedRoles,
  });

  return {
    user,
    role,
  };
}
