import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AutoSubmitFilterForm } from "@/components/filters/AutoSubmitFilterForm";
import { AdminDashboardData, AdminTrendPoint } from "@/lib/admin-dashboard/service";

type AdminDashboardViewProps = {
  data: AdminDashboardData;
};

function clampPercent(value: number | null) {
  if (value == null) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function LineChart({ points }: { points: AdminTrendPoint[] }) {
  const width = 640;
  const height = 160;
  const padding = 24;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-center">
        <p className="text-sm font-semibold text-slate-700">Belum ada data</p>
        <p className="mt-1 text-sm text-slate-500">Coba ganti bulan/periode, atau pastikan guru sudah input nilai.</p>
      </div>
    );
  }

  const values = points.map((point) => point.value).filter((value): value is number => value != null);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 100;
  const range = max - min || 1;

  const toX = (index: number) => padding + (index / Math.max(1, points.length - 1)) * innerWidth;
  const toY = (value: number) => padding + (1 - (value - min) / range) * innerHeight;

  const path = points
    .map((point, index) => {
      if (point.value == null) return null;
      const cmd = index === 0 ? "M" : "L";
      return `${cmd} ${toX(index).toFixed(1)} ${toY(point.value).toFixed(1)}`;
    })
    .filter(Boolean)
    .join(" ");

  return (
    <div className="overflow-x-auto">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-[640px]"
        role="img"
        aria-label="Trend chart"
      >
        <rect x="0" y="0" width={width} height={height} fill="white" />
        <path d={path} fill="none" stroke="#1e3b8a" strokeWidth="3" strokeLinejoin="round" />
        {points.map((point, index) => {
          if (point.value == null) return null;
          const cx = toX(index);
          const cy = toY(point.value);
          return (
            <circle key={point.date} cx={cx} cy={cy} r="4" fill="#1e3b8a">
              <title>
                {point.date} • {point.value} ({point.count})
              </title>
            </circle>
          );
        })}
        {points.map((point, index) => {
          if (index % Math.ceil(points.length / 6) !== 0) return null;
          return (
            <text key={`${point.date}-label`} x={toX(index)} y={height - 8} fontSize="10" textAnchor="middle" fill="#64748b">
              {point.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function BarChart({ points }: { points: AdminTrendPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-center">
        <p className="text-sm font-semibold text-slate-700">Belum ada data</p>
        <p className="mt-1 text-sm text-slate-500">Input absensi terlebih dulu agar trend absensi muncul.</p>
      </div>
    );
  }

  const values = points.map((point) => point.value).filter((value): value is number => value != null);
  const max = values.length ? Math.max(...values) : 100;

  return (
    <div className="space-y-3">
      {points.map((point) => (
        <div key={point.date}>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
            <span>{point.label}</span>
            <span className="font-semibold">{point.value != null ? `${point.value}%` : "-"}</span>
          </div>
          <div className="h-2 rounded bg-slate-100">
            <div
              className="h-2 rounded bg-emerald-500"
              style={{
                width: `${clampPercent(point.value != null ? (point.value / Math.max(1, max)) * 100 : 0)}%`,
              }}
              title={`${point.date} • ${point.value ?? "-"} (${point.count})`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function warningClass(severity: string) {
  if (severity === "danger") return "border-red-200 bg-red-50 text-red-800";
  if (severity === "warn") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function AdminDashboardView({ data }: AdminDashboardViewProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <AdminPageHeader
        title="Dashboard Admin"
        description="Ringkasan absensi dan nilai pada periode/bulan yang dipilih."
      />

      <AdminFormCard title="Filter Ringkasan" description="Gunakan filter untuk melihat tren dan insight.">
        <form id="admin-dashboard-filter-form" action="/dashboard" className="grid gap-4 md:grid-cols-[1.3fr_1fr_auto]">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Periode</span>
            <select
              name="period_id"
              defaultValue={data.selectedPeriodId ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {data.periodOptions.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                  {period.isCurrent ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Bulan</span>
            <select
              name="month"
              defaultValue={data.selectedMonth}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {data.monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Terapkan
            </button>
          </div>
        </form>
        <AutoSubmitFilterForm formId="admin-dashboard-filter-form" />

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Periode:</span> {data.selectedPeriodLabel ?? "-"}
          </p>
        </div>
      </AdminFormCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Enrollment</p>
          <h3 className="mt-2 text-3xl font-black text-slate-900">{data.kpis.totalEnrollments}</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Kehadiran</p>
          <h3 className="mt-2 text-3xl font-black text-emerald-600">{data.kpis.attendanceRate}%</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Rata-rata Nilai Harian</p>
          <h3 className="mt-2 text-3xl font-black text-[#1e3b8a]">{data.kpis.averageDailyScore}</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Task Harian</p>
          <h3 className="mt-2 text-3xl font-black text-slate-900">{data.kpis.tasksCount}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminFormCard title="Trend Absensi" description="Persentase hadir per tanggal (data absensi harian sistem).">
          <BarChart points={data.attendanceTrend} />
        </AdminFormCard>

        <AdminFormCard title="Trend Nilai Harian" description="Rata-rata nilai harian per tanggal task.">
          <LineChart points={data.scoreTrend} />
        </AdminFormCard>
      </div>

      <AdminFormCard title="Perlu Perhatian" description="Insight otomatis agar admin cepat bertindak.">
        {data.warnings.length ? (
          <div className="space-y-3">
            {data.warnings.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className={`rounded-lg border px-4 py-3 text-sm ${warningClass(item.severity)}`}
              >
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm opacity-90">{item.detail}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-center">
            <p className="text-sm font-semibold text-slate-700">Aman</p>
            <p className="mt-1 text-sm text-slate-500">Belum ada warning pada filter ini.</p>
          </div>
        )}
      </AdminFormCard>
    </div>
  );
}
