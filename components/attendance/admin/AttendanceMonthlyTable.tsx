import {
  AttendanceAdminMonthlyRecap,
  AttendanceMonthlyDayColumn,
  AttendanceStatus,
} from "@/lib/attendance/service";

type AttendanceMonthlyTableProps = {
  recap: AttendanceAdminMonthlyRecap;
};

function getCellDisplay(status: AttendanceStatus | null, day: AttendanceMonthlyDayColumn) {
  if (day.isWeekend || day.isHoliday) {
    return {
      label: "-",
      className: "bg-slate-50 text-slate-400",
    };
  }

  if (status === "present") {
    return { label: "H", className: "text-emerald-600" };
  }

  if (status === "sick") {
    return { label: "S", className: "text-blue-600" };
  }

  if (status === "permission") {
    return { label: "I", className: "text-amber-600" };
  }

  if (status === "absent") {
    return { label: "A", className: "text-red-600" };
  }

  return { label: "-", className: "text-slate-300" };
}

export function AttendanceMonthlyTable({ recap }: AttendanceMonthlyTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th className="sticky left-0 z-10 w-56 border-b border-slate-200 bg-slate-50 px-4 py-3">Student Name</th>
              {recap.dayColumns.map((day) => (
                <th
                  key={day.date}
                  className={`w-8 border-b border-slate-200 px-1 py-3 text-center ${
                    day.isWeekend || day.isHoliday ? "bg-slate-100" : ""
                  }`}
                >
                  {day.dayNumber}
                </th>
              ))}
              <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-center">H</th>
              <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-center">S</th>
              <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-center">I</th>
              <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-center">A</th>
              <th className="border-b border-slate-200 bg-[#eef2ff] px-4 py-3 text-center text-[#1e3b8a]">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recap.students.length === 0 ? (
              <tr>
                <td colSpan={recap.dayColumns.length + 6} className="px-4 py-6 text-center text-sm text-slate-500">
                  Belum ada siswa pada kelas ini untuk periode yang dipilih.
                </td>
              </tr>
            ) : null}

            {recap.students.map((student) => (
              <tr key={student.enrollmentId} className="transition-colors hover:bg-slate-50/70">
                <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm font-medium text-slate-800">
                  {student.fullName}
                </td>
                {student.dayStatuses.map((status, index) => {
                  const day = recap.dayColumns[index];
                  const display = getCellDisplay(status, day);
                  const title = day.isHoliday
                    ? day.holidayName ?? "Hari libur nasional"
                    : day.isWeekend
                      ? "Akhir pekan"
                      : "Hari sekolah";

                  return (
                    <td
                      key={`${student.enrollmentId}-${day.date}`}
                      title={title}
                      className={`px-1 py-3 text-center text-[10px] font-bold ${display.className}`}
                    >
                      {display.label}
                    </td>
                  );
                })}
                <td className="px-3 py-3 text-center text-sm font-semibold text-slate-800">{student.summary.present}</td>
                <td className="px-3 py-3 text-center text-sm font-semibold text-blue-500">{student.summary.sick}</td>
                <td className="px-3 py-3 text-center text-sm font-semibold text-amber-500">{student.summary.permission}</td>
                <td className="px-3 py-3 text-center text-sm font-semibold text-red-500">{student.summary.absent}</td>
                <td className="px-4 py-3 text-center text-sm font-bold text-[#1e3b8a]">{student.summary.attendanceRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
        <p className="text-xs font-medium text-slate-500">
          Showing {recap.students.length} students in {recap.classroomLabel} ({recap.monthLabel})
        </p>
      </div>
    </div>
  );
}
