import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { getDashboardSession } from "@/lib/auth/dashboard";
import { AdminContext } from "@/lib/admin/types";

export const requireAdminContext = cache(async (): Promise<AdminContext> => {
  const session = await getDashboardSession();

  if (session.profileRole !== "admin") {
    redirect("/unauthorized");
  }

  return {
    userId: session.id,
    email: session.email,
    profileRole: session.profileRole,
  };
});

