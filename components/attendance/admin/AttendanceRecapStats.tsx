import { AttendanceMonthlyStats } from "@/lib/attendance/service";

type AttendanceRecapStatsProps = {
  stats: AttendanceMonthlyStats;
};

function formatTrend(delta: number | null) {
  if (delta == null) {
    return {
      label: "-",
      className: "text-slate-400",
      icon: "trending_flat",
    };
  }

  if (delta > 0) {
    return {
      label: `+${delta.toFixed(1)}%`,
      className: "text-green-600",
      icon: "trending_up",
    };
  }

  if (delta < 0) {
    return {
      label: `${delta.toFixed(1)}%`,
      className: "text-red-600",
      icon: "trending_down",
    };
  }

  return {
    label: "0.0%",
    className: "text-slate-500",
    icon: "trending_flat",
  };
}

export function AttendanceRecapStats({ stats }: AttendanceRecapStatsProps) {
  const trend = formatTrend(stats.trendDelta);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="rounded-lg bg-green-100 p-2 text-green-700">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <span className={`flex items-center gap-1 text-sm font-bold ${trend.className}`}>
            <span className="material-symbols-outlined text-xs">{trend.icon}</span>
            {trend.label}
          </span>
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg. Attendance</p>
        <h3 className="mt-1 text-2xl font-black text-slate-900">{stats.averageAttendance.toFixed(1)}%</h3>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
            <span className="material-symbols-outlined">person</span>
          </div>
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Students</p>
        <h3 className="mt-1 text-2xl font-black text-slate-900">{stats.totalStudents} Students</h3>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
            <span className="material-symbols-outlined">warning</span>
          </div>
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Absences (A)</p>
        <h3 className="mt-1 text-2xl font-black text-slate-900">{stats.totalAbsences} Days</h3>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="rounded-lg bg-purple-100 p-2 text-purple-700">
            <span className="material-symbols-outlined">medical_services</span>
          </div>
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Sick Leaves (S)</p>
        <h3 className="mt-1 text-2xl font-black text-slate-900">{stats.totalSickLeaves} Days</h3>
      </div>
    </div>
  );
}
