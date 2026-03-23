import { ReactNode } from "react";

import { requireRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole(["admin"]);
  return <>{children}</>;
}
