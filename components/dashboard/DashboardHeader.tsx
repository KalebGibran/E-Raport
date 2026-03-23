"use client";

import { usePathname } from "next/navigation";

function getPageLabel(pathname: string) {
  if (pathname.startsWith("/dashboard/students")) return "Data Siswa";
  if (pathname.startsWith("/dashboard/teachers")) return "Data Guru";
  if (pathname.startsWith("/dashboard/subjects")) return "Mata Pelajaran";
  if (pathname.startsWith("/dashboard/assignments")) return "Penugasan Guru";
  return "Dashboard";
}

export function DashboardHeader() {
  const pathname = usePathname();
  const pageLabel = getPageLabel(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur-md">
      <div className="m-4 flex items-center gap-2">
        <span className="text-sm text-slate-400">Beranda</span>
        <span className="material-symbols-outlined text-xs text-slate-400">chevron_right</span>
        <span className="text-sm font-medium text-slate-900">{pageLabel}</span>
      </div>
    </header>
  );
}
