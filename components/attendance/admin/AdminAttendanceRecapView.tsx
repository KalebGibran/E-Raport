import {
  AttendanceAdminMonthlyRecap,
  AttendanceHistoryItem,
  AttendanceMonthOption,
  ClassroomOption,
} from "@/lib/attendance/service";

import { AttendanceRecapStats } from "@/components/attendance/admin/AttendanceRecapStats";
import { AttendanceRecapFilters } from "@/components/attendance/admin/AttendanceRecapFilters";
import { AttendanceMonthlyTable } from "@/components/attendance/admin/AttendanceMonthlyTable";
import { AttendanceInsights } from "@/components/attendance/admin/AttendanceInsights";
import { AttendanceHistoryCard } from "@/components/attendance/admin/AttendanceHistoryCard";

type AdminAttendanceRecapViewProps = {
  selectedClassroom: ClassroomOption | null;
  classrooms: ClassroomOption[];
  monthOptions: AttendanceMonthOption[];
  selectedMonth: string;
  recap: AttendanceAdminMonthlyRecap | null;
  history: AttendanceHistoryItem[];
};

export function AdminAttendanceRecapView({
  selectedClassroom,
  classrooms,
  monthOptions,
  selectedMonth,
  recap,
  history,
}: AdminAttendanceRecapViewProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-8 pb-8 pt-3">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            {selectedClassroom ? `${selectedClassroom.classroomName} Overview` : "Attendance Overview"}
          </h1>
          <p className="mt-1 text-slate-500">
            Detailed attendance log for {recap?.monthLabel ?? monthOptions.find((m) => m.value === selectedMonth)?.label}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500"
          >
            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
            Export PDF
          </button>
          <button
            type="button"
            disabled
            className="flex items-center gap-2 rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white/80"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Export Excel
          </button>
        </div>
      </div>

      {recap ? (
        <>
          <AttendanceRecapStats stats={recap.stats} />
          <AttendanceRecapFilters
            classrooms={classrooms}
            selectedClassroomId={selectedClassroom?.id ?? ""}
            monthOptions={monthOptions}
            selectedMonth={selectedMonth}
          />
          <AttendanceMonthlyTable recap={recap} />
          <AttendanceInsights recap={recap} />
        </>
      ) : (
        <>
          <AttendanceRecapFilters
            classrooms={classrooms}
            selectedClassroomId={selectedClassroom?.id ?? ""}
            monthOptions={monthOptions}
            selectedMonth={selectedMonth}
          />
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Data recap belum tersedia. Pastikan kelas sudah dipilih dan punya data enrollment.
          </div>
        </>
      )}

      <AttendanceHistoryCard history={history} />
    </div>
  );
}
