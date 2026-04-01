"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { DashboardRole } from "@/lib/auth/roles";
import type { RecapClassroomOption, RecapPeriodOption, RecapStudentOption } from "@/lib/recap/service";

type RecapFiltersFormProps = {
  role: DashboardRole;
  periodOptions: RecapPeriodOption[];
  classroomOptions: RecapClassroomOption[];
  studentOptions: RecapStudentOption[];
  selectedPeriodId: string | null;
  selectedClassroomId: string | null;
  selectedStudentId: string | null;
};

export function RecapFiltersForm({
  role,
  periodOptions,
  classroomOptions,
  studentOptions,
  selectedPeriodId,
  selectedClassroomId,
  selectedStudentId,
}: RecapFiltersFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateFilters(next: { periodId?: string; classroomId?: string; studentId?: string }) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.periodId !== undefined) {
      params.set("period_id", next.periodId);
      if (role === "admin") {
        params.delete("classroom_id");
        params.delete("student_id");
      }
    }

    if (next.classroomId !== undefined) {
      params.set("classroom_id", next.classroomId);
      params.delete("student_id");
    }

    if (next.studentId !== undefined) {
      params.set("student_id", next.studentId);
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className={role === "admin" ? "grid gap-4 md:grid-cols-3" : "grid gap-4 md:grid-cols-1"}>
      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Periode</span>
        <select
          value={selectedPeriodId ?? ""}
          onChange={(event) => updateFilters({ periodId: event.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          {periodOptions.map((period) => (
            <option key={period.id} value={period.id}>
              {period.label}
              {period.isCurrent ? " (Current)" : ""}
            </option>
          ))}
        </select>
      </label>

      {role === "admin" ? (
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Kelas</span>
          <select
            value={selectedClassroomId ?? ""}
            onChange={(event) => updateFilters({ classroomId: event.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {classroomOptions.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {role === "admin" ? (
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Nama Siswa</span>
          <select
            value={selectedStudentId ?? ""}
            onChange={(event) => updateFilters({ studentId: event.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {studentOptions.map((student) => (
              <option key={student.id} value={student.id}>
                {student.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
