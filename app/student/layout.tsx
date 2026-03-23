import { ReactNode } from "react";

import { requireRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentLayout({ children }: { children: ReactNode }) {
  await requireRole(["student"]);
  return <>{children}</>;
}
