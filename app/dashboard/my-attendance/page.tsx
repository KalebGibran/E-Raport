import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getStudentAttendancePageData } from "@/lib/student-progress/service";

type StudentAttendancePageProps = {
  searchParams: Promise<{
    period_id?: string;
    month?: string;
  }>;
};

function formatIdDate(dateValue: string) {
  if (!dateValue) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${dateValue}T00:00:00.000Z`));
}

function formatInputDateTime(dateValue: string) {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleString("id-ID");
}

function statusBadgeClass(status: string) {
  if (status === "Hadir") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Sakit") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "Izin") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentAttendancePage({ searchParams }: StudentAttendancePageProps) {
  const params = await searchParams;
  const data = await getStudentAttendancePageData({
    periodId: params.period_id,
    month: params.month,
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <AdminPageHeader
        title="Riwayat Absensi Saya"
        description="Pantau riwayat kehadiran Anda per bulan dan per semester."
      />

      <AdminFormCard title="Filter Absensi" description="Pilih periode dan bulan untuk menampilkan riwayat.">
        <form action="/dashboard/my-attendance" className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto]">
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

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Siswa:</span> {data.studentName}
            {data.nis ? <span className="ml-2 text-xs text-slate-500">(NIS {data.nis})</span> : null}
          </p>
          <p>
            <span className="font-semibold">Periode:</span> {data.selectedPeriodLabel ?? "-"}
          </p>
          <p>
            <span className="font-semibold">Kelas:</span> {data.currentClassroomName ?? "-"}
          </p>
        </div>
      </AdminFormCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Hadir</p>
          <h3 className="mt-2 text-3xl font-black text-emerald-600">{data.summary.present}</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Sakit</p>
          <h3 className="mt-2 text-3xl font-black text-blue-600">{data.summary.sick}</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Izin</p>
          <h3 className="mt-2 text-3xl font-black text-amber-600">{data.summary.permission}</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Alpa</p>
          <h3 className="mt-2 text-3xl font-black text-red-600">{data.summary.absent}</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Persen Hadir</p>
          <h3 className="mt-2 text-3xl font-black text-[#1e3b8a]">{data.summary.attendanceRate}%</h3>
        </div>
      </div>

      <AdminDataTable
        columns={[
          { key: "date", label: "Tanggal" },
          { key: "status", label: "Status" },
          { key: "teacher", label: "Guru Penginput" },
          { key: "input", label: "Waktu Input" },
          { key: "notes", label: "Catatan" },
        ]}
        hasRows={data.rows.length > 0}
        emptyMessage="Belum ada data absensi pada filter ini."
      >
        {data.rows.map((row) => (
          <tr key={row.id}>
            <td className="px-4 py-3 text-sm">{formatIdDate(row.date)}</td>
            <td className="px-4 py-3 text-sm">
              <span className={`rounded border px-2 py-1 text-xs font-semibold ${statusBadgeClass(row.statusLabel)}`}>
                {row.statusLabel}
              </span>
            </td>
            <td className="px-4 py-3 text-sm">{row.teacherName}</td>
            <td className="px-4 py-3 text-sm text-slate-600">{formatInputDateTime(row.inputAt)}</td>
            <td className="px-4 py-3 text-sm text-slate-600">{row.notes || "-"}</td>
          </tr>
        ))}
      </AdminDataTable>
    </div>
  );
}

