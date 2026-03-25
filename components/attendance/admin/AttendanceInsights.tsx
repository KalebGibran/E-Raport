import { AttendanceAdminMonthlyRecap } from "@/lib/attendance/service";

type AttendanceInsightsProps = {
  recap: AttendanceAdminMonthlyRecap;
};

export function AttendanceInsights({ recap }: AttendanceInsightsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 pb-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="mb-4 flex items-center gap-2 text-sm font-bold">
          <span className="material-symbols-outlined text-lg text-[#1e3b8a]">equalizer</span>
          Most Absences this Month
        </h4>

        <div className="space-y-4">
          {recap.topAbsences.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada siswa dengan status alpa pada bulan ini.</p>
          ) : null}

          {recap.topAbsences.map((item) => (
            <div key={`${item.studentName}-${item.absentCount}`} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                  {item.initials || "-"}
                </div>
                <span className="text-sm font-medium text-slate-800">{item.studentName}</span>
              </div>
              <span className="rounded bg-red-50 px-2 py-1 text-xs font-bold text-red-500">{item.absentCount} Absences</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="mb-4 flex items-center gap-2 text-sm font-bold">
          <span className="material-symbols-outlined text-lg text-[#1e3b8a]">info</span>
          Quick Note
        </h4>

        <div className="rounded-lg border border-[#1e3b8a]/10 bg-[#1e3b8a]/5 p-4">
          <p className="text-sm leading-relaxed text-slate-600">{recap.quickNote}</p>
        </div>
      </div>
    </div>
  );
}
