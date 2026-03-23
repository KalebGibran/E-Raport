import { ReactNode } from "react";
import { Inter } from "next/font/google";

import { getDashboardSession } from "@/lib/auth/dashboard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

const inter = Inter({
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getDashboardSession();

  return (
    <div className={inter.className}>
      <DashboardShell user={user}>{children}</DashboardShell>
    </div>
  );
}
