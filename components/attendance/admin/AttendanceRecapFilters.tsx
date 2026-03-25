import { AttendanceMonthOption, ClassroomOption } from "@/lib/attendance/service";

type AttendanceRecapFiltersProps = {
  classrooms: ClassroomOption[];
  selectedClassroomId: string;
  monthOptions: AttendanceMonthOption[];
  selectedMonth: string;
};

export function AttendanceRecapFilters({
  classrooms,
  selectedClassroomId,
  monthOptions,
  selectedMonth,
}: AttendanceRecapFiltersProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <form action="/dashboard/attendance" className="flex flex-wrap items-end gap-4">
        <label className="min-w-[220px] flex-1">
          <span className="mb-1 ml-1 block text-[10px] font-bold uppercase text-slate-500">Class Room</span>
          <select
            name="classroom_id"
            defaultValue={selectedClassroomId}
            className="w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:border-[#1e3b8a] focus:ring-[#1e3b8a]"
          >
            <option value="">Pilih kelas</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.classroomName}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-[220px] flex-1">
          <span className="mb-1 ml-1 block text-[10px] font-bold uppercase text-slate-500">Month</span>
          <select
            name="month"
            defaultValue={selectedMonth}
            className="w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:border-[#1e3b8a] focus:ring-[#1e3b8a]"
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-900"
        >
          Terapkan Filter
        </button>

        <div className="ml-auto flex items-center gap-4 px-2 pb-2 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            Present (H)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-500" />
            Sick (S)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" />
            Excused (I)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-red-500" />
            Absent (A)
          </div>
        </div>
      </form>
    </div>
  );
}
