"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DashboardRole } from "@/lib/auth/roles";

import { LogoutButton } from "@/components/dashboard/LogoutButton";

type DashboardSidebarProps = {
  displayName: string;
  email: string;
  role: DashboardRole;
};

type NavItem = {
  label: string;
  icon: string;
  href: string;
  roles: DashboardRole[];
};

function getNavItems(role: DashboardRole): NavItem[] {
  if (role === "admin") {
    return [
      { label: "Dashboard", icon: "dashboard", href: "/dashboard", roles: ["admin"] },
      { label: "Data Siswa", icon: "group", href: "/dashboard/students", roles: ["admin"] },
      { label: "Data Guru", icon: "person", href: "/dashboard/teachers", roles: ["admin"] },
      { label: "Mata Pelajaran", icon: "book", href: "/dashboard/subjects", roles: ["admin"] },
      { label: "Data Kelas", icon: "meeting_room", href: "/dashboard/classrooms", roles: ["admin"] },
      { label: "Periode Akademik", icon: "calendar_month", href: "/dashboard/periods", roles: ["admin"] },
      {
        label: "Enrollment",
        icon: "how_to_reg",
        href: "/dashboard/enrollments",
        roles: ["admin"],
      },
      {
        label: "Penugasan Guru",
        icon: "assignment_ind",
        href: "/dashboard/assignments",
        roles: ["admin"],
      },
      {
        label: "Academic Management",
        icon: "school",
        href: "/dashboard/promotion",
        roles: ["admin"],
      },
    ];
  }

  if (role === "guru") {
    return [
      { label: "Dashboard", icon: "dashboard", href: "/dashboard", roles: ["guru"] },
      { label: "Data Siswa", icon: "group", href: "/dashboard", roles: ["guru"] },
      { label: "Mata Pelajaran", icon: "book", href: "/dashboard", roles: ["guru"] },
      { label: "Nilai Raport", icon: "description", href: "/dashboard", roles: ["guru"] },
    ];
  }

  return [
    { label: "Dashboard", icon: "dashboard", href: "/dashboard", roles: ["murid"] },
    { label: "Nilai Raport", icon: "description", href: "/dashboard", roles: ["murid"] },
  ];
}

function getProfileInitials(displayName: string) {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase() ?? "")
    .join("");
}

export function DashboardSidebar({ displayName, email, role }: DashboardSidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role).filter((item) => item.roles.includes(role));

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="sticky top-0 flex h-screen w-72 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e3b8a] text-white">
          <span className="material-symbols-outlined">auto_stories</span>
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight text-[#1e3b8a]">E-Raport</h1>
          <p className="text-xs font-medium text-slate-500">Sistem Akademik v2.0</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={
              isActive(item.href)
                ? "flex items-center gap-3 rounded-lg bg-[#e9efff] px-3 py-2.5 text-[#1e3b8a] transition-colors"
                : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 transition-colors hover:bg-slate-100"
            }
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="text-sm font-semibold">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3 p-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-[#1e3b8a]/20 text-sm font-bold text-[#1e3b8a]">
            {getProfileInitials(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{displayName}</p>
            <p className="truncate text-xs text-slate-500">{email}</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
