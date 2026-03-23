import { ReactNode } from "react";

import { DashboardUser } from "@/lib/auth/dashboard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

type DashboardShellProps = {
  user: DashboardUser;
  children: ReactNode;
};

export function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-[#f5f7fb] text-slate-900">
      <DashboardSidebar displayName={user.displayName} email={user.email} role={user.role} />

      <main className="flex h-screen flex-1 flex-col overflow-y-auto">
        <DashboardHeader />
        {children}
        <footer className="mt-auto border-t border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-500">
            © 2024 E-Raport - Sistem Informasi Manajemen Sekolah Digital.
          </p>
        </footer>
      </main>
    </div>
  );
}
