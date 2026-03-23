import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { User } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { DashboardRole, ProfileRole, normalizeDashboardRole } from "@/lib/auth/roles";

type ProfileRow = {
  full_name: string;
  role: ProfileRole;
};

export type DashboardUser = {
  id: string;
  email: string;
  displayName: string;
  role: DashboardRole;
  profileRole: ProfileRole;
};

function getMetadataValue(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function syncDashboardMetadata(user: User, profile: ProfileRow, dashboardRole: DashboardRole) {
  const currentName = getMetadataValue(user, "name");
  const currentRole = getMetadataValue(user, "role");
  const nextName = profile.full_name;

  if (currentName === nextName && currentRole === dashboardRole) {
    return;
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      full_name: profile.full_name,
      name: nextName,
      role: dashboardRole,
    },
  });

  if (error) {
    console.error("[dashboard] failed to sync auth metadata", {
      userId: user.id,
      error: error.message,
    });
  }
}

export const getDashboardSession = cache(async (): Promise<DashboardUser> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single<ProfileRow>();

  const dashboardRole = normalizeDashboardRole(profile?.role);

  if (profileError || !profile || !dashboardRole) {
    console.log("[dashboard] unauthorized", {
      userId: user.id,
      profileRole: profile?.role ?? null,
      profileError: profileError?.message ?? null,
    });
    redirect("/unauthorized");
  }

  await syncDashboardMetadata(user, profile, dashboardRole);

  return {
    id: user.id,
    email: user.email,
    displayName: getMetadataValue(user, "name") ?? profile.full_name ?? user.email,
    role: dashboardRole,
    profileRole: profile.role,
  };
});
